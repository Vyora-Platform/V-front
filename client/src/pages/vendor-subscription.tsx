import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check, Zap, TrendingUp, Calendar, CreditCard, AlertCircle } from "lucide-react";
import type { SubscriptionPlan, VendorSubscription, BillingHistory } from "@shared/schema";
import { format, differenceInDays } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { SubscriptionPayment } from "@/components/SubscriptionPayment";

export default function VendorSubscription() {
  const { toast } = useToast();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [location] = useLocation();

  // Get vendor ID from localStorage
  const { vendorId } = useAuth();

  // Handle payment callback redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');

    const paymentStatus = urlParams.get('payment_status');
    const subscriptionId = urlParams.get('subscription_id');
    const error = urlParams.get('error');

    if (paymentStatus) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, location.split('?')[0]);

      if (paymentStatus === 'success') {
        toast({
          title: "Payment Successful! 🎉",
          description: "Your subscription has been activated successfully.",
        });
        // Refresh subscription data
        queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/subscription`] });
        queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/billing-history`] });
      } else if (paymentStatus === 'failed') {
        toast({
          title: "Payment Failed",
          description: "Your payment was not completed. Please try again.",
          variant: "destructive"
        });
      } else if (paymentStatus === 'cancelled') {
        toast({
          title: "Payment Cancelled",
          description: "Payment was cancelled. You can try again anytime.",
          variant: "secondary"
        });
      } else if (paymentStatus === 'error') {
        const errorMessage = error ? `Error: ${error}` : "An error occurred during payment processing.";
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  }, [location, toast, vendorId]);

  // Fetch current subscription
  const { data: subscriptionData, isLoading } = useQuery<{ subscription: VendorSubscription; plan: SubscriptionPlan }>({
    queryKey: [`/api/vendors/${vendorId}/subscription`],
    enabled: !!vendorId,
  });

  // Fetch all plans
  const { data: allPlans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Fetch billing history
  const { data: billingHistory = [] } = useQuery<BillingHistory[]>({
    queryKey: [`/api/vendors/${vendorId}/billing-history`],
    enabled: !!vendorId,
  });

  const currentSubscription = subscriptionData?.subscription;
  const currentPlan = subscriptionData?.plan;

  const daysRemaining = currentSubscription 
    ? differenceInDays(new Date(currentSubscription.currentPeriodEnd), new Date())
    : 0;

  const isTrialActive = currentSubscription?.status === "trial";

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setUpgradeDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh subscription and billing data after successful payment
    queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/subscription`] });
    queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/billing-history`] });
    setUpgradeDialogOpen(false);
    setSelectedPlan(null);
    setPaymentProcessing(false);
  };

  const handlePaymentError = () => {
    setPaymentProcessing(false);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan || !vendorId) return;

    setPaymentProcessing(true);
    // The SubscriptionPayment component will handle the Razorpay integration
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = [];
    
    if (plan.maxServices === -1) {
      features.push("Unlimited Services");
    } else {
      features.push(`Up to ${plan.maxServices} Services`);
    }
    
    if (plan.maxProducts === -1) {
      features.push("Unlimited Products");
    } else {
      features.push(`Up to ${plan.maxProducts} Products`);
    }
    
    if (plan.maxEmployees === -1) {
      features.push("Unlimited Employees");
    } else {
      features.push(`Up to ${plan.maxEmployees} Employees`);
    }
    
    features.push(`${plan.maxStorageGB}GB Storage`);
    
    if (plan.hasAdvancedAnalytics) features.push("Advanced Analytics");
    if (plan.hasPrioritySupport) features.push("Priority Support");
    if (plan.hasCustomDomain) features.push("Custom Domain");
    if (plan.hasMiniWebsite) features.push("Mini Website Builder");
    if (plan.hasWhiteLabel) features.push("White Label");
    if (plan.hasAPI) features.push("API Access");
    if (plan.hasMultiLocation) features.push("Multi-Location");
    
    return features;
  };

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading subscription details...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 md:h-7 md:w-7 text-yellow-500" />
          Subscription & Billing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription plan and view billing history
        </p>
      </div>

      {/* Current Plan Overview */}
      {currentPlan && currentSubscription && (
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          <Card className="md:col-span-2 rounded-xl">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    {currentPlan.isPopular && <Crown className="h-5 w-5 text-yellow-500" />}
                    {currentPlan.displayName}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">{currentPlan.description}</CardDescription>
                </div>
                {isTrialActive && (
                  <Badge className="bg-blue-500 text-xs">Trial Period</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold">₹{currentPlan.price}</span>
                <span className="text-sm text-muted-foreground">/ {currentPlan.billingInterval}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium capitalize text-sm">{currentSubscription.status}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Renewal Date</div>
                  <div className="font-medium text-sm">
                    {format(new Date(currentSubscription.currentPeriodEnd), "MMM dd, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Days Remaining</div>
                  <div className="font-medium text-orange-600 text-sm">{daysRemaining} days</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Auto-Renew</div>
                  <div className="font-medium text-sm">{currentSubscription.autoRenew ? "Enabled" : "Disabled"}</div>
                </div>
              </div>

              {isTrialActive && currentSubscription.trialEndDate && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                        Trial ends on {format(new Date(currentSubscription.trialEndDate), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Upgrade now to continue using Vyora without interruption
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base">Current Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Orders This Month</span>
                  <span className="font-medium">{currentSubscription?.currentMonthOrders ?? 0} / {(currentPlan?.maxOrders ?? 0) === -1 ? "∞" : (currentPlan?.maxOrders ?? 0)}</span>
                </div>
                <Progress 
                  value={(currentPlan?.maxOrders ?? 0) === -1 ? 0 : ((currentSubscription?.currentMonthOrders ?? 0) / (currentPlan?.maxOrders ?? 1)) * 100} 
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Bookings This Month</span>
                  <span className="font-medium">{currentSubscription?.currentMonthBookings ?? 0} / {(currentPlan?.maxBookings ?? 0) === -1 ? "∞" : (currentPlan?.maxBookings ?? 0)}</span>
                </div>
                <Progress 
                  value={(currentPlan?.maxBookings ?? 0) === -1 ? 0 : ((currentSubscription?.currentMonthBookings ?? 0) / (currentPlan?.maxBookings ?? 1)) * 100} 
                  className="h-1.5"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Appointments This Month</span>
                  <span className="font-medium">{currentSubscription?.currentMonthAppointments ?? 0} / {(currentPlan?.maxAppointments ?? 0) === -1 ? "∞" : (currentPlan?.maxAppointments ?? 0)}</span>
                </div>
                <Progress 
                  value={(currentPlan?.maxAppointments ?? 0) === -1 ? 0 : ((currentSubscription?.currentMonthAppointments ?? 0) / (currentPlan?.maxAppointments ?? 1)) * 100} 
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-3">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {allPlans
            .filter(p => p.isActive)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((plan) => {
              const features = getPlanFeatures(plan);
              const isCurrentPlan = currentPlan?.id === plan.id;

              return (
                <Card 
                  key={plan.id} 
                  className={`relative rounded-xl ${plan.isPopular ? "border-2 border-yellow-500 shadow-lg" : ""} ${isCurrentPlan ? "bg-muted/50" : ""}`}
                  data-testid={`card-plan-${plan.name}`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-yellow-500 px-3 text-xs">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {plan.isPopular && <Crown className="h-5 w-5 text-yellow-500" />}
                      {plan.displayName}
                    </CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 p-4 md:p-6 pt-0 md:pt-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl md:text-2xl font-bold">₹{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/ {plan.billingInterval}</span>
                    </div>

                    {(plan.trialDays ?? 0) > 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        {plan.trialDays} days free trial
                      </div>
                    )}

                    <div className="space-y-2 pt-3">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                          <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3">
                      {isCurrentPlan ? (
                        <Button className="w-full h-[var(--cta-h)] text-sm" disabled data-testid={`button-current-${plan.name}`}>
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full h-[var(--cta-h)] text-sm" 
                          variant={plan.isPopular ? "default" : "outline"}
                          onClick={() => handleUpgrade(plan)}
                          data-testid={`button-upgrade-${plan.name}`}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Billing History */}
      <Card className="rounded-xl">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription className="text-sm">Your payment transaction history</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold">Description</TableHead>
                    <TableHead className="text-xs font-semibold">Invoice</TableHead>
                    <TableHead className="text-xs font-semibold">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        No billing history yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    billingHistory.map((bill) => (
                      <TableRow key={bill.id} data-testid={`row-billing-${bill.id}`}>
                        <TableCell className="text-sm">{format(new Date(bill.createdAt), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-sm">{bill.description || "Subscription Payment"}</TableCell>
                        <TableCell className="font-mono text-xs">{bill.invoiceNumber || "-"}</TableCell>
                        <TableCell className="font-medium text-sm">₹{bill.amount}</TableCell>
                        <TableCell>
                          {bill.status === "succeeded" && <Badge variant="default" className="text-xs">Paid</Badge>}
                          {bill.status === "pending" && <Badge variant="secondary" className="text-xs">Pending</Badge>}
                          {bill.status === "failed" && <Badge variant="destructive" className="text-xs">Failed</Badge>}
                          {bill.status === "refunded" && <Badge variant="outline" className="text-xs">Refunded</Badge>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Upgrade to {selectedPlan?.displayName}</DialogTitle>
            <DialogDescription className="text-sm">
              Complete your payment to activate your new subscription
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-3 py-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-semibold">{selectedPlan.displayName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-xl font-bold">₹{selectedPlan.price}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Billing:</span>
                <span className="capitalize">{selectedPlan.billingInterval}ly</span>
              </div>
              
              <div className="bg-muted p-3 rounded-xl">
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to PayU payment gateway to complete your purchase securely.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-3">
            {paymentProcessing && selectedPlan ? (
              <div className="w-full">
                <SubscriptionPayment
                  plan={selectedPlan}
                  vendorId={vendorId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            ) : (
              <>
                <div className="bg-muted p-3 rounded-xl w-full">
                  <p className="text-xs text-muted-foreground">
                    You'll be redirected to Razorpay to complete your payment securely.
                    Your subscription will be activated once payment is confirmed.
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setUpgradeDialogOpen(false)}
                    disabled={paymentProcessing}
                    className="flex-1 h-[var(--cta-h)] text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmUpgrade}
                    disabled={paymentProcessing}
                    className="flex-1 h-[var(--cta-h)] text-sm"
                  >
                    {paymentProcessing ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
