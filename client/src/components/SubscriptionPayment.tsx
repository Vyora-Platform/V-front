import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan } from "@shared/schema";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionPaymentProps {
  plan: SubscriptionPlan;
  vendorId: string;
  onSuccess?: (subscription: any) => void;
  onError?: () => void;
  onCancel?: () => void;
}

export function SubscriptionPayment({ plan, vendorId, onSuccess, onError, onCancel }: SubscriptionPaymentProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // Automatically start payment when component mounts
  useEffect(() => {
    console.log("SubscriptionPayment component mounted, starting payment...");
    handlePayment();
  }, []); // Empty dependency array means this runs once on mount

  const handlePayment = async () => {
    if (!vendorId) {
      toast({
        title: "Error",
        description: "Vendor ID is required",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create Razorpay order
      const response = await apiRequest("POST", "/api/vendor-subscriptions/create-payment", {
        planId: plan.id,
        vendorId: vendorId
      });

      const responseData = await response.json();
      const { orderId, amount, currency, subscriptionId } = responseData;
      let razorpayKeyId = responseData.razorpayKeyId;

      console.log("Razorpay payment data received:", { orderId, amount, currency, subscriptionId, razorpayKeyId });
      console.log("Full API response data:", responseData);

      // Validate Razorpay key
      console.log("Validating Razorpay key:", {
        razorpayKeyId,
        isFalsy: !razorpayKeyId,
        isOldFallback: razorpayKeyId === 'rzp_test_your_key_id',
        startsWithRzp: razorpayKeyId?.startsWith('rzp_')
      });

      // Validate Razorpay key before creating options
      const keyValidation = {
        hasKey: !!razorpayKeyId,
        isValidFormat: razorpayKeyId?.startsWith('rzp_'),
        isNotOldFallback: razorpayKeyId !== 'rzp_test_your_key_id',
        keyValue: razorpayKeyId
      };

      console.log("Key validation details:", keyValidation);

      if (!keyValidation.hasKey || !keyValidation.isValidFormat || !keyValidation.isNotOldFallback) {
        const errorReasons = [];
        if (!keyValidation.hasKey) errorReasons.push("Key is missing");
        if (!keyValidation.isValidFormat) errorReasons.push("Invalid key format");
        if (!keyValidation.isNotOldFallback) errorReasons.push("Using placeholder key");

        console.warn("Razorpay key validation failed:", errorReasons);
        console.warn("Using fallback test key for debugging...");

        // For debugging: use a known working test key
        razorpayKeyId = 'rzp_test_RhHdGgNx7Uu3Rf';

        toast({
          title: "Using test payment key",
          description: "Payment system is in test mode.",
          variant: "secondary"
        });
      }

      // Initialize Razorpay checkout (after validation)
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: "VYORA Business",
        description: `Subscription to ${plan.displayName}`,
        image: "/logo.png", // Add your logo path
        handler: async (response: any) => {
          // Payment successful - redirect to success page
          try {
            // Call backend to verify and update subscription
            const successResponseRaw = await apiRequest("POST", "/api/vendor-subscriptions/payment-success", {
              subscriptionId,
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            const successResponse = await successResponseRaw.json();

            setPaymentStatus('success');
            toast({
              title: "Payment Successful!",
              description: `Your ${plan.displayName} subscription is now active.`,
            });

            onSuccess?.(successResponse.subscription);

            // Redirect to success page after a short delay
            setTimeout(() => {
              window.location.href = `/vendor/subscription?payment_status=success&subscription_id=${subscriptionId}`;
            }, 2000);

          } catch (error: any) {
            console.error("Payment success processing failed:", error);
            setPaymentStatus('failed');
            setIsProcessing(false);
            toast({
              title: "Payment verification failed",
              description: "Please contact support if amount was debited.",
              variant: "destructive"
            });
            onError?.();

            // Create billing history for failed payment
            try {
              // Get subscription details to populate billing history
              const subscriptionResponse = await apiRequest(`GET`, `/api/vendors/${vendorId}/subscription`);
              const subscriptionData = await subscriptionResponse.json();
              const subscription = subscriptionData.subscription;

              await apiRequest("POST", "/api/billing-history", {
                vendorId: vendorId,
                planId: subscription.planId,
                subscriptionId: subscriptionId,
                amount: (amount / 100).toString(),
                currency: currency,
                status: "failed",
                paymentMethod: "razorpay",
                paymentId: response.razorpay_payment_id || null,
                description: `Failed payment for subscription - Order ${orderId}`,
                periodStart: subscription.currentPeriodStart,
                periodEnd: subscription.currentPeriodEnd,
                stripeInvoiceId: null,
                stripePaymentIntentId: null,
                razorpayOrderId: orderId,
                razorpayPaymentId: response.razorpay_payment_id || null,
                metadata: {
                  paymentFailed: true,
                  failureReason: error?.message || "Verification failed"
                }
              });
            } catch (billingError) {
              console.error("Failed to create failed payment billing history:", billingError);
            }

            // Redirect to error page
            setTimeout(() => {
              window.location.href = `/vendor/subscription?payment_status=error&subscription_id=${subscriptionId}&error=verification_failed`;
            }, 2000);
          }
        },
        prefill: {
          email: "", // You can prefill user email if available
          contact: "", // You can prefill user phone if available
        },
        notes: {
          subscriptionId,
          planName: plan.name
        },
        theme: {
          color: "#2563eb" // Primary blue color
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
            setIsProcessing(false);
            toast({
              title: "Payment cancelled",
              description: "You can try again anytime.",
            });
            onCancel?.();

            // Redirect to subscription page with cancelled status
            setTimeout(() => {
              window.location.href = `/vendor/subscription?payment_status=cancelled&subscription_id=${subscriptionId}`;
            }, 1000);
          }
        }
      };

      console.log("Checking Razorpay availability...");
      console.log("window.Razorpay exists:", !!window.Razorpay);

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        console.error("Razorpay not loaded!");
        toast({
          title: "Payment system not loaded",
          description: "Please refresh the page and try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
        setPaymentStatus('idle');
        return;
      }

      console.log("Razorpay is available, proceeding...");
      console.log("Creating Razorpay instance with options:", options);

      try {
        const razorpayInstance = new window.Razorpay(options);
        console.log("Razorpay instance created successfully, opening modal...");

        razorpayInstance.open();
        console.log("Razorpay modal opened successfully");
      } catch (razorpayError: any) {
        console.error("Razorpay initialization failed:", razorpayError);
        console.error("Error details:", razorpayError?.message, razorpayError?.stack);
        toast({
          title: "Payment initialization failed",
          description: razorpayError?.message || "Unable to initialize payment gateway.",
          variant: "destructive"
        });
        setIsProcessing(false);
        setPaymentStatus('idle');
        onError?.();
      }

    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      setPaymentStatus('failed');
      setIsProcessing(false);

      toast({
        title: "Payment initialization failed",
        description: error?.message || "Please try again later.",
        variant: "destructive"
      });

      onError?.();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription Payment
        </CardTitle>
        <CardDescription>
          {paymentStatus === 'processing'
            ? "Initializing payment gateway..."
            : "Complete your payment to activate the subscription"
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Plan:</span>
            <Badge variant="secondary">{plan.displayName}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Amount:</span>
            <span className="text-lg font-bold text-green-600">
              ₹{plan.price}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Billing:</span>
            <span className="text-sm text-muted-foreground">{plan.billingInterval}</span>
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'processing' && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-blue-700">Processing payment...</span>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700">Payment completed successfully!</span>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
            <span className="text-red-700">Payment failed. Please try again.</span>
          </div>
        )}

        {/* Payment Button - Only show if not automatically starting */}
        {paymentStatus === 'idle' && !isProcessing && (
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ₹{plan.price} - Subscribe Now
          </Button>
        )}

        {/* Cancel Button */}
        {paymentStatus === 'idle' && onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
