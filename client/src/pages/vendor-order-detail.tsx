import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Phone, Mail, MapPin, Package, Truck, 
  IndianRupee, Clock, User, Copy, 
  CheckCircle, XCircle, Timer, Box, Globe, Store,
  Smartphone, CreditCard, Banknote, Wallet, ChevronLeft, Lock
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link, useRoute, useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, OrderItem } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";

export default function VendorOrderDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/orders/:id");
  const orderId = params?.id;
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [trackingNumber, setTrackingNumber] = useState("");

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Fetch order items
  const { data: orderItems = [], isLoading: itemsLoading } = useQuery<OrderItem[]>({
    queryKey: [`/api/orders/${orderId}/items`],
    enabled: !!orderId,
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/orders`] });
      toast({ title: "Order updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { color: "bg-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/20", textColor: "text-amber-700 dark:text-amber-400", icon: Timer, label: "Pending" };
      case "confirmed": return { color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20", textColor: "text-blue-700 dark:text-blue-400", icon: CheckCircle, label: "Confirmed" };
      case "processing": return { color: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-900/20", textColor: "text-purple-700 dark:text-purple-400", icon: Box, label: "Processing" };
      case "shipped": return { color: "bg-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-900/20", textColor: "text-cyan-700 dark:text-cyan-400", icon: Truck, label: "Shipped" };
      case "delivered": return { color: "bg-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", textColor: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle, label: "Delivered" };
      case "cancelled": return { color: "bg-red-500", bgColor: "bg-red-50 dark:bg-red-900/20", textColor: "text-red-700 dark:text-red-400", icon: XCircle, label: "Cancelled" };
      default: return { color: "bg-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-700", icon: Package, label: status };
    }
  };

  const getSourceInfo = (source: string | null) => {
    switch (source) {
      case "pos": return { icon: Store, label: "POS Order", color: "text-blue-600" };
      case "miniwebsite": return { icon: Globe, label: "Website Order", color: "text-emerald-600" };
      case "app": return { icon: Smartphone, label: "App Order", color: "text-purple-600" };
      default: return { icon: Package, label: "Manual Order", color: "text-gray-600" };
    }
  };

  const getPaymentMethodInfo = (method: string | null) => {
    switch (method) {
      case "cod": return { icon: Banknote, label: "Cash on Delivery" };
      case "online": return { icon: CreditCard, label: "Online Payment" };
      case "wallet": return { icon: Wallet, label: "Wallet" };
      default: return { icon: CreditCard, label: "Not Specified" };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // Handle direct call - no redirection
  const handleCall = () => {
    if (order?.customerPhone) {
      window.location.href = `tel:${order.customerPhone}`;
    }
  };

  const orderTimeline = [
    { status: "pending", label: "Placed" },
    { status: "confirmed", label: "Confirmed" },
    { status: "processing", label: "Processing" },
    { status: "shipped", label: "Shipped" },
    { status: "delivered", label: "Delivered" },
  ];

  if (orderLoading || itemsLoading || !orderId) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">This order doesn't exist or has been deleted.</p>
        <Link href="/vendor/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const sourceInfo = getSourceInfo(order.source);
  const SourceIcon = sourceInfo.icon;
  const paymentInfo = getPaymentMethodInfo(order.paymentMethod);
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center justify-between p-4 max-w-[800px] mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              onClick={() => setLocation("/vendor/orders")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">#{order.id.slice(-8).toUpperCase()}</h1>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.id)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "PPP 'at' h:mm a")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Single Page Content */}
      <div className="max-w-[800px] mx-auto p-4 space-y-4">
        
        {/* Status & Source Card */}
        <Card className="border-0 shadow-sm overflow-hidden rounded-xl">
          <div className={cn("h-1.5", statusConfig.color)} />
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                <StatusIcon className={cn("w-7 h-7", statusConfig.textColor)} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{statusConfig.label}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SourceIcon className={cn("w-4 h-4", sourceInfo.color)} />
                  <span>{sourceInfo.label}</span>
                </div>
              </div>
            </div>

            {/* Timeline - Compact */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                {orderTimeline.map((step, idx) => {
                  const currentIdx = orderTimeline.findIndex(s => s.status === order.status);
                  const isCompleted = currentIdx >= idx;
                  const isCancelled = order.status === "cancelled";
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center flex-1">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        isCancelled ? "bg-red-100 text-red-500" :
                        isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <p className="text-[9px] mt-1 text-center text-muted-foreground">
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Card */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold">₹{order.totalAmount.toLocaleString()}</p>
              </div>
              <Badge 
                className={cn(
                  "h-8 px-3",
                  order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" :
                  order.paymentStatus === "refunded" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                )}
              >
                <PaymentIcon className="w-4 h-4 mr-2" />
                {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Unpaid"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="font-semibold">₹{order.subtotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="font-semibold">₹{order.deliveryCharges.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="font-semibold text-sm">{paymentInfo.label.split(' ')[0]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Card */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
              </div>
            </div>
            
            {/* Address */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm">
                <p>{order.deliveryAddress}</p>
                <p className="text-muted-foreground">{order.city}, {order.state} - {order.pincode}</p>
              </div>
            </div>
            
            {/* Email if available */}
            {order.customerEmail && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{order.customerEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" />
              <h3 className="font-semibold">Items ({orderItems.length})</h3>
            </div>
            
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.productBrand && `${item.productBrand} · `}{item.quantity} × ₹{item.pricePerUnit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">₹{item.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tracking */}
        {order.trackingNumber && (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <p className="font-semibold">{order.trackingNumber}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.trackingNumber!)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Est. Delivery: {format(new Date(order.estimatedDelivery), "PPP")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Update Tracking Number (if shipped) */}
        {order.status === "shipped" && !order.trackingNumber && (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <Label className="text-sm">Add Tracking Number</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="h-11"
                />
                <Button 
                  onClick={() => {
                    const actionCheck = canPerformAction('update');
                    if (!actionCheck.allowed) {
                      setShowUpgradeModal(true);
                      return;
                    }
                    if (trackingNumber) {
                      updateOrderMutation.mutate({ trackingNumber });
                      setTrackingNumber("");
                    }
                  }}
                  disabled={!trackingNumber}
                  className="h-11"
                >
                  Save
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {order.notes && (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Order Notes</p>
              <p className="text-sm">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Action Bar - Three CTAs */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-40">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2">
            {/* Call Now Button - Direct call, no redirection */}
            <Button
              variant="default"
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
              onClick={handleCall}
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
            
            {/* Order Status Dropdown */}
            <Select 
              value={order.status} 
              onValueChange={(value) => {
                const actionCheck = canPerformAction('update');
                if (!actionCheck.allowed) {
                  setShowUpgradeModal(true);
                  return;
                }
                updateOrderMutation.mutate({ status: value });
              }}
            >
              <SelectTrigger className="flex-1 h-12 text-sm font-medium">
                <SelectValue placeholder="Order Status" />
                {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Payment Status Dropdown */}
            <Select 
              value={order.paymentStatus || "pending"} 
              onValueChange={(value) => {
                const actionCheck = canPerformAction('update');
                if (!actionCheck.allowed) {
                  setShowUpgradeModal(true);
                  return;
                }
                updateOrderMutation.mutate({ paymentStatus: value });
              }}
            >
              <SelectTrigger className="flex-1 h-12 text-sm font-medium">
                <SelectValue placeholder="Payment" />
                {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action="update"
        onUpgrade={() => {
          setShowUpgradeModal(false);
          setLocation('/vendor/account');
        }}
      />
    </div>
  );
}
