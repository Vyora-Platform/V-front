import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Crown, CreditCard, Receipt, Download, 
  CheckCircle2, XCircle, Clock, Calendar, Zap,
  FileText, ChevronRight, Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LoadingSpinner } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BillingTransaction {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  invoiceNumber: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
  createdAt: string;
}

export default function VendorBilling() {
  const { vendorId } = useAuth();
  const { subscription, isPro, isFree } = useSubscription();
  const [activeTab, setActiveTab] = useState("transactions");

  const { data: transactions = [], isLoading } = useQuery<BillingTransaction[]>({
    queryKey: [`/api/vendors/${vendorId}/billing-history`],
    enabled: !!vendorId,
  });

  const { data: currentPlan } = useQuery({
    queryKey: [`/api/subscription-plans/${subscription?.planId}`],
    enabled: !!subscription?.planId,
  });

  if (!vendorId) return <LoadingSpinner />;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      succeeded: "bg-green-100 text-green-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      pending: "bg-amber-100 text-amber-700",
      refunded: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4">
          <Link href="/vendor/account">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-bold">Subscription & Billing</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Manage your plan and payments</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:px-6 space-y-4 max-w-4xl mx-auto">
        {/* Current Plan Card */}
        <Card className={cn(
          "overflow-hidden rounded-xl min-h-[var(--card-min-h)]",
          isPro 
            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
            : "bg-gradient-to-r from-blue-500 to-blue-600"
        )}>
          <CardContent className="p-4 md:p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6" />
                  <span className="text-lg font-bold">{isPro ? "Pro Plan" : "Free Plan"}</span>
                </div>
                {isPro && subscription && (
                  <p className="text-sm text-white/80">
                    Renews on {format(new Date(subscription.currentPeriodEnd), "MMM dd, yyyy")}
                  </p>
                )}
                {isFree && (
                  <p className="text-sm text-white/80">
                    Limited access to features
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{isPro ? "₹399" : "₹0"}</p>
                <p className="text-sm text-white/80">/month</p>
              </div>
            </div>
            
            {isFree && (
              <Link href="/vendor/account?upgrade=true">
                <Button className="w-full mt-4 bg-white text-amber-600 hover:bg-white/90">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro - ₹399/month
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-[var(--input-h)]">
            <TabsTrigger value="transactions" className="flex items-center gap-2 text-sm">
              <Receipt className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <Card className="p-8 text-center rounded-xl">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-base">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your payment history will appear here
                </p>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow rounded-xl">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          transaction.status === "succeeded" || transaction.status === "completed"
                            ? "bg-green-100 dark:bg-green-900"
                            : transaction.status === "failed"
                            ? "bg-red-100 dark:bg-red-900"
                            : "bg-amber-100 dark:bg-amber-900"
                        )}>
                          {getStatusIcon(transaction.status)}
                        </div>
                      <div>
                        <p className="font-semibold text-sm md:text-base">{transaction.description || "Subscription Payment"}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {format(new Date(transaction.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                        {transaction.invoiceNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Invoice: {transaction.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base md:text-lg">
                        {transaction.currency === "INR" ? "₹" : transaction.currency}
                        {parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <Badge className={cn("text-xs mt-1", getStatusBadge(transaction.status))}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-3 md:gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs md:text-sm">
                        <CreditCard className="w-3 h-3" />
                        {transaction.paymentMethod || "Razorpay"}
                      </span>
                      {transaction.periodStart && transaction.periodEnd && (
                        <span className="flex items-center gap-1 text-xs md:text-sm">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(transaction.periodStart), "MMM dd")} - {format(new Date(transaction.periodEnd), "MMM dd, yyyy")}
                        </span>
                      )}
                    </div>
                    {transaction.invoiceNumber && (
                      <Button variant="ghost" size="sm" className="text-blue-600 h-9 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Invoice
                      </Button>
                    )}
                  </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              transactions
                .filter(t => t.invoiceNumber && (t.status === "succeeded" || t.status === "completed"))
                .length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No invoices yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your invoices will appear here after successful payments
                  </p>
                </Card>
              ) : (
                transactions
                  .filter(t => t.invoiceNumber && (t.status === "succeeded" || t.status === "completed"))
                  .map((invoice) => (
                    <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer rounded-xl">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900">
                              <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm md:text-base">{invoice.invoiceNumber}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {format(new Date(invoice.paidAt || invoice.createdAt), "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="text-right">
                              <p className="font-bold text-sm md:text-base">₹{parseFloat(invoice.amount).toFixed(2)}</p>
                              <Badge className="bg-green-100 text-green-700 text-xs">Paid</Badge>
                            </div>
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )
            )}
          </TabsContent>
        </Tabs>

        {/* Billing FAQ */}
        <Card className="mt-6 rounded-xl">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
            <CardTitle className="text-base md:text-lg">Billing FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm p-4 md:p-6 pt-2 md:pt-2">
            <div>
              <p className="font-medium text-sm md:text-base">How do I cancel my subscription?</p>
              <p className="text-muted-foreground mt-1 text-xs md:text-sm">
                You can cancel anytime from Account → Subscription. Your access continues until the end of your billing period.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">Can I get a refund?</p>
              <p className="text-muted-foreground mt-1 text-xs md:text-sm">
                All payments are non-refundable as per our refund policy. Please review features before upgrading.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm md:text-base">What payment methods are accepted?</p>
              <p className="text-muted-foreground mt-1 text-xs md:text-sm">
                We accept UPI, Credit/Debit Cards, Net Banking, and Wallets via Razorpay.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


