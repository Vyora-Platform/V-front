import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Phone, Mail, MapPin, Package, Truck, 
  IndianRupee, Clock, User, FileText, Copy, 
  CheckCircle, XCircle, Timer, Box, Globe, Store,
  Smartphone, Calendar, Printer, Share2, Edit,
  MessageSquare, CreditCard, Banknote, Wallet
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Order, OrderItem } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";

export default function VendorOrderDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/orders/:id");
  const orderId = params?.id;
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

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
      setShowUpdateModal(false);
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

  const orderTimeline = [
    { status: "pending", label: "Order Placed", time: order?.createdAt },
    { status: "confirmed", label: "Order Confirmed", time: order?.status !== "pending" ? order?.updatedAt : null },
    { status: "processing", label: "Processing", time: ["processing", "shipped", "delivered"].includes(order?.status || "") ? order?.updatedAt : null },
    { status: "shipped", label: "Shipped", time: ["shipped", "delivered"].includes(order?.status || "") ? order?.updatedAt : null },
    { status: "delivered", label: "Delivered", time: order?.deliveredAt },
  ];

  if (orderLoading || itemsLoading || !orderId) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/vendor/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(order.id)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "PPP 'at' h:mm a")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="hidden sm:flex">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="hidden sm:flex">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Status Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={cn("h-1", statusConfig.color)} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bgColor)}>
                    <StatusIcon className={cn("w-6 h-6", statusConfig.textColor)} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{statusConfig.label}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <SourceIcon className={cn("w-4 h-4", sourceInfo.color)} />
                      <span>{sourceInfo.label}</span>
                    </div>
                  </div>
                </div>
                
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Order</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Order Status</Label>
                          <Select
                            value={order.status}
                            onValueChange={(status) => updateOrderMutation.mutate({ status })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
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
                        </div>
                        
                        <div>
                          <Label>Tracking Number</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder="Enter tracking number"
                              value={trackingNumber || order.trackingNumber || ""}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                            <Button 
                              onClick={() => updateOrderMutation.mutate({ trackingNumber })}
                              disabled={!trackingNumber}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Payment Status</Label>
                          <Select
                            value={order.paymentStatus || "pending"}
                            onValueChange={(paymentStatus) => updateOrderMutation.mutate({ paymentStatus })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Timeline */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between overflow-x-auto pb-2">
                  {orderTimeline.map((step, idx) => {
                    const isCompleted = orderTimeline.findIndex(s => s.status === order.status) >= idx;
                    const isCurrent = step.status === order.status;
                    
                    return (
                      <div key={step.status} className="flex flex-col items-center flex-1 min-w-[60px]">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <p className={cn(
                          "text-[10px] mt-1 text-center",
                          isCurrent ? "font-bold text-foreground" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Amount */}
          <Card className="border-0 shadow-sm">
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
                  {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Payment Pending"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="font-semibold">₹{order.subtotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery</p>
                  <p className="font-semibold">₹{order.deliveryCharges.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-semibold text-sm">{paymentInfo.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  {order.customerId && (
                    <p className="text-xs text-muted-foreground">Customer ID: {order.customerId.slice(-8)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${order.customerPhone}`}>
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </a>
                  </Button>
                  {order.customerEmail && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${order.customerEmail}`}>
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{order.deliveryAddress}</p>
                  <p className="text-sm text-muted-foreground">{order.city}, {order.state} - {order.pincode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="font-semibold">{order.trackingNumber}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(order.trackingNumber!)}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                {order.estimatedDelivery && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Estimated Delivery: {format(new Date(order.estimatedDelivery), "PPP")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items ({orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.productBrand && `${item.productBrand} · `}{item.productUnit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.pricePerUnit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{item.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Action Bar (Mobile) */}
      <div className="sticky bottom-0 p-4 bg-background border-t md:hidden">
        {order.status !== "delivered" && order.status !== "cancelled" ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowUpdateModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Order
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              asChild
            >
              <a href={`tel:${order.customerPhone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call Customer
              </a>
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/vendor/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}



