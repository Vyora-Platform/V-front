import { useState } from "react";
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
  Package, TrendingUp, Clock, Wallet, ChevronRight, ExternalLink
} from "lucide-react";
import type { Supplier } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  const supplierId = params?.id;

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

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get payment method icon and color
  const getPaymentMethodDetails = (method: string) => {
    const details: Record<string, { label: string; color: string }> = {
      'cash': { label: 'Cash', color: 'bg-green-100 text-green-700' },
      'upi': { label: 'UPI', color: 'bg-purple-100 text-purple-700' },
      'card': { label: 'Card', color: 'bg-blue-100 text-blue-700' },
      'bank_transfer': { label: 'Bank Transfer', color: 'bg-indigo-100 text-indigo-700' },
      'cheque': { label: 'Cheque', color: 'bg-orange-100 text-orange-700' },
      'wallet': { label: 'Wallet', color: 'bg-pink-100 text-pink-700' },
    };
    return details[method] || { label: method, color: 'bg-gray-100 text-gray-700' };
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
  const categoryColors: Record<string, string> = {
    'raw_materials': 'bg-blue-100 text-blue-700',
    'finished_goods': 'bg-green-100 text-green-700',
    'packaging': 'bg-yellow-100 text-yellow-700',
    'equipment': 'bg-purple-100 text-purple-700',
    'services': 'bg-pink-100 text-pink-700',
    'other': 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-3">
      <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/suppliers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={cn(
                    "text-sm font-semibold",
                    supplier.status === 'active' 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}>
                    {getInitials(supplier.name)}
                  </AvatarFallback>
                </Avatar>
          <div>
                  <h1 className="text-lg font-bold text-foreground">{supplier.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={supplier.status === 'active' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {supplier.status}
                    </Badge>
                    <Badge className={cn("text-[10px]", categoryColors[supplier.category] || categoryColors['other'])}>
                      {supplier.category?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/vendor/suppliers`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Supplier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            <Card className="p-3 min-w-[130px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Purchases</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                ₹{(supplier.totalPurchases || 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-3 min-w-[130px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Paid</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                ₹{totalPaid.toLocaleString()}
              </p>
            </Card>
            <Card className="p-3 min-w-[130px] bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outstanding</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                ₹{(supplier.outstandingBalance || 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payments</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                {payments.length}
            </p>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 h-12 bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
            >
              Payments ({payments.length})
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
            >
              Orders
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="p-4 space-y-4">
          {/* Contact Information */}
          <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Contact Information
                </CardTitle>
            </CardHeader>
              <CardContent className="space-y-3">
                {supplier.contactPerson && (
                  <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                        <p className="text-xs text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{supplier.contactPerson}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
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
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`tel:${supplier.phone}`}>
                        <Phone className="h-4 w-4 text-green-600" />
                      </a>
                    </Button>
                  </div>
                </div>
                {supplier.email && (
                  <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{supplier.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
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
                        className="h-8 w-8"
                        asChild
                      >
                        <a href={`mailto:${supplier.email}`}>
                          <Mail className="h-4 w-4 text-blue-600" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                {supplier.businessName && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
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
            </CardContent>
          </Card>
            )}

          {/* Notes */}
          {supplier.notes && (
            <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
            </div>
        )}

        {activeTab === "payments" && (
          <div className="p-4 space-y-4">
            {/* Record Payment Button */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <DollarSign className="h-4 w-4" />
                  Record New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
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
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
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
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="wallet">Wallet</SelectItem>
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
                          <FormLabel>Payment Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Reference Number (Optional)</FormLabel>
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
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes about this payment"
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
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={recordPaymentMutation.isPending}
                        className="flex-1"
                      >
                        {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

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
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", methodDetails.color)}>
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</span>
                                <Badge className={cn("text-[10px]", methodDetails.color)}>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePaymentMutation.mutate(payment.id)}
                        disabled={deletePaymentMutation.isPending}
                      >
                            <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="p-4">
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Purchase Orders Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Track all your purchase orders with this supplier.
              </p>
            </Card>
            </div>
          )}
      </div>
    </div>
  );
}
