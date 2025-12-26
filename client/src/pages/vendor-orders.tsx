import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, Phone, MapPin, Package, Truck, 
  IndianRupee, Clock, ArrowLeft, Search, Filter,
  Eye, ChevronRight, Globe, Store, Smartphone, 
  Calendar, X, RefreshCw, CheckCircle,
  XCircle, Timer, Box
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, subDays, startOfWeek, startOfMonth } from "date-fns";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { LoadingSpinner } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export default function VendorOrders() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Pro subscription check
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<'update'>('update');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch vendor's orders
  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: [`/api/vendors/${vendorId}/orders`],
    enabled: !!vendorId,
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/orders`] });
      toast({ title: "Order updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter(order => order.source === sourceFilter);
    }
    
    // Payment filter
    if (paymentFilter !== "all") {
      result = result.filter(order => order.paymentStatus === paymentFilter);
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        switch (dateFilter) {
          case "today": return isToday(orderDate);
          case "yesterday": return isYesterday(orderDate);
          case "week": return orderDate >= startOfWeek(now);
          case "month": return orderDate >= startOfMonth(now);
          case "last7": return orderDate >= subDays(now, 7);
          case "last30": return orderDate >= subDays(now, 30);
          default: return true;
        }
      });
    }
    
    // Sort by most recent
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, statusFilter, sourceFilter, paymentFilter, dateFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const processing = orders.filter(o => ["confirmed", "processing"].includes(o.status)).length;
    const shipped = orders.filter(o => o.status === "shipped").length;
    const delivered = orders.filter(o => o.status === "delivered").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;
    
    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.totalAmount, 0);
    const todayOrders = orders.filter(o => isToday(new Date(o.createdAt))).length;
    const todayRevenue = orders.filter(o => isToday(new Date(o.createdAt)) && o.status !== "cancelled").reduce((sum, o) => sum + o.totalAmount, 0);

    const posOrders = orders.filter(o => o.source === "pos").length;
    const websiteOrders = orders.filter(o => o.source === "miniwebsite").length;
    const manualOrders = orders.filter(o => o.source === "manual").length;
    
    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue, todayOrders, todayRevenue, posOrders, websiteOrders, manualOrders };
  }, [orders]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { color: "bg-amber-500", bgColor: "bg-amber-50 dark:bg-amber-900/20", textColor: "text-amber-700 dark:text-amber-400", icon: Timer };
      case "confirmed": return { color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20", textColor: "text-blue-700 dark:text-blue-400", icon: CheckCircle };
      case "processing": return { color: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-900/20", textColor: "text-purple-700 dark:text-purple-400", icon: Box };
      case "shipped": return { color: "bg-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-900/20", textColor: "text-cyan-700 dark:text-cyan-400", icon: Truck };
      case "delivered": return { color: "bg-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-900/20", textColor: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle };
      case "cancelled": return { color: "bg-red-500", bgColor: "bg-red-50 dark:bg-red-900/20", textColor: "text-red-700 dark:text-red-400", icon: XCircle };
      default: return { color: "bg-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-700", icon: Package };
    }
  };

  const getSourceIcon = (source: string | null) => {
    switch (source) {
      case "pos": return Store;
      case "miniwebsite": return Globe;
      case "app": return Smartphone;
      default: return Package;
    }
  };

  const getSourceLabel = (source: string | null) => {
    switch (source) {
      case "pos": return "POS";
      case "miniwebsite": return "Website";
      case "app": return "App";
      default: return "Manual";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || sourceFilter !== "all" || paymentFilter !== "all" || dateFilter !== "all";

  // Handle direct call - no redirection
  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `tel:${phone}`;
  };

  // Handle status update
  const handleStatusChange = (e: React.MouseEvent, orderId: string, newStatus: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // PRO SUBSCRIPTION CHECK
    const actionCheck = canPerformAction('update');
    if (!actionCheck.allowed) {
      setBlockedAction('update');
      setShowUpgradeModal(true);
      return;
    }
    
    updateOrderMutation.mutate({ id: orderId, updates: { status: newStatus } });
  };

  // Handle payment status update
  const handlePaymentChange = (e: React.MouseEvent, orderId: string, newPaymentStatus: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // PRO SUBSCRIPTION CHECK
    const actionCheck = canPerformAction('update');
    if (!actionCheck.allowed) {
      setBlockedAction('update');
      setShowUpgradeModal(true);
      return;
    }
    
    updateOrderMutation.mutate({ id: orderId, updates: { paymentStatus: newPaymentStatus } });
  };

  if (isLoading || !vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b shrink-0">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="md:hidden h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Orders</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Manage all your orders in one place</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-10 w-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 md:px-6 pb-4 space-y-3 max-w-[1440px] mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 w-11 rounded-xl"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-4">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 min-w-[120px] shrink-0 rounded-lg">
                  <Calendar className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 min-w-[120px] shrink-0 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-10 min-w-[120px] shrink-0 rounded-lg">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="miniwebsite">Website</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-10 min-w-[120px] shrink-0 rounded-lg">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 pb-20 md:pb-6">
        {/* Stats Cards - Horizontal scroll on mobile, full width grid on desktop */}
        <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-3 lg:grid-cols-6 scrollbar-hide">
            {/* Today's Orders */}
            <Card className="shrink-0 min-w-[140px] md:min-w-0 border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative rounded-xl">
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{stats.todayOrders}</p>
                    <p className="text-xs text-white/80">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Revenue */}
            <Card className="shrink-0 min-w-[140px] md:min-w-0 border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative rounded-xl">
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold truncate">₹{stats.todayRevenue.toLocaleString()}</p>
                    <p className="text-xs text-white/80">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Pending */}
            <Card className="shrink-0 min-w-[140px] md:min-w-0 border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Processing */}
            <Card className="shrink-0 min-w-[140px] md:min-w-0 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.processing}</p>
                    <p className="text-xs text-muted-foreground">Processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Shipped */}
            <Card className="shrink-0 min-w-[140px] md:min-w-0 border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.shipped}</p>
                    <p className="text-xs text-muted-foreground">Shipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Delivered */}
            <Card className="shrink-0 min-w-[140px] md:min-w-0 border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.delivered}</p>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Orders List */}
        <div className="px-4 md:px-6 pb-6 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
            </p>
            {/* Source Stats */}
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> POS: {stats.posOrders}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Web: {stats.websiteOrders}</span>
              <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Manual: {stats.manualOrders}</span>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No orders found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {hasActiveFilters ? "Try adjusting your filters" : "Orders from your POS and website will appear here"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 h-10 px-5">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            // Desktop: 1 card per row, Mobile: full width cards
            <div className="grid gap-4 grid-cols-1">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                const SourceIcon = getSourceIcon(order.source);
                
                return (
                  <Card 
                    key={order.id} 
                    className="border-0 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden"
                  >
                    <CardContent className="p-0">
                      {/* Card Header - Clickable for navigation */}
                      <div 
                        className="p-4 cursor-pointer active:bg-muted/30"
                        onClick={() => setLocation(`/vendor/orders/${order.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Indicator */}
                          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", statusConfig.bgColor)}>
                            <StatusIcon className={cn("w-5 h-5", statusConfig.textColor)} />
                          </div>
                          
                          {/* Order Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-sm truncate">{order.customerName}</h3>
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                    <SourceIcon className="w-3 h-3 mr-1" />
                                    {getSourceLabel(order.source)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  #{order.id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-base">₹{order.totalAmount.toLocaleString()}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {format(new Date(order.createdAt), "dd MMM, h:mm a")}
                                </p>
                              </div>
                            </div>
                            
                            {/* Quick Info */}
                            <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.customerPhone}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {order.city}
                              </span>
                            </div>
                            
                            {/* Status Badges */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              <Badge className={cn("text-[10px] h-5", statusConfig.bgColor, statusConfig.textColor)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] h-5",
                                  order.paymentStatus === "paid" ? "border-emerald-500 text-emerald-600" :
                                  order.paymentStatus === "refunded" ? "border-red-500 text-red-600" :
                                  "border-amber-500 text-amber-600"
                                )}
                              >
                                {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Unpaid"}
                              </Badge>
                              {order.trackingNumber && (
                                <Badge variant="outline" className="text-[10px] h-5">
                                  <Truck className="w-3 h-3 mr-1" />
                                  {order.trackingNumber}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center hidden md:block" />
                        </div>
                      </div>
                      
                      {/* Action Buttons - Separated from card click area */}
                      <div className="px-4 pb-4 pt-0">
                        <div className="flex items-center gap-2 pt-3 border-t">
                          {/* Call Now Button - Direct call, no redirection */}
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => handleCall(e, order.customerPhone)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Now
                          </Button>
                          
                          {/* Order Status Dropdown */}
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => {
                              const actionCheck = canPerformAction('update');
                              if (!actionCheck.allowed) {
                                setBlockedAction('update');
                                setShowUpgradeModal(true);
                                return;
                              }
                              updateOrderMutation.mutate({ id: order.id, updates: { status: value } });
                            }}
                          >
                            <SelectTrigger 
                              className="flex-1 h-10" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue placeholder="Status" />
                              {!isPro && <Lock className="w-3 h-3 ml-1 opacity-60" />}
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
                                setBlockedAction('update');
                                setShowUpgradeModal(true);
                                return;
                              }
                              updateOrderMutation.mutate({ id: order.id, updates: { paymentStatus: value } });
                            }}
                          >
                            <SelectTrigger 
                              className="flex-1 h-10" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue placeholder="Payment" />
                              {!isPro && <Lock className="w-3 h-3 ml-1 opacity-60" />}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Unpaid</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* View Details Button - Desktop only */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 hidden md:flex"
                            onClick={() => setLocation(`/vendor/orders/${order.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pro Subscription Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.location.href = '/vendor/account';
        }}
      />
    </div>
  );
}
