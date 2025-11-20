import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
import { Users, Search, Plus, Trash2, Edit, Phone, Mail, MapPin, Calendar, TrendingUp, Package, ShoppingCart, ChevronDown, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorCustomers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Get real vendor ID from localStorage
  const { vendorId } = useAuth();

  // Fetch customers with search and filter
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/vendors', vendorId, 'customers', searchQuery, statusFilter],
    queryFn: async () => {
      let url = `/api/vendors/${vendorId}/customers`;
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(getApiUrl(url));
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'customers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: "Customer deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCustomer(null);
  };

  // Stats
  const activeCustomers = customers?.filter(c => c.status === "active").length || 0;
  const totalRevenue = customers?.reduce((sum, c) => sum + (c.totalSpent || 0), 0) || 0;
  const avgLifetimeValue = customers?.length ? totalRevenue / customers.length : 0;


  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Customers</h1>
            <p className="text-xs text-muted-foreground">Manage your customers</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingCustomer(null);
        }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-customer">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? "Update customer information" : "Add a new customer to your database"}
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              vendorId={vendorId}
              onSuccess={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>
      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{customers?.length || 0}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-lg font-bold text-green-600">{activeCustomers}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className="text-lg font-bold">₹{(totalRevenue / 1000).toFixed(1)}k</p>
          </Card>
        </div>
      </div>
      {/* Search and Filters - Horizontal Scroll */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="relative flex-1 min-w-[200px] snap-start">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-customers"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending_followup">Pending Follow-up</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Customer List */}
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
          Customers ({customers?.length || 0})
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No customers found</p>
            <p className="text-sm text-muted-foreground">Add your first customer to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-col gap-3 rounded-md border p-3 sm:p-4 hover-elevate cursor-pointer transition-all"
                  data-testid={`card-customer-${customer.id}`}
                  onClick={() => setLocation(`/vendor/customers/${customer.id}`)}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm sm:text-base" data-testid={`text-customer-name-${customer.id}`}>
                        {customer.name}
                      </h3>
                      <Badge
                        variant={
                          customer.status === "active"
                            ? "default"
                            : customer.status === "pending_followup"
                            ? "secondary"
                            : "outline"
                        }
                        data-testid={`badge-status-${customer.id}`}
                      >
                        {customer.status}
                      </Badge>
                      {customer.membershipType && (
                        <Badge variant="outline" data-testid={`badge-membership-${customer.id}`}>
                          {customer.membershipType}
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {customer.customerType}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-muted-foreground">
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="break-all">{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="break-all">{customer.email}</span>
                        </div>
                      )}
                      {customer.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.city}, {customer.state}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Visits: </span>
                        <span className="font-medium">{customer.totalVisits || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Spent: </span>
                        <span className="font-medium">₹{(customer.totalSpent || 0).toLocaleString()}</span>
                      </div>
                      {customer.lastVisitDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Last visit: </span>
                          <span className="font-medium">
                            {format(new Date(customer.lastVisitDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <p className="text-sm text-muted-foreground italic">{customer.notes}</p>
                    )}

                    {/* Purchase History */}
                    <PurchaseHistory customerId={customer.id} />
                  </div>

                  <div className="flex gap-2 justify-end border-t pt-3 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer.id, customer.name);
                      }}
                      data-testid={`button-delete-customer-${customer.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// Purchase History Component
function PurchaseHistory({ customerId }: { customerId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch orders (products)
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/customers', customerId, 'orders'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${customerId}/orders`));
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: isExpanded, // Only fetch when expanded
  });

  // Fetch bookings (services)
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/customers', customerId, 'bookings'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${customerId}/bookings`));
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: isExpanded, // Only fetch when expanded
  });

  const totalPurchases = (orders?.length || 0) + (bookings?.length || 0);

  return (
    <Accordion type="single" collapsible className="mt-3">
      <AccordionItem value="purchase-history" className="border-none">
        <AccordionTrigger
          className="hover:no-underline py-2 px-3 rounded-md hover-elevate"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`button-toggle-history-${customerId}`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4" />
            Purchase History ({totalPurchases} total)
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-3">
          {ordersLoading || bookingsLoading ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Loading purchase history...</div>
          ) : (
            <div className="space-y-4">
              {/* Orders (Products) */}
              {orders && orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4" />
                    Product Orders ({orders.length})
                  </h4>
                  <div className="space-y-2">
                    {orders.map((order: any) => (
                      <div
                        key={order.id}
                        className="text-sm p-3 rounded-md bg-muted/30 border"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-medium">Order #{order.id.slice(0, 8)}</span>
                            <Badge variant="outline" className="ml-2 capitalize">
                              {order.status}
                            </Badge>
                          </div>
                          <span className="font-semibold">₹{order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </div>
                        {order.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{order.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings (Services) */}
              {bookings && bookings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Service Bookings ({bookings.length})
                  </h4>
                  <div className="space-y-2">
                    {bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="text-sm p-3 rounded-md bg-muted/30 border"
                        data-testid={`booking-${booking.id}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-medium">Booking #{booking.id.slice(0, 8)}</span>
                            <Badge variant="outline" className="ml-2 capitalize">
                              {booking.status}
                            </Badge>
                          </div>
                          <span className="font-semibold">₹{booking.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}
                        </div>
                        {booking.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{booking.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No purchase history */}
              {(!orders || orders.length === 0) && (!bookings || bookings.length === 0) && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No purchase history found
                </div>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Customer Form Component
function CustomerForm({ customer, vendorId, onSuccess }: { customer?: Customer | null; vendorId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: customer || {
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
      const url = customer
        ? `/api/customers/${customer.id}`
        : `/api/vendors/${vendorId}/customers`;
      const method = customer ? 'PATCH' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'customers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: customer ? "Customer updated successfully" : "Customer added successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to save customer", variant: "destructive" });
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
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-customer-name" />
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
                      <Input {...field} data-testid="input-customer-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-customer-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-gender">
                          <SelectValue placeholder="Select gender" />
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
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-customer-address" />
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
                      <Input {...field} value={field.value || ""} data-testid="input-customer-city" />
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
                      <Input {...field} value={field.value || ""} data-testid="input-customer-state" />
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
                      <Input {...field} value={field.value || ""} data-testid="input-customer-pincode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-customer-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending_followup">Pending Follow-up</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="membership" className="space-y-4">
            <FormField
              control={form.control}
              name="membershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Type</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., Gold, Premium, Student" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscriptionStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="How did they find you?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Internal notes about customer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-save-customer"
          >
            {mutation.isPending ? "Saving..." : customer ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
