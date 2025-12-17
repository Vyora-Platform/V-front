import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
import { Search, Plus, Phone, Mail, MapPin, Users, ChevronRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorLedgerCustomerSelection() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch customers with search
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/vendors', vendorId, 'customers', searchQuery],
    queryFn: async () => {
      let url = `/api/vendors/${vendorId}/customers`;
      if (searchQuery) url += `?search=${searchQuery}`;

      const response = await fetch(getApiUrl(url));
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
  });

  const handleCustomerSelect = (customerId: string) => {
    setLocation(`/vendors/${vendorId}/ledger/customer/${customerId}`);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/vendors/${vendorId}/ledger`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">Select Customer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a customer to manage their ledger
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-customer"
        />
      </div>

      {/* Add New Customer Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <Card
          className="hover-elevate cursor-pointer transition-all"
          onClick={() => setIsAddDialogOpen(true)}
          data-testid="button-add-new-customer"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold">Add New Customer</span>
              <span className="text-sm text-muted-foreground">Create a new customer and add transaction</span>
            </div>
          </CardContent>
        </Card>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to your database
            </DialogDescription>
          </DialogHeader>
          <CustomerForm onSuccess={(customerId) => {
            handleCloseDialog();
            handleCustomerSelect(customerId);
          }} />
        </DialogContent>
      </Dialog>

      {/* Customer List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading customers...</p>
            </CardContent>
          </Card>
        ) : !customers || customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No customers found</p>
              <p className="text-sm text-muted-foreground">Add your first customer to get started</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card
              key={customer.id}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => handleCustomerSelect(customer.id)}
              data-testid={`card-customer-${customer.id}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-semibold text-primary">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold" data-testid={`text-customer-name-${customer.id}`}>
                        {customer.name}
                      </h3>
                      <Badge
                        variant={customer.status === "active" ? "default" : "outline"}
                        data-testid={`badge-status-${customer.id}`}
                      >
                        {customer.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{customer.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CustomerForm({ onSuccess }: { onSuccess: (customerId: string) => void }) {
  const { toast } = useToast();
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      vendorId: vendorId,
      name: "",
      email: "",
      phone: "",
      alternatePhone: null,
      dateOfBirth: null,
      gender: null,
      address: "",
      city: "",
      state: "",
      pincode: "",
      membershipType: null,
      membershipStartDate: null,
      membershipEndDate: null,
      subscriptionStatus: null,
      activePackages: [],
      servicesEnrolled: [],
      customerType: "walk-in",
      source: null,
      referredBy: null,
      status: "active",
      lastVisitDate: null,
      totalVisits: 0,
      totalSpent: 0,
      notes: null,
      preferences: [],
      allergies: [],
      emergencyContactName: null,
      emergencyContactPhone: null,
      documents: [],
      avatar: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest('POST', `/api/vendors/${vendorId}/customers`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'customers'] });
      toast({ title: "Customer added successfully" });
      onSuccess(data.id);
    },
    onError: () => {
      toast({ title: "Failed to add customer", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" data-testid="tab-basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="membership" data-testid="tab-membership">Membership</TabsTrigger>
            <TabsTrigger value="additional" data-testid="tab-additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Alternate phone" {...field} value={field.value || ""} data-testid="input-alternate-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full address" {...field} value={field.value || ""} data-testid="textarea-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} value={field.value || ""} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} value={field.value || ""} data-testid="input-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="Pincode" {...field} value={field.value || ""} data-testid="input-pincode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="membership" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="membershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-membership-type">
                        <SelectValue placeholder="Select membership type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer-type">
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="additional" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." {...field} value={field.value || ""} data-testid="textarea-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-customer">
            {mutation.isPending ? "Adding..." : "Add Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
