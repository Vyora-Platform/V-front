import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Phone, TrendingUp, TrendingDown, Wallet, Plus, Minus, Calendar, FileText, Mail, MapPin } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  status: string;
};

type LedgerTransaction = {
  id: string;
  vendorId: string;
  customerId: string | null;
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
  createdAt: string;
  updatedAt: string;
};

type CustomerLedgerSummary = {
  totalGiven: number; // Money you gave to customer (out)
  totalReceived: number; // Money you received from customer (in)
  balance: number; // Net balance (negative = you owe, positive = customer owes)
  transactionCount: number;
};

export default function VendorLedgerCustomerDashboard() {
  const { vendorId } = useAuth();
  const params = useParams<{ customerId: string }>();
  const [, setLocation] = useLocation();
  const customerId = params.customerId!;

  // Fetch customer details
  const { data: customer } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
  });

  // Fetch customer ledger transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/customers", customerId, "ledger-transactions"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${customerId}/ledger-transactions`));
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Calculate summary
  const summary: CustomerLedgerSummary = {
    totalGiven: transactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0),
    totalReceived: transactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0),
    balance: transactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0) - 
             transactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
  };

  const handleWhatsAppReminder = () => {
    if (!customer?.phone) return;
    
    const message = summary.balance > 0
      ? `Hi ${customer.name}, this is a friendly reminder about your pending payment of ₹${Math.abs(summary.balance).toLocaleString()}. Please clear the dues at your earliest convenience. Thank you!`
      : `Hi ${customer.name}, thank you for your business!`;
    
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneCall = () => {
    if (!customer?.phone) return;
    window.location.href = `tel:${customer.phone}`;
  };

  const handleAddTransaction = (type: "in" | "out") => {
    setLocation(`/vendors/${vendorId}/ledger/customer/${customerId}/transaction/new?type=${type}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/vendors/${vendorId}/ledger/new`)}
          className="md:hidden flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold" data-testid="text-customer-name">
            {customer?.name || "Loading..."}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer Ledger & Transaction History
          </p>
        </div>
      </div>

      {/* Customer Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone with Action Buttons */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Phone Number</p>
                <p className="text-sm font-semibold" data-testid="text-customer-phone">{customer?.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handlePhoneCall}
                data-testid="button-call"
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleWhatsAppReminder}
                data-testid="button-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Email */}
          {customer?.email && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email Address</p>
                <p className="text-sm font-semibold" data-testid="text-customer-email">{customer.email}</p>
              </div>
            </div>
          )}

          {/* Address */}
          {customer?.address && (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Address</p>
                <p className="text-sm font-semibold" data-testid="text-customer-address">
                  {customer.address}, {customer.city}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You Gave</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500" data-testid="text-total-given">
              {formatCurrency(summary.totalGiven)}
            </div>
            <p className="text-xs text-muted-foreground">Total amount paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You Got</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-total-received">
              {formatCurrency(summary.totalReceived)}
            </div>
            <p className="text-xs text-muted-foreground">Total amount received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance > 0 ? 'text-green-500' : summary.balance < 0 ? 'text-red-500' : ''}`} data-testid="text-balance">
              {formatCurrency(Math.abs(summary.balance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.balance > 0 ? 'Customer owes you' : summary.balance < 0 ? 'You owe customer' : 'Settled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction CTAs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Button
          size="lg"
          variant="default"
          className="h-auto p-6 justify-start gap-4 bg-green-600 hover:bg-green-700"
          onClick={() => handleAddTransaction("in")}
          data-testid="button-got-money"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/20">
            <Plus className="h-6 w-6" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold">You Got</span>
            <span className="text-sm opacity-90">Money received from customer</span>
          </div>
        </Button>

        <Button
          size="lg"
          variant="default"
          className="h-auto p-6 justify-start gap-4 bg-red-600 hover:bg-red-700"
          onClick={() => handleAddTransaction("out")}
          data-testid="button-gave-money"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/20">
            <Minus className="h-6 w-6" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold">You Gave</span>
            <span className="text-sm opacity-90">Money paid to customer</span>
          </div>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {summary.transactionCount} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Add your first transaction using the buttons above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between rounded-md border p-4"
                  data-testid={`card-transaction-${transaction.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                      transaction.type === "in" 
                        ? "bg-green-500/10 text-green-600" 
                        : "bg-red-500/10 text-red-600"
                    }`}>
                      {transaction.type === "in" ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={transaction.type === "in" ? "default" : "secondary"}>
                          {transaction.type === "in" ? "GOT" : "GAVE"}
                        </Badge>
                        <span className="text-sm font-medium">{transaction.category}</span>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{transaction.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === "in" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "in" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
