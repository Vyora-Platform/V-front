import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getVendorId } from "@/hooks/useVendor";
import type { VendorCatalogue, Customer } from "@shared/schema";

const bookingFormSchema = z.object({
  vendorCatalogueId: z.string().min(1, "Please select a service"),
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().min(10, "Valid phone number is required"),
  patientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  patientAge: z.coerce.number().min(1).max(150).optional(),
  patientGender: z.enum(["male", "female", "other"]).optional(),
  bookingDate: z.date({ required_error: "Booking date is required" }),
  isHomeCollection: z.boolean().default(false),
  collectionAddress: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Require collection address when home collection is enabled
    if (data.isHomeCollection && !data.collectionAddress?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Collection address is required for home collection",
    path: ["collectionAddress"],
  }
);

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BookingFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: BookingFormDialogProps) {
  const { toast } = useToast();
  const VENDOR_ID = getVendorId(); // Get real vendor ID from localStorage
  const [selectedService, setSelectedService] = useState<VendorCatalogue | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch vendor's catalogue/services
  const { data: services = [], isLoading: servicesLoading } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${VENDOR_ID}/catalogue`],
    enabled: open,
  });

  // Fetch vendor's customers
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [`/api/vendors/${VENDOR_ID}/customers`],
    enabled: open,
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      vendorCatalogueId: "",
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      patientAge: undefined,
      patientGender: undefined,
      bookingDate: undefined,
      isHomeCollection: false,
      collectionAddress: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      if (!selectedService) {
        throw new Error("Service not selected");
      }

      // Calculate pricing - Parse to numbers to avoid string concatenation
      const price = Number(selectedService.offerPrice ?? selectedService.price);
      const homeCollectionCharges = data.isHomeCollection 
        ? Number(selectedService.homeCollectionCharges ?? 0) 
        : 0;
      const totalAmount = price + homeCollectionCharges;

      const bookingData = {
        vendorId: VENDOR_ID,
        vendorCatalogueId: data.vendorCatalogueId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail || null,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        bookingDate: data.bookingDate.toISOString(),
        isHomeCollection: data.isHomeCollection,
        collectionAddress: data.isHomeCollection ? data.collectionAddress : null,
        price,
        homeCollectionCharges,
        totalAmount,
        status: "pending",
        paymentStatus: "pending",
        notes: data.notes || null,
        assignedTo: null,
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking created successfully",
        description: "The booking has been added to your list.",
      });
      form.reset();
      setSelectedService(null);
      setSelectedCustomer(null);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
    form.setValue("vendorCatalogueId", serviceId);
    
    // Auto-set home collection if not available
    if (service && !service.homeCollectionAvailable) {
      form.setValue("isHomeCollection", false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "new") {
      // Clear fields for new customer
      setSelectedCustomer(null);
      form.setValue("patientName", "");
      form.setValue("patientPhone", "");
      form.setValue("patientEmail", "");
      form.setValue("patientAge", undefined);
      form.setValue("patientGender", undefined);
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      // Auto-fill customer details
      form.setValue("patientName", customer.name || "");
      form.setValue("patientPhone", customer.phone || "");
      form.setValue("patientEmail", customer.email || "");
      if (customer.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(customer.dateOfBirth).getFullYear();
        form.setValue("patientAge", age);
      }
      if (customer.gender) {
        form.setValue("patientGender", customer.gender as "male" | "female" | "other");
      }
    }
  };

  const handleSubmit = (data: BookingFormValues) => {
    createBookingMutation.mutate(data);
  };

  const isHomeCollection = form.watch("isHomeCollection");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Add a new service booking for a customer
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Service Selection */}
            <FormField
              control={form.control}
              name="vendorCatalogueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service *</FormLabel>
                  <Select
                    onValueChange={handleServiceChange}
                    value={field.value}
                    disabled={servicesLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-service">
                        <SelectValue placeholder={servicesLoading ? "Loading services..." : "Select a service"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ₹{service.offerPrice || service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (
                    <FormDescription>
                      Price: ₹{Number(selectedService.offerPrice ?? selectedService.price)}
                      {selectedService.homeCollectionAvailable && 
                        ` | Home Service: ₹${Number(selectedService.homeCollectionCharges ?? 0)}`}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Selection */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <h3 className="text-sm font-semibold">Select Customer</h3>
              <Select
                onValueChange={handleCustomerChange}
                value={selectedCustomer?.id || "new"}
                disabled={customersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select existing customer or enter new"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Customer (Manual Entry)
                    </span>
                  </SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="text-xs text-muted-foreground">
                  ✓ Customer details auto-filled. You can still modify them below.
                </div>
              )}
            </div>

            {/* Customer Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Customer Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} data-testid="input-patient-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} data-testid="input-patient-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email (optional)" {...field} data-testid="input-patient-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter age (optional)" {...field} data-testid="input-patient-age" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select gender (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bookingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Booking Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-select-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Home Service Section */}
            {selectedService?.homeCollectionAvailable && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isHomeCollection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Home Service</FormLabel>
                        <FormDescription>
                          Enable at-home service delivery (₹{Number(selectedService.homeCollectionCharges ?? 0)} extra)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-home-collection"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isHomeCollection && (
                  <FormField
                    control={form.control}
                    name="collectionAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter complete address for service delivery"
                            className="resize-none"
                            {...field}
                            data-testid="input-collection-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or instructions"
                      className="resize-none"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing Summary */}
            {selectedService && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Pricing Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Service Price:</span>
                    <span>₹{Number(selectedService.offerPrice ?? selectedService.price)}</span>
                  </div>
                  {isHomeCollection && (
                    <div className="flex justify-between">
                      <span>Home Service:</span>
                      <span>₹{Number(selectedService.homeCollectionCharges ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>
                      ₹{Number(selectedService.offerPrice ?? selectedService.price) + 
                        (isHomeCollection ? Number(selectedService.homeCollectionCharges ?? 0) : 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createBookingMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBookingMutation.isPending}
                data-testid="button-create-booking"
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
