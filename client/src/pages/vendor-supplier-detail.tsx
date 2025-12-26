import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, Building2, Mail, Phone, User, MapPin, CreditCard, FileText, 
  DollarSign, Calendar, Trash2, Edit, MoreVertical, Copy, CheckCircle2,
  Package, TrendingUp, Clock, Wallet, ChevronRight, ExternalLink,
  Receipt, AlertCircle, Plus, Download, Share2, IndianRupee, History,
  FileSpreadsheet, Filter, ArrowUpDown, Printer, MessageSquare
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Supplier, Expense } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const paymentFormSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "upi", "card", "bank_transfer", "cheque", "wallet"]),
  paymentDate: z.string(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface SupplierPayment {
  id: string;
  supplierId: string;
  vendorId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export default function VendorSupplierDetail() {
  const { vendorId } = useAuth();
  const [, params] = useRoute("/vendor/suppliers/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const supplierId = params?.id;

  // Check for tab query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'payments', 'expenses', 'transactions'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Fetch supplier details
  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: [`/api/vendors/${vendorId}/suppliers/${supplierId}`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/suppliers/${supplierId}`));
      if (!response.ok) throw new Error('Failed to fetch supplier');
      return response.json();
    },
    enabled: !!supplierId && !!vendorId,
  });

  // Fetch payment history
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<SupplierPayment[]>({
    queryKey: [`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`));
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    enabled: !!supplierId && !!vendorId,
  });

  // Fetch expenses linked to this supplier
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: [`/api/vendors/${vendorId}/expenses`, { supplierId }],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses?supplierId=${supplierId}`));
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    enabled: !!supplierId && !!vendorId,
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "upi",
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: "",
      notes: "",
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers/${supplierId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers`] });
      toast({ title: "Payment recorded successfully" });
      setPaymentDialogOpen(false);
      paymentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/suppliers/${supplierId}/payments/${paymentId}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers/${supplierId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers`] });
      toast({ title: "Payment deleted successfully" });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/vendors/${vendorId}/suppliers/${supplierId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers`] });
      toast({ title: "Supplier deleted successfully" });
      navigate("/vendor/suppliers");
    },
    onError: () => {
      toast({ title: "Failed to delete supplier", variant: "destructive" });
    },
  });

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get payment method icon and color
  const getPaymentMethodDetails = (method: string) => {
    const details: Record<string, { label: string; color: string; bgColor: string }> = {
      'cash': { label: 'Cash', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/50' },
      'upi': { label: 'UPI', color: 'text-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
      'card': { label: 'Card', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
      'bank_transfer': { label: 'Bank Transfer', color: 'text-indigo-700', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
      'cheque': { label: 'Cheque', color: 'text-orange-700', bgColor: 'bg-orange-100 dark:bg-orange-900/50' },
      'wallet': { label: 'Wallet', color: 'text-pink-700', bgColor: 'bg-pink-100 dark:bg-pink-900/50' },
    };
    return details[method] || { label: method, color: 'text-gray-700', bgColor: 'bg-gray-100 dark:bg-gray-800' };
  };

  // Format date for grouping
  const formatDateGroup = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return 'This Week';
    if (isThisMonth(date)) return 'This Month';
    return format(date, 'MMMM yyyy');
  };

  // Handle WhatsApp
  const handleWhatsApp = () => {
    if (!supplier) return;
    let cleanPhone = supplier.phone.replace(/[\s-]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+91' + cleanPhone;
    }
    const message = encodeURIComponent(`Hi ${supplier.name}, `);
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${message}`, '_blank');
  };

  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/suppliers")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="animate-pulse">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/suppliers")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Supplier Not Found</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">The supplier you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/vendor/suppliers")}>
              Back to Suppliers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryColors: Record<string, string> = {
    'raw_materials': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    'finished_goods': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    'packaging': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    'equipment': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    'services': 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    'other': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-3 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/vendor/suppliers")}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className={cn(
                  "text-sm font-semibold",
                  supplier.status === 'active' 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}>
                  {getInitials(supplier.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{supplier.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={supplier.status === 'active' ? 'default' : 'secondary'}
                    className="text-[10px] h-5"
                  >
                    {supplier.status}
                  </Badge>
                  <Badge className={cn("text-[10px] h-5", categoryColors[supplier.category] || categoryColors['other'])}>
                    {supplier.category?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Quick Call Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-green-600 md:hidden"
                asChild
              >
                <a href={`tel:${supplier.phone}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
              
              {/* WhatsApp Button - Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-[#25D366] md:hidden"
                onClick={handleWhatsApp}
              >
                <SiWhatsapp className="h-5 w-5" />
              </Button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Supplier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPaymentDialogOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/vendor/expenses/new?supplierId=${supplierId}`)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Add Expense
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hidden md:flex" asChild>
                    <a href={`tel:${supplier.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call {supplier.phone}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hidden md:flex" onClick={handleWhatsApp}>
                    <SiWhatsapp className="h-4 w-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                  {supplier.email && (
                    <DropdownMenuItem asChild>
                      <a href={`mailto:${supplier.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
                        deleteSupplierMutation.mutate();
                      }
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Supplier
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Quick Stats - Horizontal Scroll */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide max-w-[1440px] mx-auto">
          <div className="flex gap-2 min-w-max">
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Purchases</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                ₹{(supplier.totalPurchases || 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Paid</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                ₹{totalPaid.toLocaleString()}
              </p>
            </Card>
            <Card className={cn(
              "p-3 min-w-[120px]",
              (supplier.outstandingBalance || 0) > 0 
                ? "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-800"
                : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-700"
            )}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Outstanding</p>
              <p className={cn(
                "text-lg font-bold",
                (supplier.outstandingBalance || 0) > 0 
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-gray-500 dark:text-gray-400"
              )}>
                ₹{(supplier.outstandingBalance || 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-3 min-w-[100px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Payments</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                {payments.length}
              </p>
            </Card>
            <Card className="p-3 min-w-[100px] bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-200 dark:border-pink-800">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Expenses</p>
              <p className="text-lg font-bold text-pink-700 dark:text-pink-400">
                {expenses.length}
              </p>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 h-12 bg-transparent rounded-none border-b overflow-x-auto scrollbar-hide">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 shrink-0"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 shrink-0"
            >
              Payments ({payments.length})
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 shrink-0"
            >
              Expenses ({expenses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 shrink-0"
            >
              Statement
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="p-4 space-y-4 max-w-[1440px] mx-auto">
            {/* Quick Actions Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-4 divide-x">
                  <button
                    onClick={() => window.location.href = `tel:${supplier.phone}`}
                    className="flex flex-col items-center gap-1.5 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-xs font-medium">Call</span>
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center gap-1.5 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                      <SiWhatsapp className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setPaymentDialogOpen(true)}
                    className="flex flex-col items-center gap-1.5 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium">Pay</span>
                  </button>
                  <button
                    onClick={() => navigate(`/vendor/expenses/new?supplierId=${supplierId}`)}
                    className="flex flex-col items-center gap-1.5 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium">Expense</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.contactPerson && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{supplier.contactPerson}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Phone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(supplier.phone, 'phone')}
                    >
                      {copiedField === 'phone' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-600"
                      asChild
                    >
                      <a href={`tel:${supplier.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-[#25D366]"
                      onClick={handleWhatsApp}
                    >
                      <SiWhatsapp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Alternate Phone */}
                {supplier.alternatePhone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Alternate Phone</p>
                        <p className="font-medium">{supplier.alternatePhone}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-600"
                      asChild
                    >
                      <a href={`tel:${supplier.alternatePhone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
                
                {/* Email */}
                {supplier.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium break-all">{supplier.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(supplier.email!, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600"
                        asChild
                      >
                        <a href={`mailto:${supplier.email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Business Name */}
                {supplier.businessName && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Business Name</p>
                      <p className="font-medium">{supplier.businessName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            {(supplier.addressLine1 || supplier.city) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {supplier.addressLine1 && <p>{supplier.addressLine1}</p>}
                      {supplier.addressLine2 && <p>{supplier.addressLine2}</p>}
                      <p className="text-muted-foreground">
                        {[supplier.city, supplier.state, supplier.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    {supplier.addressLine1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent([supplier.addressLine1, supplier.city, supplier.state].filter(Boolean).join(', '))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tax Details */}
            {(supplier.gstin || supplier.pan) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    Tax Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.gstin && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">GSTIN</p>
                        <p className="font-medium font-mono">{supplier.gstin}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(supplier.gstin!, 'gstin')}
                      >
                        {copiedField === 'gstin' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  {supplier.pan && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">PAN</p>
                        <p className="font-medium font-mono">{supplier.pan}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(supplier.pan!, 'pan')}
                      >
                        {copiedField === 'pan' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Banking Details */}
            {(supplier.bankName || supplier.accountNumber) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    Banking Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.accountHolderName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Account Holder</p>
                      <p className="font-medium">{supplier.accountHolderName}</p>
                    </div>
                  )}
                  {supplier.bankName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{supplier.bankName}</p>
                    </div>
                  )}
                  {supplier.accountNumber && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-medium font-mono">{supplier.accountNumber}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(supplier.accountNumber!, 'account')}
                      >
                        {copiedField === 'account' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  {supplier.ifscCode && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">IFSC Code</p>
                        <p className="font-medium font-mono">{supplier.ifscCode}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(supplier.ifscCode!, 'ifsc')}
                      >
                        {copiedField === 'ifsc' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  {supplier.preferredPaymentMode && (
                    <div>
                      <p className="text-xs text-muted-foreground">Preferred Payment Mode</p>
                      <Badge className="mt-1 capitalize">{supplier.preferredPaymentMode}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {supplier.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Last Transaction Info */}
            {supplier.lastTransactionDate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-600" />
                    Last Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last transaction:</span>
                    <span className="font-medium">
                      {format(new Date(supplier.lastTransactionDate), 'dd MMM yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="p-4 space-y-4 max-w-[1440px] mx-auto">
            {/* Record Payment Button */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 h-12">
                  <Plus className="h-5 w-5" />
                  Record New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment made to {supplier.name}
                  </DialogDescription>
                </DialogHeader>
                <Form {...paymentForm}>
                  <form
                    onSubmit={paymentForm.handleSubmit((data) => recordPaymentMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="0"
                              className="text-lg h-12"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">💵 Cash</SelectItem>
                              <SelectItem value="upi">📱 UPI</SelectItem>
                              <SelectItem value="card">💳 Card</SelectItem>
                              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                              <SelectItem value="cheque">📄 Cheque</SelectItem>
                              <SelectItem value="wallet">👛 Wallet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date *</FormLabel>
                          <FormControl>
                            <Input type="date" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="referenceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Transaction ID, Cheque No., etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes about this payment"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPaymentDialogOpen(false)}
                        className="flex-1 h-12"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={recordPaymentMutation.isPending}
                        className="flex-1 h-12"
                      >
                        {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Payment Summary */}
            {payments.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Payments Made</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        ₹{totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{payments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payments List */}
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : payments.length === 0 ? (
              <Card className="p-8 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Payments Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start recording payments to track your transactions with this supplier.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const methodDetails = getPaymentMethodDetails(payment.paymentMethod);
                  return (
                    <Card key={payment.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", methodDetails.bgColor)}>
                              <IndianRupee className={cn("h-5 w-5", methodDetails.color)} />
                            </div>
                            <div>
                              <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                                </span>
                                <Badge className={cn("text-[10px]", methodDetails.bgColor, methodDetails.color)}>
                                  {methodDetails.label}
                                </Badge>
                              </div>
                              {payment.referenceNumber && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Ref: {payment.referenceNumber}
                                </p>
                              )}
                              {payment.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {payment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => deletePaymentMutation.mutate(payment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="p-4 space-y-4 max-w-[1440px] mx-auto">
            {/* Add Expense Button */}
            <Button 
              className="w-full gap-2 h-12"
              onClick={() => navigate(`/vendor/expenses/new?supplierId=${supplierId}`)}
            >
              <Plus className="h-5 w-5" />
              Add Expense for this Supplier
            </Button>

            {/* Expenses Summary */}
            {expenses.length > 0 && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        ₹{totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Entries</p>
                      <p className="text-2xl font-bold">{expenses.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expenses List */}
            {expensesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <Card className="p-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Expenses Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Record expenses from this supplier to track your purchases.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <Card 
                    key={expense.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                    onClick={() => navigate(`/vendor/expenses/${expense.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{expense.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(expense.expenseDate), 'dd MMM yyyy')}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {expense.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{expense.amount.toLocaleString()}</p>
                          <Badge 
                            variant={expense.status === 'paid' ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statement Tab - Combined Transactions */}
        {activeTab === "transactions" && (
          <div className="p-4 space-y-4 max-w-[1440px] mx-auto">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Purchases</p>
                    <p className="text-lg font-bold text-green-600">₹{(supplier.totalPurchases || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Paid</p>
                    <p className="text-lg font-bold text-blue-600">₹{totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Balance</p>
                    <p className={cn(
                      "text-lg font-bold",
                      (supplier.outstandingBalance || 0) > 0 ? "text-orange-600" : "text-gray-500"
                    )}>
                      ₹{(supplier.outstandingBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction List - Combined */}
            {(payments.length === 0 && expenses.length === 0) ? (
              <Card className="p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Transactions Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Record payments or expenses to see the statement.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Combine and sort all transactions by date */}
                {[
                  ...payments.map(p => ({
                    type: 'payment' as const,
                    id: p.id,
                    date: new Date(p.paymentDate),
                    amount: p.amount,
                    description: `Payment - ${getPaymentMethodDetails(p.paymentMethod).label}`,
                    reference: p.referenceNumber,
                    notes: p.notes,
                    method: p.paymentMethod,
                  })),
                  ...expenses.map(e => ({
                    type: 'expense' as const,
                    id: e.id,
                    date: new Date(e.expenseDate),
                    amount: e.amount,
                    description: e.title,
                    category: e.category,
                    status: e.status,
                  })),
                ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((transaction) => (
                  <Card key={`${transaction.type}-${transaction.id}`} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            transaction.type === 'payment' 
                              ? "bg-blue-100 dark:bg-blue-900/50" 
                              : "bg-red-100 dark:bg-red-900/50"
                          )}>
                            {transaction.type === 'payment' ? (
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Receipt className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(transaction.date, 'dd MMM yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-lg",
                            transaction.type === 'payment' ? "text-blue-600" : "text-red-600"
                          )}>
                            {transaction.type === 'payment' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                          </p>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              transaction.type === 'payment' ? "border-blue-300" : "border-red-300"
                            )}
                          >
                            {transaction.type === 'payment' ? 'Paid' : 'Purchase'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Dialog is already included above */}
    </div>
  );
}
