/**
 * Example: Refactored Orders Page using new utilities
 * This demonstrates the new pattern for all vendor pages
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, Phone, Mail, MapPin, Package, Truck, 
  IndianRupee, Clock, FileText, Pill, ArrowLeft 
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
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

// ✅ NEW: Use centralized utilities
import { AuthGuard, LoadingSpinner } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useVendorData } from "@/hooks/useVendorData";

export default function VendorOrdersRefactored() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // ✅ NEW: Use auth hook for vendor ID
  const { vendorId } = useAuth();

  // ✅ NEW: Use generic data loading hook
  const { data: orders = [], isLoading } = useVendorData<Order[]>({
    endpoint: 'orders',
    queryKey: 'orders',
  });

  // ✅ NEW: Load order items with generic hook
  const { data: orderItems = [] } = useVendorData<OrderItem[]>({
    endpoint: `orders/${selectedOrderId}/items`,
    queryKey: ['orderItems', selectedOrderId || ''],
    enabled: !!selectedOrderId,
  });

  // Update order status mutation
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

  // ✅ NEW: Simple loading state - no manual vendorId check needed
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track all orders
            </p>
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders ({stats.total})</SelectItem>
            <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
            <SelectItem value="confirmed">Confirmed ({stats.confirmed})</SelectItem>
            <SelectItem value="processing">Processing ({stats.processing})</SelectItem>
            <SelectItem value="shipped">Shipped ({stats.shipped})</SelectItem>
            <SelectItem value="delivered">Delivered ({stats.delivered})</SelectItem>
            <SelectItem value="cancelled">Cancelled ({stats.cancelled})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "PPp")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    ₹{order.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{order.customerPhone}</span>
                </div>
                {order.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customerEmail}</span>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="line-clamp-1">{order.deliveryAddress}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Select
                  value={order.status}
                  onValueChange={(status) => updateOrderMutation.mutate({ id: order.id, updates: { status } })}
                >
                  <SelectTrigger className="w-full">
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

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Order Items</DialogTitle>
                      <DialogDescription>
                        Items in order #{order.id.slice(0, 8)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.productName || item.serviceName}</span>
                          <span>{item.quantity} × ₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">No orders found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all" 
                ? "Orders will appear here once customers place them."
                : `No ${statusFilter} orders at the moment.`
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

