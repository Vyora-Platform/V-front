import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Tag, Plus, Trash2, Home, Truck, DollarSign } from "lucide-react";
import type { Coupon } from "@shared/schema";

interface CartItem {
  type: "product" | "service";
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  productId?: string;
  serviceId?: string;
}

interface AdditionalCharge {
  id: string;
  type: "home_delivery" | "pickup" | "custom";
  label: string;
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

interface EnhancedCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  vendorId: string;
  onCheckout: (data: CheckoutData) => Promise<void>;
}

export interface CheckoutData {
  discountType?: "percentage" | "fixed" | "coupon";
  discountAmount: number;
  discountPercentage?: number;
  couponId?: string;
  couponCode?: string;
  additionalCharges: AdditionalCharge[];
  paymentMethod: string;
  paymentAmount: number;
  notes?: string;
}

const CHARGE_TEMPLATES = {
  home_delivery: { label: "Home Delivery", defaultAmount: 50, gstRate: 18 },
  pickup: { label: "Home Pickup", defaultAmount: 30, gstRate: 18 },
  custom: { label: "Custom Charge", defaultAmount: 0, gstRate: 18 },
};

export function EnhancedCheckoutDialog({
  open,
  onOpenChange,
  cartItems,
  vendorId,
  onCheckout,
}: EnhancedCheckoutDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Step 2: Discount state
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "coupon">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Step 3: Additional charges
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentMode, setPaymentMode] = useState<"full" | "partial" | "credit">("full");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemTax = subtotal * 0.18; // 18% GST on items

  // Calculate discount
  let discountAmount = 0;
  let discountPercentage = 0;
  if (discountType === "percentage" && discountValue) {
    discountPercentage = parseFloat(discountValue);
    discountAmount = (subtotal * discountPercentage) / 100;
  } else if (discountType === "fixed" && discountValue) {
    discountAmount = parseFloat(discountValue);
  } else if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discountPercentage = appliedCoupon.discountValue;
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Calculate additional charges total
  const additionalChargesTotal = additionalCharges.reduce(
    (sum, charge) => sum + charge.totalAmount,
    0
  );

  // Final total
  const total = subtotal + itemTax - discountAmount + additionalChargesTotal;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: "Please enter a coupon code", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`/api/vendors/${vendorId}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });

      if (!res.ok) {
        toast({ title: "Invalid or expired coupon", variant: "destructive" });
        return;
      }

      const coupon = await res.json();
      setAppliedCoupon(coupon);
      setDiscountType("coupon");
      toast({ title: "✓ Coupon applied successfully!" });
    } catch (error) {
      toast({ title: "Failed to apply coupon", variant: "destructive" });
    }
  };

  const handleAddCharge = (type: keyof typeof CHARGE_TEMPLATES) => {
    const template = CHARGE_TEMPLATES[type];
    const baseAmount = template.defaultAmount;
    const gstAmount = (baseAmount * template.gstRate) / 100;
    const totalAmount = baseAmount + gstAmount;

    const newCharge: AdditionalCharge = {
      id: `${type}-${Date.now()}`,
      type,
      label: template.label,
      baseAmount,
      gstRate: template.gstRate,
      gstAmount,
      totalAmount,
    };

    setAdditionalCharges([...additionalCharges, newCharge]);
  };

  const handleUpdateCharge = (id: string, baseAmount: number) => {
    setAdditionalCharges(
      additionalCharges.map((charge) => {
        if (charge.id === id) {
          const gstAmount = (baseAmount * charge.gstRate) / 100;
          return {
            ...charge,
            baseAmount,
            gstAmount,
            totalAmount: baseAmount + gstAmount,
          };
        }
        return charge;
      })
    );
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter((charge) => charge.id !== id));
  };

  const handleFinalCheckout = async () => {
    setLoading(true);
    try {
      const amount = paymentMode === "full" ? total : paymentMode === "partial" ? parseFloat(paymentAmount) : 0;

      const checkoutData: CheckoutData = {
        discountType: discountType,
        discountAmount,
        discountPercentage: discountType === "percentage" ? discountPercentage : undefined,
        couponId: appliedCoupon?.id,
        couponCode: appliedCoupon?.code,
        additionalCharges,
        paymentMethod,
        paymentAmount: amount,
        notes,
      };

      await onCheckout(checkoutData);
      
      // Reset state
      setStep(1);
      setDiscountType("percentage");
      setDiscountValue("");
      setAppliedCoupon(null);
      setAdditionalCharges([]);
      setPaymentMode("full");
      setPaymentAmount("");
      setNotes("");
    } catch (error) {
      toast({ title: "Checkout failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Checkout - Step {step} of 4
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Review Items */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Review Items</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity} {item.unit}
                      </div>
                    </div>
                    <div className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (18%):</span>
                <span>₹{itemTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{(subtotal + itemTax).toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full" data-testid="button-next-step-1">
              Next: Apply Discount <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Discount & Coupons */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Apply Discount or Coupon</h3>
            
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(val: any) => {
                setDiscountType(val);
                setAppliedCoupon(null);
              }}>
                <SelectTrigger data-testid="select-discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="coupon">Coupon Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {discountType !== "coupon" && (
              <div className="space-y-2">
                <Label>{discountType === "percentage" ? "Discount (%)" : "Discount Amount (₹)"}</Label>
                <Input
                  type="number"
                  placeholder={discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  data-testid="input-discount-value"
                />
              </div>
            )}

            {discountType === "coupon" && !appliedCoupon && (
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    data-testid="input-coupon-code"
                  />
                  <Button onClick={handleApplyCoupon} data-testid="button-apply-coupon">
                    <Tag className="mr-2 h-4 w-4" /> Apply
                  </Button>
                </div>
              </div>
            )}

            {appliedCoupon && (
              <Card className="bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-300">
                        {appliedCoupon.code}
                      </div>
                      <div className="text-sm text-muted-foreground">{appliedCoupon.description}</div>
                    </div>
                    <Badge variant="default">
                      {appliedCoupon.discountType === "percentage"
                        ? `${appliedCoupon.discountValue}% OFF`
                        : `₹${appliedCoupon.discountValue} OFF`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {discountAmount > 0 && (
              <div className="p-3 bg-muted rounded">
                <div className="flex justify-between text-sm">
                  <span>Discount Applied:</span>
                  <span className="text-green-600 font-semibold">-₹{discountAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1" data-testid="button-next-step-2">
                Next: Additional Charges <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Additional Charges */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Additional Charges</h3>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddCharge("home_delivery")}
                data-testid="button-add-home-delivery"
              >
                <Truck className="mr-2 h-4 w-4" /> Home Delivery
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddCharge("pickup")}
                data-testid="button-add-pickup"
              >
                <Home className="mr-2 h-4 w-4" /> Home Pickup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddCharge("custom")}
                data-testid="button-add-custom"
              >
                <DollarSign className="mr-2 h-4 w-4" /> Custom Charge
              </Button>
            </div>

            {additionalCharges.length > 0 && (
              <div className="space-y-2">
                {additionalCharges.map((charge) => (
                  <Card key={charge.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{charge.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCharge(charge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Base Amount</Label>
                          <Input
                            type="number"
                            value={charge.baseAmount}
                            onChange={(e) => handleUpdateCharge(charge.id, parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">GST ({charge.gstRate}%)</Label>
                          <Input
                            value={`₹${charge.gstAmount.toFixed(2)}`}
                            disabled
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="text-right font-semibold">
                        Total: ₹{charge.totalAmount.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {additionalCharges.length > 0 && (
              <div className="p-3 bg-muted rounded">
                <div className="flex justify-between text-sm">
                  <span>Total Additional Charges:</span>
                  <span className="font-semibold">₹{additionalChargesTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1" data-testid="button-next-step-3">
                Next: Payment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Payment Details</h3>

            <Card className="bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%):</span>
                  <span>₹{itemTax.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {additionalChargesTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Additional Charges:</span>
                    <span>₹{additionalChargesTotal.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method-enhanced">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                <SelectTrigger data-testid="select-payment-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="credit">Credit (Pay Later)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMode === "partial" && (
              <div className="space-y-2">
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  placeholder={`Enter amount (₹${total.toFixed(2)})`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  data-testid="input-partial-amount"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this transaction..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleFinalCheckout}
                className="flex-1"
                disabled={loading || (paymentMode === "partial" && !paymentAmount)}
                data-testid="button-complete-checkout"
              >
                <Check className="mr-2 h-4 w-4" />
                {loading ? "Processing..." : "Complete Checkout"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
