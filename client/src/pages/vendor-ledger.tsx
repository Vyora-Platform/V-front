import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  Users, 
  Building2, 
  Phone, 
  ChevronRight, 
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  UserPlus,
  Building
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { getApiUrl } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, insertSupplierSchema, type InsertCustomer, type InsertSupplier } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

type LedgerTransaction = {
  id: string;
  vendorId: string;
  customerId: string | null;
  supplierId: string | null;
  type: "in" | "out";
  amount: number;
  transactionDate: string;
  category: string;
  paymentMethod: string;
  description: string | null;
  note: string | null;
  isRecurring: boolean;
  recurringPattern: string | null;
  referenceType: string | null;
  referenceId: string | null;
  attachments: string[];
  excludeFromBalance: boolean | null;
  isPOSSale: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type LedgerSummary = {
  totalIn: number;
  totalOut: number;
  balance: number;
  transactionCount: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
  lastVisitDate?: string | null;
  balance?: number;
};

type Supplier = {
  id: string;
  name: string;
  businessName?: string;
  phone: string;
  email: string | null;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
  balance?: number;
};

type CustomerBalance = {
  customerId: string;
  totalIn: number;
  totalOut: number;
  balance: number;
};

export default function VendorLedger() {
  const { vendorId, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "balance" | "recent">("recent");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  
  // Pro subscription
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<string | undefined>();

  const handleProAction = (action: string, callback: () => void) => {
    const result = canPerformAction(action as any);
    if (!result.allowed) {
      setBlockedAction(action);
      setShowUpgradeModal(true);
      return;
    }
    callback();
  };

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery<LedgerSummary>({
    queryKey: ["/api/vendors", vendorId, "ledger-summary"],
    queryFn: async () => {
      const url = `/api/vendors/${vendorId}/ledger-summary`;
      const res = await fetch(getApiUrl(url));
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/vendors', vendorId, 'customers'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/customers`));
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/vendors', vendorId, 'suppliers'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/suppliers`));
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch all ledger transactions to calculate per-customer balances
  const { data: transactions = [] } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/vendors", vendorId, "ledger-transactions"],
    queryFn: async () => {
      const url = `/api/vendors/${vendorId}/ledger-transactions`;
      const res = await fetch(getApiUrl(url));
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Calculate balance per customer
  // Accounting Logic (Khatabook style):
  // - "You Gave" (type=out) = Credit given to customer = Customer owes you MORE
  // - "You Got" (type=in) = Payment received from customer = Customer owes you LESS
  // - Balance = totalOut - totalIn (what customer owes you)
  // - Positive balance = "You will GET" (customer owes you)
  // - Negative balance = "You will GIVE" (you owe customer, e.g., advance taken)
  // Note: POS paid amounts (excludeFromBalance=true) are excluded from balance calculation
  const customerBalances: Record<string, CustomerBalance & { balanceIn: number; balanceOut: number }> = {};
  const supplierBalances: Record<string, { supplierId: string; totalIn: number; totalOut: number; balance: number; balanceIn: number; balanceOut: number }> = {};
  
  transactions.forEach(t => {
    // Customer transactions
    if (t.customerId) {
      if (!customerBalances[t.customerId]) {
        customerBalances[t.customerId] = { customerId: t.customerId, totalIn: 0, totalOut: 0, balance: 0, balanceIn: 0, balanceOut: 0 };
      }
      // Track all amounts for display (includes POS paid amounts)
      if (t.type === 'in') {
        customerBalances[t.customerId].totalIn += t.amount;
      } else {
        customerBalances[t.customerId].totalOut += t.amount;
      }
      // Only include in balance if not excluded (POS paid amounts are excluded)
      if (!t.excludeFromBalance) {
        if (t.type === 'in') {
          customerBalances[t.customerId].balanceIn += t.amount;
        } else {
          customerBalances[t.customerId].balanceOut += t.amount;
        }
      }
      // Balance = "You Gave" - "You Got" = totalOut - totalIn
      // Positive = Customer owes you = "You will GET"
      // Negative = You owe customer = "You will GIVE"
      customerBalances[t.customerId].balance = 
        customerBalances[t.customerId].balanceOut - customerBalances[t.customerId].balanceIn;
    }
    
    // Supplier transactions
    // For suppliers, the logic is also:
    // - "You Gave" (type=out) = Payment to supplier = You paid them (reduces what you owe)
    // - "You Got" (type=in) = Goods/credit received = You owe them MORE
    // - Balance = totalIn - totalOut (what you owe supplier)
    // - Positive balance = "You will GIVE" (you owe supplier)
    // - Negative balance = "You will GET" (supplier owes you, e.g., advance paid)
    if (t.supplierId) {
      if (!supplierBalances[t.supplierId]) {
        supplierBalances[t.supplierId] = { supplierId: t.supplierId, totalIn: 0, totalOut: 0, balance: 0, balanceIn: 0, balanceOut: 0 };
      }
      // Track all amounts for display
      if (t.type === 'in') {
        supplierBalances[t.supplierId].totalIn += t.amount;
      } else {
        supplierBalances[t.supplierId].totalOut += t.amount;
      }
      // Only include in balance if not excluded
      if (!t.excludeFromBalance) {
        if (t.type === 'in') {
          supplierBalances[t.supplierId].balanceIn += t.amount;
        } else {
          supplierBalances[t.supplierId].balanceOut += t.amount;
        }
      }
      // For suppliers: Balance = totalIn - totalOut
      // Positive = You owe supplier = "You will GIVE"
      // Negative = Supplier owes you = "You will GET"
      supplierBalances[t.supplierId].balance = 
        supplierBalances[t.supplierId].balanceIn - supplierBalances[t.supplierId].balanceOut;
    }
  });

  // Enrich customers with balance
  const enrichedCustomers = customers.map(c => ({
    ...c,
    balance: customerBalances[c.id]?.balance || 0,
    totalIn: customerBalances[c.id]?.totalIn || 0,
    totalOut: customerBalances[c.id]?.totalOut || 0,
  }));

  // Enrich suppliers with balance
  const enrichedSuppliers = suppliers.map(s => ({
    ...s,
    balance: supplierBalances[s.id]?.balance || 0,
    totalIn: supplierBalances[s.id]?.totalIn || 0,
    totalOut: supplierBalances[s.id]?.totalOut || 0,
  }));

  // Filter and sort customers
  const filteredCustomers = enrichedCustomers
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "balance") return Math.abs(b.balance) - Math.abs(a.balance);
      return new Date(b.lastVisitDate || 0).getTime() - new Date(a.lastVisitDate || 0).getTime();
    });

  // Filter and sort suppliers
  const filteredSuppliers = enrichedSuppliers
    .filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "balance") return Math.abs(b.balance) - Math.abs(a.balance);
      return a.name.localeCompare(b.name); // Default to name for suppliers
    });

  // Calculate totals from customers
  // For customers: positive balance = "You will GET", negative = "You will GIVE"
  const customerToReceive = enrichedCustomers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const customerToPay = enrichedCustomers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  
  // Calculate totals from suppliers
  // For suppliers: positive balance = "You will GIVE", negative = "You will GET"
  const supplierToPay = enrichedSuppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);
  const supplierToReceive = enrichedSuppliers.reduce((sum, s) => sum + (s.balance < 0 ? Math.abs(s.balance) : 0), 0);
  
  // Combined totals
  const totalToReceive = customerToReceive + supplierToReceive;
  const totalToPay = customerToPay + supplierToPay;

  const handleCustomerClick = (customerId: string) => {
    setLocation(`/vendors/${vendorId}/ledger/customer/${customerId}`);
  };

  const handleSupplierClick = (supplierId: string) => {
    setLocation(`/vendors/${vendorId}/ledger/supplier/${supplierId}`);
  };

  const handlePhoneCall = (phone: string | null | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleWhatsAppReminder = (customer: Customer, balance: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const message = balance > 0
      ? `Hi ${customer.name}, this is a friendly reminder about your pending payment of ₹${Math.abs(balance).toLocaleString()}. Please clear the dues at your earliest convenience. Thank you!`
      : `Hi ${customer.name}, thank you for your business!`;
    
    const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddEntry = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Redirect to customer dashboard where both "You will give" and "You will get" options are present
    setLocation(`/vendors/${vendorId}/ledger/customer/${customerId}`);
  };

  // Show loading while auth initializes
  if (authLoading || !vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="md:hidden flex-shrink-0 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Hisab Kitab
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFilterOpen(true)}
              className="h-9 w-9"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards - Khatabook Style */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-3">
            {/* You Will Get - Red */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-90">You will GET</span>
                </div>
                {summaryLoading ? (
                  <div className="h-7 w-24 bg-white/20 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">
                    ₹{(totalToReceive || 0).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            {/* You Will Give - Green */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-90">You will GIVE</span>
                </div>
                {summaryLoading ? (
                  <div className="h-7 w-24 bg-white/20 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">
                    ₹{(totalToPay || 0).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Khatabook Style */}
        <div className="px-4 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "customers" | "suppliers")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="customers" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Customers
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {customers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="suppliers" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Suppliers
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {suppliers.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === "customers" ? "customers" : "suppliers"} by name or phone...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {activeTab === "customers" ? filteredCustomers.length : filteredSuppliers.length} {activeTab}
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-auto h-8 text-xs border-0 bg-transparent">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="recent">Recent First</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="balance">Highest Balance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 py-2 pb-24">
        {activeTab === "customers" ? (
          <>
            {/* Add Customer Card */}
            <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
              <DialogTrigger asChild>
                <Card className="mb-3 overflow-hidden border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all active:scale-[0.98]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">Add New Customer</h3>
                      <p className="text-xs text-muted-foreground">Create and start tracking payments</p>
                    </div>
                    <Plus className="h-5 w-5 text-primary" />
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add New Customer
                  </DialogTitle>
                  <DialogDescription>Add customer to your khata book</DialogDescription>
                </DialogHeader>
                <CustomerFormFull
                  vendorId={vendorId}
                  onSuccess={(customerId) => {
                    setIsAddCustomerOpen(false);
                    handleCustomerClick(customerId);
                  }}
                />
              </DialogContent>
            </Dialog>

            {customersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                  Add your first customer to start tracking payments and dues
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <Card 
                    key={customer.id} 
                    className="overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    onClick={() => handleCustomerClick(customer.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center p-4">
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone || "No phone"}</span>
                          </div>
                          {(customer.address || customer.city) && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {[customer.address, customer.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>

                        {/* Balance */}
                        <div className="flex flex-col items-end ml-2">
                          <span className={`text-base font-bold ${
                            customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            ₹{Math.abs(customer.balance).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            customer.balance > 0 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                              : customer.balance < 0 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {customer.balance > 0 ? 'You will GET' : customer.balance < 0 ? 'You will GIVE' : 'Settled'}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
                      </div>

                      {/* Quick Actions - Always show for all customers */}
                      <div className="flex border-t divide-x">
                        <button
                          className="flex-1 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-1.5 transition-colors"
                          onClick={(e) => handlePhoneCall(customer.phone, e)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </button>
                        <button
                          className="flex-1 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center gap-1.5 transition-colors"
                          onClick={(e) => handleWhatsAppReminder(customer, customer.balance, e)}
                        >
                          <SiWhatsapp className="h-3.5 w-3.5" />
                          Remind
                        </button>
                        <button
                          className="flex-1 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5 transition-colors"
                          onClick={(e) => handleAddEntry(customer.id, e)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Entry
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          // Suppliers Tab
          <>
            {/* Add Supplier Card */}
            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
              <DialogTrigger asChild>
                <Card className="mb-3 overflow-hidden border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all active:scale-[0.98]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">Add New Supplier</h3>
                      <p className="text-xs text-muted-foreground">Add supplier to track payables</p>
                    </div>
                    <Plus className="h-5 w-5 text-primary" />
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-4 pb-0 sticky top-0 bg-background z-10 border-b">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsAddSupplierOpen(false)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <DialogTitle>Add New Supplier</DialogTitle>
                      <DialogDescription>Add supplier to your network</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="p-4">
                  <SupplierFormFull
                    vendorId={vendorId}
                    onSuccess={() => {
                      setIsAddSupplierOpen(false);
                      toast({ title: "Supplier added successfully" });
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {suppliersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No suppliers yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                  Add your first supplier to track your payables
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSuppliers.map((supplier) => (
                  <Card 
                    key={supplier.id} 
                    className="overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    onClick={() => handleSupplierClick(supplier.id)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center p-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center mr-3">
                          <span className="text-lg font-bold text-orange-600">
                            {supplier.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm truncate">{supplier.name}</h3>
                            {supplier.status === "active" && (
                              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            )}
                          </div>
                          {supplier.businessName && (
                            <p className="text-xs text-muted-foreground truncate">{supplier.businessName}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone || "No phone"}</span>
                          </div>
                          {(supplier.addressLine1 || supplier.city) && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {[supplier.addressLine1, supplier.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>

                        {/* Balance - For suppliers: positive = You will GIVE, negative = You will GET */}
                        <div className="flex flex-col items-end ml-2">
                          <span className={`text-base font-bold ${
                            supplier.balance > 0 ? 'text-green-600' : supplier.balance < 0 ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            ₹{Math.abs(supplier.balance).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            supplier.balance > 0 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : supplier.balance < 0 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {supplier.balance > 0 ? 'You will GIVE' : supplier.balance < 0 ? 'You will GET' : 'Settled'}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
                      </div>

                      {/* Quick Actions */}
                      <div className="flex border-t divide-x">
                        <button
                          className="flex-1 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-1.5 transition-colors"
                          onClick={(e) => handlePhoneCall(supplier.phone, e)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </button>
                        <button
                          className="flex-1 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center gap-1.5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const message = supplier.balance < 0
                              ? `Hi ${supplier.name}, regarding the pending payment of ₹${Math.abs(supplier.balance).toLocaleString()}. We will process it soon. Thank you!`
                              : `Hi ${supplier.name}, thank you for your partnership!`;
                            const whatsappUrl = `https://wa.me/${supplier.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                        >
                          <SiWhatsapp className="h-3.5 w-3.5" />
                          Message
                        </button>
                        <button
                          className="flex-1 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSupplierClick(supplier.id);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Entry
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50">
        <Button
          size="lg"
          onClick={() => activeTab === "customers" ? setIsAddCustomerOpen(true) : setIsAddSupplierOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Filter & Sort</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 pb-6">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-3 block">Show Entries</label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  You will GET
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  You will GIVE
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <CheckCircle2 className="h-3 w-3 mr-2" />
                  Settled
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-3 block">Time Period</label>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm">Today</Button>
                <Button variant="outline" size="sm">This Week</Button>
                <Button variant="outline" size="sm">This Month</Button>
                <Button variant="outline" size="sm">All Time</Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setFilterOpen(false)}>
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Full Customer Form - Same as Customer Module
function CustomerFormFull({ vendorId, onSuccess }: { vendorId: string; onSuccess: (customerId: string) => void }) {
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
      toast({ title: "✅ Customer added successfully" });
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
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
            <TabsTrigger value="more" className="text-xs">More</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-3 mt-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Full name" className="h-11 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="9876543210" className="h-11 rounded-xl" />
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
                      <Input {...field} value={field.value || ""} placeholder="email@example.com" className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select type" />
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

          <TabsContent value="contact" className="space-y-3 mt-3">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Full address" className="rounded-xl" />
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
                      <Input {...field} value={field.value || ""} placeholder="City" className="h-11 rounded-xl" />
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
                      <Input {...field} value={field.value || ""} placeholder="Pincode" className="h-11 rounded-xl" />
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
                    <Input {...field} value={field.value || ""} placeholder="State" className="h-11 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="more" className="space-y-3 mt-3">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Any additional notes..." className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={mutation.isPending} className="w-full h-12 rounded-xl text-base font-semibold">
          {mutation.isPending ? "Adding..." : "Add Customer"}
        </Button>
      </form>
    </Form>
  );
}

// Full Supplier Form - Same as Supplier Module
function SupplierFormFull({ vendorId, onSuccess }: { vendorId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<Omit<InsertSupplier, 'vendorId'>>({
    resolver: zodResolver(insertSupplierSchema.omit({ vendorId: true })),
    defaultValues: {
      name: "",
      businessName: "",
      phone: "",
      email: "",
      contactPerson: "",
      category: "other",
      status: "active",
      gstin: "",
      pan: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertSupplier, 'vendorId'>) => {
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
      ) as Omit<InsertSupplier, 'vendorId'>;
      
      const supplierData = { ...cleanData, vendorId } as InsertSupplier;
      const response = await apiRequest('POST', `/api/vendors/${vendorId}/suppliers`, supplierData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers'] });
      toast({ title: "✅ Supplier added successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to add supplier", variant: "destructive" });
    },
  });

  const onSubmit = (data: Omit<InsertSupplier, 'vendorId'>) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={["basic"]} className="w-full">
          {/* Basic Information */}
          <AccordionItem value="basic" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Basic Information
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contact person name" className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Company/Business name" className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="9876543210" className="h-11 rounded-xl" />
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
                        <Input {...field} value={field.value || ""} placeholder="email@example.com" className="h-11 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "other"}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="raw_materials">Raw Materials</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="consumables">Consumables</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Address */}
          <AccordionItem value="address" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              Address Details
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Street address" className="h-11 rounded-xl" />
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
                        <Input {...field} value={field.value || ""} placeholder="City" className="h-11 rounded-xl" />
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
                        <Input {...field} value={field.value || ""} placeholder="Pincode" className="h-11 rounded-xl" />
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
                      <Input {...field} value={field.value || ""} placeholder="State" className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 rounded-xl text-base font-semibold">
          {createMutation.isPending ? "Adding..." : "Add Supplier"}
        </Button>
      </form>
    </Form>
  );
}
