import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, IndianRupee, UserCheck } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getVendorId } from "@/hooks/useVendor";
import type { VendorCatalogue, Customer, Employee } from "@shared/schema";

// Time slot options
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

// Additional charge type
interface AdditionalCharge {
  name: string;
  amount: number;
  description?: string;
}

const bookingFormSchema = z.object({
  vendorCatalogueId: z.string().min(1, "Please select a service"),
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().min(10, "Valid phone number is required"),
  patientEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  patientAge: z.coerce.number().min(1).max(150).optional(),
  patientGender: z.enum(["male", "female", "other"]).optional(),
  bookingDate: z.date({ required_error: "Booking date is required" }),
  timeSlot: z.string().optional(),
  isHomeCollection: z.boolean().default(false),
  collectionAddress: z.string().optional(),
  notes: z.string().optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).default("pending"),
  assignedTo: z.string().optional(),
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
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");

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

  // Fetch vendor's employees for assignment
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${VENDOR_ID}/employees`],
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
      timeSlot: "",
      isHomeCollection: false,
      collectionAddress: "",
      notes: "",
      paymentStatus: "pending",
      assignedTo: "",
    },
  });

  // Calculate total additional charges
  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

  // Add additional charge
  const handleAddCharge = () => {
    if (newChargeName && newChargeAmount && parseFloat(newChargeAmount) > 0) {
      setAdditionalCharges([
        ...additionalCharges,
        { name: newChargeName, amount: parseFloat(newChargeAmount) }
      ]);
      setNewChargeName("");
      setNewChargeAmount("");
    }
  };

  // Remove additional charge
  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

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
      const totalAmount = price + homeCollectionCharges + totalAdditionalCharges;

      const bookingData = {
        vendorId: VENDOR_ID,
        vendorCatalogueId: data.vendorCatalogueId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail || null,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        bookingDate: data.bookingDate.toISOString(),
        timeSlot: data.timeSlot || null,
        isHomeCollection: data.isHomeCollection,
        collectionAddress: data.isHomeCollection ? data.collectionAddress : null,
        price,
        homeCollectionCharges,
        additionalCharges: additionalCharges.length > 0 ? additionalCharges : [],
        totalAmount,
        status: "pending",
        paymentStatus: data.paymentStatus || "pending",
        notes: data.notes || null,
        assignedTo: data.assignedTo && data.assignedTo !== "none" ? data.assignedTo : null,
        source: "manual", // Manual booking from vendor portal
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
      setAdditionalCharges([]);
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

                {/* Time Slot Selection */}
                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Time Slot
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time slot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Preferred time for the booking
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Charges Section */}
            <Card className="p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Additional Charges
              </h3>
              
              {/* Existing charges list */}
              {additionalCharges.length > 0 && (
                <div className="space-y-2 mb-3">
                  {additionalCharges.map((charge, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div>
                        <p className="text-sm font-medium">{charge.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">₹{charge.amount}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveCharge(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new charge form */}
              <div className="flex gap-2">
                <Input
                  placeholder="Charge name (e.g., Express Fee)"
                  value={newChargeName}
                  onChange={(e) => setNewChargeName(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newChargeAmount}
                  onChange={(e) => setNewChargeAmount(e.target.value)}
                  className="w-24 h-9 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleAddCharge}
                  disabled={!newChargeName || !newChargeAmount}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add any additional charges like express fees, special handling, etc.
              </p>
            </Card>

            {/* Assign To Employee */}
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    Assign To
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={employeesLoading ? "Loading..." : "Select employee (optional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Unassigned</span>
                      </SelectItem>
                      {employees.filter(e => e.status === 'active').map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span>{employee.name}</span>
                              <span className="text-xs text-muted-foreground">{employee.role}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Status */}
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="paid">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Paid</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="refunded">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span>Refunded</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <div className="rounded-lg border p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-3 text-green-800 dark:text-green-200">Pricing Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service Price:</span>
                    <span className="font-medium">₹{Number(selectedService.offerPrice ?? selectedService.price)}</span>
                  </div>
                  {isHomeCollection && (
                    <div className="flex justify-between">
                      <span>Home Service:</span>
                      <span className="font-medium">₹{Number(selectedService.homeCollectionCharges ?? 0)}</span>
                    </div>
                  )}
                  {additionalCharges.map((charge, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span>{charge.name}:</span>
                      <span>₹{charge.amount}</span>
                    </div>
                  ))}
                  {totalAdditionalCharges > 0 && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Additional Charges Subtotal:</span>
                      <span className="font-medium">₹{totalAdditionalCharges}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-green-300 dark:border-green-700">
                    <span className="text-green-800 dark:text-green-200">Total Amount:</span>
                    <span className="text-green-700 dark:text-green-300">
                      ₹{Number(selectedService.offerPrice ?? selectedService.price) + 
                        (isHomeCollection ? Number(selectedService.homeCollectionCharges ?? 0) : 0) +
                        totalAdditionalCharges}
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
