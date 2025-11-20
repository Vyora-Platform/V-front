import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, Phone, Mail, MapPin, Package, Truck, 
  IndianRupee, Clock, FileText, Pill, ArrowLeft 
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Order, OrderItem } from "@shared/schema";

// SECURITY NOTE: This is a temporary placeholder until auth is implemented.
// Currently all vendor pages use "vendor-1" for demonstration purposes.

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorOrders() {
  const { vendorId } = useAuth(); // Use hook for proper async loading
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch vendor's orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/vendors/${vendorId}/orders`],
    enabled: !!vendorId,
  });

  // Fetch order items for selected order
  const { data: orderItems = [] } = useQuery<OrderItem[]>({
    queryKey: [`/api/orders/${selectedOrderId}/items`],
    enabled: !!selectedOrderId,
  });

  // Update order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: "Order updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "confirmed": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "processing": return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "shipped": return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400";
      case "delivered": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "cancelled": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "pending": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "refunded": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case "cod": return "Cash on Delivery";
      case "online": return "Online Payment";
      case "wallet": return "Wallet";
      default: return "Not specified";
    }
  };

  if (isLoading || !vendorId) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Orders</h1>
            <p className="text-xs text-muted-foreground">Manage product orders</p>
          </div>
        </div>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
            <p className="text-lg font-bold text-blue-600">{stats.confirmed}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Processing</p>
            <p className="text-lg font-bold text-purple-600">{stats.processing}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Shipped</p>
            <p className="text-lg font-bold text-cyan-600">{stats.shipped}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Delivered</p>
            <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
            <p className="text-lg font-bold text-red-600">{stats.cancelled}</p>
          </Card>
        </div>
      </div>

      {/* Filter - Horizontal Scroll */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Orders ({filteredOrders.length})</h2>
        {filteredOrders.length === 0 ? (
        <div className="p-12 text-center border rounded-lg">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {statusFilter === "all" 
              ? "You don't have any orders yet." 
              : `No ${statusFilter} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="p-3 sm:p-6 border rounded-lg hover-elevate"
              data-testid={`order-${order.id}`}
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Section - Customer Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {order.customerName}
                        </h3>
                        <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span data-testid={`order-phone-${order.id}`}>{order.customerPhone}</span>
                      </div>
                      {order.customerEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span data-testid={`order-email-${order.id}`}>{order.customerEmail}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div>{order.deliveryAddress}</div>
                          <div className="text-muted-foreground">
                            {order.city}, {order.state} - {order.pincode}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Badge className={getStatusColor(order.status)} data-testid={`order-status-${order.id}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus || "pending")}>
                        Payment: {order.paymentStatus || "pending"}
                      </Badge>
                      {order.paymentMethod && (
                        <Badge variant="outline">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </Badge>
                      )}
                      {order.prescriptionRequired && (
                        <Badge variant="outline" className="bg-purple-500/10">
                          <Pill className="w-3 h-3 mr-1" />
                          Prescription Required
                        </Badge>
                      )}
                    </div>

                    {/* Tracking & Delivery Info */}
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Tracking:</span>
                        <span data-testid={`order-tracking-${order.id}`}>{order.trackingNumber}</span>
                      </div>
                    )}
                    {order.estimatedDelivery && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Est. Delivery: {format(new Date(order.estimatedDelivery), "PPP")}</span>
                      </div>
                    )}
                    {order.deliveredAt && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Package className="w-4 h-4" />
                        <span>Delivered on {format(new Date(order.deliveredAt), "PPP")}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium mb-1">Notes:</div>
                          <div className="text-muted-foreground">{order.notes}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Amount & Actions */}
                  <div className="lg:text-right space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                        <span>Subtotal:</span>
                        <IndianRupee className="w-3 h-3" />
                        <span>{order.subtotal}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                        <span>Delivery:</span>
                        <IndianRupee className="w-3 h-3" />
                        <span>{order.deliveryCharges}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-2xl font-bold">
                        <IndianRupee className="w-5 h-5" />
                        <span data-testid={`order-total-${order.id}`}>{order.totalAmount}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), "PPP")}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrderId(order.id)}
                            data-testid={`button-view-items-${order.id}`}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            View Items
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Items</DialogTitle>
                            <DialogDescription>
                              Order #{order.id} - {order.customerName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {orderItems.map((item) => (
                              <Card key={item.id} className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.productName}</h4>
                                    {item.productBrand && (
                                      <p className="text-sm text-muted-foreground">{item.productBrand}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">{item.productUnit}</p>
                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                      <span>Qty: {item.quantity}</span>
                                      <span className="text-muted-foreground">×</span>
                                      <div className="flex items-center">
                                        <IndianRupee className="w-3 h-3" />
                                        <span>{item.pricePerUnit}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 font-semibold">
                                      <IndianRupee className="w-4 h-4" />
                                      <span>{item.totalPrice}</span>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => {
                            updateOrderMutation.mutate({ 
                              id: order.id, 
                              updates: { status: newStatus } 
                            });
                          }}
                        >
                          <SelectTrigger 
                            className="w-full" 
                            data-testid={`select-update-status-${order.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancel Order</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
