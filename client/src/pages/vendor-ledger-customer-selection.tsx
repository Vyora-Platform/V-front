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
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  ChevronRight, 
  ArrowLeft,
  UserPlus,
  Building2,
  User,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

type LedgerTransaction = {
  id: string;
  customerId: string | null;
  type: "in" | "out";
  amount: number;
  excludeFromBalance: boolean | null;
  isPOSSale: boolean | null;
};

export default function VendorLedgerCustomerSelection() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"customers" | "suppliers">("customers");

  // Fetch customers with search
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/vendors', vendorId, 'customers', searchQuery],
    queryFn: async () => {
      let url = `/api/vendors/${vendorId}/customers`;
      if (searchQuery) url += `?search=${searchQuery}`;

      const response = await fetch(getApiUrl(url));
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch transactions to calculate balances
  const { data: transactions = [] } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/vendors", vendorId, "ledger-transactions"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/ledger-transactions`));
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Calculate balance per customer
  // Note: Balance excludes POS paid amounts (excludeFromBalance=true) - only credit/due affects balance
  // POS paid amounts are product exchange, not credit/loan, so they don't affect net balance
  const customerBalances: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.customerId) {
      if (!customerBalances[t.customerId]) customerBalances[t.customerId] = 0;
      // Only include in balance if not excluded (POS paid amounts are excluded)
      if (!t.excludeFromBalance) {
        customerBalances[t.customerId] += t.type === 'in' ? t.amount : -t.amount;
      }
    }
  });

  const handleCustomerSelect = (customerId: string) => {
    setLocation(`/vendors/${vendorId}/ledger/customer/${customerId}`);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
  };

  if (!vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/vendor/ledger`)}
            className="-ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Select Customer</h1>
            <p className="text-xs text-muted-foreground">Choose a customer to manage their khata</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="customers" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger 
                value="suppliers" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Suppliers
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 py-3 pb-24">
        {/* Add New Customer Card */}
        <Card
          className="mb-4 overflow-hidden border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all active:scale-[0.98]"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">Add New {selectedTab === "customers" ? "Customer" : "Supplier"}</h3>
              <p className="text-xs text-muted-foreground">
                Create and start tracking payments
              </p>
            </div>
            <Plus className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>

        {/* Customer List */}
        {customersLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No {selectedTab} found</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : `Add your first ${selectedTab === "customers" ? "customer" : "supplier"} to get started`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((customer) => {
              const balance = customerBalances[customer.id] || 0;
              return (
                <Card
                  key={customer.id}
                  className="overflow-hidden hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
                  onClick={() => handleCustomerSelect(customer.id)}
                >
                  <CardContent className="flex items-center p-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mr-3">
                      <span className="text-lg font-bold text-primary">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                        {customer.status === "active" && (
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {customer.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Balance */}
                    {balance !== 0 && (
                      <div className="flex flex-col items-end ml-2">
                        <div className={`flex items-center gap-1 ${
                          balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {balance > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span className="text-sm font-bold">
                            ₹{Math.abs(balance).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {balance > 0 ? 'will get' : 'will give'}
                        </span>
                      </div>
                    )}

                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add New {selectedTab === "customers" ? "Customer" : "Supplier"}
            </DialogTitle>
            <DialogDescription>
              Add details to start tracking khata
            </DialogDescription>
          </DialogHeader>
          <CustomerForm 
            vendorId={vendorId}
            type={selectedTab === "customers" ? "customer" : "supplier"}
            onSuccess={(customerId) => {
              handleCloseDialog();
              handleCustomerSelect(customerId);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerForm({ 
  vendorId, 
  type,
  onSuccess 
}: { 
  vendorId: string;
  type: "customer" | "supplier";
  onSuccess: (customerId: string) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
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
      toast({ title: `${type === "customer" ? "Customer" : "Supplier"} added successfully` });
      onSuccess(data.id);
    },
    onError: () => {
      toast({ title: "Failed to add", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <>
            {/* Basic Info */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={type === "customer" ? "Customer name" : "Supplier/Business name"} 
                      {...field} 
                      className="h-11 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Phone number" 
                      {...field} 
                      className="h-11 rounded-xl"
                    />
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
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="email@example.com" 
                      {...field} 
                      value={field.value || ""} 
                      className="h-11 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => setStep(2)}
            >
              Add Address (Optional)
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Address Info */}
            <Button 
              type="button" 
              variant="ghost" 
              className="mb-2 -ml-2"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Full address" 
                      {...field} 
                      value={field.value || ""} 
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City" 
                        {...field} 
                        value={field.value || ""} 
                        className="h-11 rounded-xl"
                      />
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
                      <Input 
                        placeholder="Pincode" 
                        {...field} 
                        value={field.value || ""} 
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="State" 
                      {...field} 
                      value={field.value || ""} 
                      className="h-11 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button 
          type="submit" 
          disabled={mutation.isPending} 
          className="w-full h-12 rounded-xl text-base font-semibold"
        >
          {mutation.isPending ? "Adding..." : `Add ${type === "customer" ? "Customer" : "Supplier"}`}
        </Button>
      </form>
    </Form>
  );
}
