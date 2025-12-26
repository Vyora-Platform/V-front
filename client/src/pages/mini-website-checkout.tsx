import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  ArrowLeft, ShoppingCart, Plus, Minus, X, Tag, Check,
  ChevronRight, Truck, Package, Clock, Calendar, Percent,
  Wallet, CreditCard, Banknote, Gift, Info, Copy, CheckCircle2
} from "lucide-react";
import type { MiniWebsite, VendorCatalogue, VendorProduct } from "@shared/schema";

interface CartItem {
  type: 'product' | 'service';
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorProductId?: string;
  vendorCatalogueId?: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  image?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  maxUsage: number;
  usedCount: number;
  status: string;
  applicationType: string;
  applicableServices?: string[];
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export default function MiniWebsiteCheckout() {
  const [, params] = useRoute("/:subdomain/checkout");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponDetailOpen, setCouponDetailOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customer auth on mount
  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const data = localStorage.getItem("customerData");
    if (token && data && data !== "undefined" && data !== "null") {
      try {
        setCustomerToken(token);
        setCustomerData(JSON.parse(data));
      } catch {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerData");
      }
    }
  }, [subdomain]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${subdomain}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch { /* ignore */ }
    }
  }, [subdomain]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
  }, [cart, subdomain]);

  // Fetch mini-website data
  const { data, isLoading, error } = useQuery<MiniWebsite & { 
    services: VendorCatalogue[],
    products: VendorProduct[],
    coupons?: Coupon[],
  }>({
    queryKey: [`/api/mini-website/${subdomain}`],
    enabled: !!subdomain,
    staleTime: 0,
  });

  // Calculate cart totals
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((cartTotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }
  const finalTotal = cartTotal - discountAmount;

  // Extract data
  const businessName = (data as any)?.businessName || data?.businessInfo?.businessName || "Business";
  const primaryColor = data?.branding?.primaryColor || "#4F46E5";
  const vendorId = data?.vendorId || "";
  
  // Get active coupons
  const availableCoupons = (data?.coupons || []).filter((coupon: Coupon) => {
    if (coupon.status !== 'active') return false;
    if (new Date(coupon.expiryDate) < new Date()) return false;
    if (coupon.usedCount >= coupon.maxUsage) return false;
    return true;
  });

  // Update cart quantity
  const updateCartQuantity = (itemId: string, itemType: 'product' | 'service', delta: number) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.id === itemId && item.type === itemType
      );
      
      if (existingIndex === -1) return prevCart;
      
      const newCart = [...prevCart];
      const newQuantity = newCart[existingIndex].quantity + delta;
      
      if (newQuantity <= 0) {
        newCart.splice(existingIndex, 1);
      } else {
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQuantity };
      }
      
      return newCart;
    });
  };

  // Apply coupon
  const handleApplyCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponError("");

    try {
      const res = await fetch(`/api/coupons/validate/${code.toUpperCase()}?vendorId=${vendorId}&subtotal=${cartTotal}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        setCouponError(errorData.error || "Invalid or expired coupon");
        return;
      }

      const coupon = await res.json();
      
      // Check minimum order amount
      if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
        setCouponError(`Minimum order amount is ₹${coupon.minOrderAmount}`);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponCode(code.toUpperCase());
      toast({ 
        title: "Coupon Applied!", 
        description: `You saved ₹${coupon.discountType === 'percentage' 
          ? Math.round((cartTotal * coupon.discountValue) / 100) 
          : coupon.discountValue}!` 
      });
    } catch (error) {
      setCouponError("Failed to apply coupon. Please try again.");
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast({ title: "Coupon Removed" });
  };

  // Copy coupon code
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied!", description: code });
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!customerToken || !customerData) {
      toast({ 
        title: "Please Login", 
        description: "You need to login to place an order",
        variant: "destructive"
      });
      setLocation(`/${subdomain}/login?redirect=checkout`);
      return;
    }

    if (cart.length === 0) {
      toast({ title: "Cart is Empty", description: "Add items to your cart first", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        vendorId,
        customerId: customerData.id,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        items: cart.map(item => ({
          type: item.type,
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          vendorProductId: item.vendorProductId,
          vendorCatalogueId: item.vendorCatalogueId,
        })),
        subtotal: cartTotal,
        discountAmount,
        couponId: appliedCoupon?.id,
        couponCode: appliedCoupon?.code,
        totalAmount: finalTotal,
        paymentMethod,
        deliveryAddress,
        notes,
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      };

      const res = await apiRequest("POST", `/api/vendors/${vendorId}/orders`, orderData);
      
      if (!res.ok) {
        throw new Error("Failed to place order");
      }

      // Clear cart after successful order
      setCart([]);
      localStorage.removeItem(`cart_${subdomain}`);

      toast({ 
        title: "Order Placed Successfully!", 
        description: "You will receive a confirmation shortly." 
      });

      setLocation(`/${subdomain}/my-orders`);
    } catch (error) {
      toast({ 
        title: "Failed to Place Order", 
        description: "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format expiry date
  const formatExpiryDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-muted-foreground">Something went wrong</p>
          <Button onClick={() => setLocation(`/${subdomain}`)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center h-14 px-4">
            <button 
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  setLocation(`/${subdomain}`);
                }
              }}
              className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-lg ml-2">Checkout</h1>
          </div>
        </header>
        
        {/* Empty Cart */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="font-semibold text-lg text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Add items to your cart to checkout</p>
          <Button 
            onClick={() => setLocation(`/${subdomain}`)}
            style={{ backgroundColor: primaryColor }}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4">
          <button 
            onClick={() => {
              // Standard e-commerce back navigation - go back to previous page if available
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setLocation(`/${subdomain}`);
              }
            }}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg ml-2">Checkout</h1>
          <span className="text-sm text-gray-500 ml-auto">{cartItemCount} items</span>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" style={{ color: primaryColor }} />
              Order Summary
            </h2>
          </div>
          <CardContent className="p-3 space-y-3">
            {cart.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="font-semibold text-sm" style={{ color: primaryColor }}>
                      ₹{item.price * item.quantity}
                    </p>
                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                      <button 
                        className="w-7 h-7 flex items-center justify-center"
                        onClick={() => updateCartQuantity(item.id, item.type, -1)}
                      >
                        <Minus className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        className="w-7 h-7 flex items-center justify-center"
                        onClick={() => updateCartQuantity(item.id, item.type, 1)}
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Coupons Section */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4" style={{ color: primaryColor }} />
              Coupons & Offers
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Applied Coupon */}
            {appliedCoupon ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">
                        {appliedCoupon.discountType === 'percentage' 
                          ? `${appliedCoupon.discountValue}% off` 
                          : `₹${appliedCoupon.discountValue} off`}
                        {' '}• Saving ₹{discountAmount}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemoveCoupon}
                    className="p-1.5 hover:bg-green-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-green-700" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Coupon Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    className="flex-1 uppercase"
                  />
                  <Button 
                    onClick={() => handleApplyCoupon(couponCode)}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 -mt-2">{couponError}</p>
                )}

                {/* Available Coupons */}
                {availableCoupons.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Available Coupons
                    </p>
                    <div className="space-y-3">
                      {availableCoupons.map((coupon: Coupon) => {
                        const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                        const isApplicable = !coupon.minOrderAmount || cartTotal >= coupon.minOrderAmount;
                        
                        return (
                          <div 
                            key={coupon.id}
                            className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                              isApplicable 
                                ? 'border-dashed border-gray-300 hover:border-gray-400 cursor-pointer' 
                                : 'border-dashed border-gray-200 opacity-60'
                            }`}
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setCouponDetailOpen(true);
                            }}
                          >
                            {/* Coupon Card */}
                            <div className="flex">
                              {/* Left Side - Discount Badge */}
                              <div 
                                className="w-24 flex-shrink-0 flex flex-col items-center justify-center p-3"
                                style={{ backgroundColor: primaryColor + '15' }}
                              >
                                {coupon.image ? (
                                  <img 
                                    src={coupon.image} 
                                    alt={coupon.code} 
                                    className="w-12 h-12 object-contain mb-1"
                                  />
                                ) : (
                                  <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                                    style={{ backgroundColor: primaryColor + '30' }}
                                  >
                                    <Gift className="h-6 w-6" style={{ color: primaryColor }} />
                                  </div>
                                )}
                                <p className="font-bold text-lg" style={{ color: primaryColor }}>
                                  {coupon.discountType === 'percentage' 
                                    ? `${coupon.discountValue}%` 
                                    : `₹${coupon.discountValue}`}
                                </p>
                                <p className="text-[10px] font-medium text-gray-600">OFF</p>
                              </div>
                              
                              {/* Right Side - Details */}
                              <div className="flex-1 p-3 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-gray-800 font-mono">{coupon.code}</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyCoupon(coupon.code);
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2">{coupon.description}</p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                    {coupon.minOrderAmount > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        Min ₹{coupon.minOrderAmount}
                                      </span>
                                    )}
                                    <span className={`flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-500' : ''}`}>
                                      <Clock className="h-3 w-3" />
                                      {daysLeft <= 0 ? 'Expires today' : `${daysLeft}d left`}
                                    </span>
                                  </div>
                                  
                                  {isApplicable ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApplyCoupon(coupon.code);
                                      }}
                                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                                      style={{ backgroundColor: primaryColor, color: 'white' }}
                                    >
                                      Apply
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">
                                      Add ₹{coupon.minOrderAmount - cartTotal} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Decorative circles for ticket effect */}
                            <div 
                              className="absolute left-[92px] top-0 w-4 h-4 bg-gray-50 rounded-full -translate-x-1/2 -translate-y-1/2"
                            />
                            <div 
                              className="absolute left-[92px] bottom-0 w-4 h-4 bg-gray-50 rounded-full -translate-x-1/2 translate-y-1/2"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Truck className="h-4 w-4" style={{ color: primaryColor }} />
              Delivery Address
            </h2>
          </div>
          <CardContent className="p-4">
            <Textarea
              placeholder="Enter your complete delivery address..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" style={{ color: primaryColor }} />
              Payment Method
            </h2>
          </div>
          <CardContent className="p-4">
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              {/* COD - Default */}
              <label 
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="cod" id="cod" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-800">Cash on Delivery</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 ml-7">
                    Pay when you receive your order
                  </p>
                </div>
                {paymentMethod === 'cod' && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </label>

              {/* Online Payment - Coming Soon */}
              <label 
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 mt-3"
              >
                <RadioGroupItem value="online" id="online" disabled />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-500">Pay Online</span>
                    <Badge variant="outline" className="border-amber-300 text-amber-600 text-[10px]">
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 ml-7">
                    UPI, Cards, Net Banking, Wallets
                  </p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Order Notes */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Info className="h-4 w-4" style={{ color: primaryColor }} />
              Order Notes (Optional)
            </h2>
          </div>
          <CardContent className="p-4">
            <Textarea
              placeholder="Any special instructions for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom - Price Summary & Place Order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 space-y-3 z-50">
        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({cartItemCount} items)</span>
            <span className="text-gray-900">₹{cartTotal}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Coupon Discount
              </span>
              <span className="text-green-600">-₹{discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className="text-green-600 font-medium">FREE</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-lg" style={{ color: primaryColor }}>₹{finalTotal}</span>
          </div>
        </div>

        {/* Place Order Button */}
        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ backgroundColor: primaryColor }}
          onClick={handlePlaceOrder}
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Order...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Place Order • ₹{finalTotal}
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
        </Button>
      </div>

      {/* Coupon Detail Sheet */}
      <Sheet open={couponDetailOpen} onOpenChange={setCouponDetailOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" style={{ color: primaryColor }} />
              Coupon Details
            </SheetTitle>
          </SheetHeader>
          
          {selectedCoupon && (
            <div className="space-y-4">
              {/* Coupon Header */}
              <div 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: primaryColor + '15' }}
              >
                {selectedCoupon.image && (
                  <img 
                    src={selectedCoupon.image} 
                    alt={selectedCoupon.code} 
                    className="w-20 h-20 object-contain mx-auto mb-3"
                  />
                )}
                <p className="font-bold text-2xl font-mono" style={{ color: primaryColor }}>
                  {selectedCoupon.code}
                </p>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {selectedCoupon.discountType === 'percentage' 
                    ? `${selectedCoupon.discountValue}% OFF` 
                    : `₹${selectedCoupon.discountValue} OFF`}
                </p>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600">{selectedCoupon.description}</p>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Terms & Conditions</h4>
                <div className="space-y-2 text-sm">
                  {selectedCoupon.minOrderAmount > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span>Minimum order: ₹{selectedCoupon.minOrderAmount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Valid until: {formatExpiryDate(selectedCoupon.expiryDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span>
                      {selectedCoupon.applicationType === 'all' 
                        ? 'Applicable on all products & services'
                        : selectedCoupon.applicationType === 'specific_products'
                        ? 'Applicable on selected products'
                        : selectedCoupon.applicationType === 'specific_services'
                        ? 'Applicable on selected services'
                        : 'Applicable on selected categories'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Percent className="h-4 w-4 text-gray-400" />
                    <span>
                      {selectedCoupon.maxUsage - selectedCoupon.usedCount} uses remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <Button
                className="w-full h-12"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  handleApplyCoupon(selectedCoupon.code);
                  setCouponDetailOpen(false);
                }}
                disabled={selectedCoupon.minOrderAmount > 0 && cartTotal < selectedCoupon.minOrderAmount}
              >
                {selectedCoupon.minOrderAmount > 0 && cartTotal < selectedCoupon.minOrderAmount ? (
                  `Add ₹${selectedCoupon.minOrderAmount - cartTotal} more to apply`
                ) : (
                  'Apply Coupon'
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

