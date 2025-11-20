import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Mail, Phone, User, MapPin, CreditCard, FileText, DollarSign, Calendar, Trash2 } from "lucide-react";
import type { Supplier } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";


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
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const [, params] = useRoute("/vendor/suppliers/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const supplierId = params?.id;

  // Fetch supplier details
  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: ['/api/vendors', vendorId, 'suppliers', supplierId],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/suppliers/${supplierId}`);
      if (!response.ok) throw new Error('Failed to fetch supplier');
      return response.json();
    },
    enabled: !!supplierId,
  });

  // Fetch payment history
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<SupplierPayment[]>({
    queryKey: ['/api/vendors', vendorId, 'suppliers', supplierId, 'payments'],
    queryFn: async () => {
      const response = await fetch(`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    enabled: !!supplierId,
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: "",
      notes: "",
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const response = await fetch(`/api/vendors/${vendorId}/suppliers/${supplierId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers', supplierId, 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers'] });
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
      const response = await fetch(`/api/vendors/${vendorId}/suppliers/${supplierId}/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers', supplierId, 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers'] });
      toast({ title: "Payment deleted successfully" });
    },
  });

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">Supplier not found</p>
          <Button onClick={() => navigate("/vendor/suppliers")} className="mt-4" data-testid="button-back">
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/vendor/suppliers")}
            data-testid="button-back-to-suppliers"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-supplier-name">
              {supplier.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400" data-testid="text-business-name">
              {supplier.businessName}
            </p>
          </div>
        </div>
        <Badge
          variant={supplier.status === "active" ? "default" : "secondary"}
          data-testid={`badge-status-${supplier.status}`}
        >
          {supplier.status}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            Payments {payments.length > 0 && `(${payments.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Contact Person</p>
                    <p className="font-medium" data-testid="text-contact-person">
                      {supplier.contactPerson || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="font-medium" data-testid="text-phone">{supplier.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="font-medium" data-testid="text-email">
                      {supplier.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Category</p>
                    <p className="font-medium capitalize" data-testid="text-category">
                      {supplier.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-1" />
                <div className="space-y-1">
                  <p data-testid="text-address-line1">{supplier.addressLine1}</p>
                  {supplier.addressLine2 && <p data-testid="text-address-line2">{supplier.addressLine2}</p>}
                  <p data-testid="text-city-state-pincode">
                    {supplier.city}, {supplier.state} - {supplier.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business & Tax Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business & Tax Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">GSTIN</p>
                    <p className="font-medium" data-testid="text-gstin">
                      {supplier.gstin || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">PAN</p>
                    <p className="font-medium" data-testid="text-pan">
                      {supplier.pan || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bank Name</p>
                    <p className="font-medium" data-testid="text-bank-name">
                      {supplier.bankName || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Account Number</p>
                    <p className="font-medium" data-testid="text-account-number">
                      {supplier.accountNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">IFSC Code</p>
                    <p className="font-medium" data-testid="text-ifsc-code">
                      {supplier.ifscCode || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Purchases</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-total-purchases">
                    ₹{(supplier.totalPurchases || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-total-paid">
                    ₹{totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-outstanding-balance">
                    ₹{(supplier.outstandingBalance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300" data-testid="text-notes">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment History</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Track all payments made to this supplier
              </p>
            </div>
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-record-payment">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                              data-testid="input-payment-amount"
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
                              <SelectTrigger data-testid="select-payment-method">
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
                            <Input type="date" {...field} data-testid="input-payment-date" />
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
                              data-testid="input-reference-number"
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
                              data-testid="input-payment-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={recordPaymentMutation.isPending}
                        data-testid="button-submit-payment"
                      >
                        {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPaymentDialogOpen(false)}
                        data-testid="button-cancel-payment"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {paymentsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  No payments recorded yet. Click "Record Payment" to add the first payment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid={`text-payment-amount-${payment.id}`}>
                                ₹{payment.amount.toLocaleString()}
                              </p>
                              <Badge variant="outline" data-testid={`badge-payment-method-${payment.id}`}>
                                {payment.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span data-testid={`text-payment-date-${payment.id}`}>
                                  {new Date(payment.paymentDate).toLocaleDateString()}
                                </span>
                              </div>
                              {payment.referenceNumber && (
                                <div data-testid={`text-reference-${payment.id}`}>
                                  Ref: {payment.referenceNumber}
                                </div>
                              )}
                            </div>
                            {payment.notes && (
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400" data-testid={`text-payment-notes-${payment.id}`}>
                                {payment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePaymentMutation.mutate(payment.id)}
                        disabled={deletePaymentMutation.isPending}
                        data-testid={`button-delete-payment-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
