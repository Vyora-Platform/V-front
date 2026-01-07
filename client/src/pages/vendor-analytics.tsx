import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { 
  ArrowLeft,
  IndianRupee, 
  ShoppingCart, 
  Calendar, 
  CalendarCheck,
  Users,
  Target,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Receipt,
  Gift,
  Eye,
  MousePointer,
  Share2,
  Download,
  Clock,
  Wallet,
  CreditCard,
  Package,
  Star,
  Percent,
  RefreshCw,
  Layers,
  Box,
  AlertTriangle,
  XCircle,
  Hourglass,
  CheckCircle,
  Banknote,
  PiggyBank,
  ArrowRightLeft,
  TrendingUp as Growth,
  Zap,
  Repeat,
  MessageSquare,
  Phone,
  ShoppingBag,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorAnalytics() {
  const [period, setPeriod] = useState("today");
  const [activeTab, setActiveTab] = useState("overview");
  const { vendorId } = useAuth();

  // Fetch real analytics data
  const { data: analytics, isLoading, refetch, isFetching } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/analytics`, period],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/analytics?period=${period}`));
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!vendorId,
    refetchOnWindowFocus: false,
  });

  // Period options
  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this-week", label: "This Week" },
    { value: "last-week", label: "Last Week" },
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "this-quarter", label: "This Quarter" },
    { value: "this-year", label: "This Year" },
  ];

  // Get comparison text based on period
  const getComparisonText = () => {
    switch (period) {
      case "today": return "vs yesterday";
      case "yesterday": return "vs day before";
      case "this-week": return "vs last week";
      case "last-week": return "vs week before";
      case "this-month": return "vs last month";
      case "last-month": return "vs month before";
      case "this-quarter": return "vs last quarter";
      case "this-year": return "vs last year";
      default: return "vs previous";
    }
  };

  // Main KPIs
  const mainKPIs = [
    {
      title: "Total Revenue",
      value: analytics?.totalSales ? `₹${analytics.totalSales.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.totalSales?.change || 0,
      positive: analytics?.totalSales?.positive ?? true,
      icon: IndianRupee,
      gradient: "from-emerald-500 to-emerald-600",
      link: "/vendor/orders",
    },
    {
      title: "Total Orders",
      value: analytics?.totalOrders ? analytics.totalOrders.value.toLocaleString() : "0",
      change: analytics?.totalOrders?.change || 0,
      positive: analytics?.totalOrders?.positive ?? true,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-blue-600",
      link: "/vendor/orders",
    },
    {
      title: "Total Bookings",
      value: analytics?.totalBookings ? analytics.totalBookings.value.toLocaleString() : "0",
      change: analytics?.totalBookings?.change || 0,
      positive: analytics?.totalBookings?.positive ?? true,
      icon: CalendarCheck,
      gradient: "from-purple-500 to-purple-600",
      link: "/vendor/bookings",
    },
    {
      title: "Appointments",
      value: analytics?.totalAppointments ? analytics.totalAppointments.value.toLocaleString() : "0",
      change: analytics?.totalAppointments?.change || 0,
      positive: analytics?.totalAppointments?.positive ?? true,
      icon: Calendar,
      gradient: "from-amber-500 to-amber-600",
      link: "/vendor/appointments",
    },
  ];

  // Revenue Stats from real data
  const revenueStats = [
    {
      title: "Gross Revenue",
      value: analytics?.totalSales ? `₹${analytics.totalSales.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.totalSales?.change || 0,
      positive: true,
      icon: Banknote,
      color: "text-emerald-600",
    },
    {
      title: "Average Order",
      value: analytics?.avgOrderValue ? `₹${analytics.avgOrderValue.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.avgOrderValue?.change || 0,
      positive: true,
      icon: Receipt,
      color: "text-blue-600",
    },
    {
      title: "Pending Payments",
      value: analytics?.pendingPayments ? `₹${analytics.pendingPayments.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.pendingPayments?.change || 0,
      positive: false,
      icon: Clock,
      color: "text-amber-600",
    },
  ];

  // Customer & Lead Stats from real data
  const customerStats = [
    {
      title: "Total Customers",
      value: analytics?.totalCustomers ? analytics.totalCustomers.value.toLocaleString() : "0",
      change: analytics?.totalCustomers?.change || 0,
      positive: analytics?.totalCustomers?.positive ?? true,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      link: "/vendor/customers",
    },
    {
      title: "Total Leads",
      value: analytics?.totalLeads ? analytics.totalLeads.value.toLocaleString() : "0",
      change: analytics?.totalLeads?.change || 0,
      positive: analytics?.totalLeads?.positive ?? true,
      icon: Target,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      link: "/vendor/leads",
    },
    {
      title: "Active Coupons",
      value: analytics?.activeCoupons ? analytics.activeCoupons.value.toString() : "0",
      change: 0,
      positive: true,
      icon: Gift,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      link: "/vendor/coupons",
    },
    {
      title: "Conversion Rate",
      value: analytics?.conversionRate ? `${analytics.conversionRate.value}%` : "0%",
      change: analytics?.conversionRate?.change || 0,
      positive: analytics?.conversionRate?.positive ?? true,
      icon: Percent,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      link: "/vendor/leads",
    },
  ];

  // Order Status Stats from real data
  const orderStatusStats = [
    {
      title: "Pending",
      value: analytics?.pendingOrders?.value?.toLocaleString() || "0",
      icon: Hourglass,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Confirmed",
      value: analytics?.confirmedOrders?.value?.toLocaleString() || "0",
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Completed",
      value: analytics?.completedOrders?.value?.toLocaleString() || "0",
      icon: Package,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Cancelled",
      value: analytics?.cancelledOrders?.value?.toLocaleString() || "0",
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
    },
  ];

  // Financial Stats from real data
  const financialStats = [
    {
      title: "Cash Collected",
      value: analytics?.cashCollected ? `₹${analytics.cashCollected.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.cashCollected?.change || 0,
      positive: true,
      icon: Banknote,
      color: "text-emerald-600",
    },
    {
      title: "Online Payments",
      value: analytics?.onlinePayments ? `₹${analytics.onlinePayments.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.onlinePayments?.change || 0,
      positive: true,
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      title: "Pending Payments",
      value: analytics?.pendingPayments ? `₹${analytics.pendingPayments.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.pendingPayments?.change || 0,
      positive: false,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      title: "Total Expenses",
      value: analytics?.totalExpenses ? `₹${analytics.totalExpenses.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.totalExpenses?.change || 0,
      positive: false,
      icon: Receipt,
      color: "text-rose-600",
    },
  ];

  // Inventory Stats from real data
  const inventoryStats = [
    {
      title: "Products Sold",
      value: analytics?.productsSold?.value?.toLocaleString() || "0",
      subtitle: "items",
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Total Products",
      value: analytics?.totalProducts?.value?.toLocaleString() || "0",
      subtitle: "in catalogue",
      icon: Box,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Low Stock",
      value: analytics?.lowStock?.value?.toString() || "0",
      subtitle: "need restock",
      icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      title: "Services Booked",
      value: analytics?.servicesBooked?.value?.toLocaleString() || "0",
      subtitle: "times",
      icon: CalendarCheck,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    },
  ];

  // Website Stats from real data
  const websiteStats = [
    {
      title: "Page Views",
      value: analytics?.pageViews?.value?.toLocaleString() || "0",
      change: analytics?.pageViews?.change || 0,
      positive: true,
      icon: Eye,
      color: "text-blue-600",
    },
    {
      title: "Unique Visitors",
      value: analytics?.uniqueVisitors?.value?.toLocaleString() || "0",
      change: analytics?.uniqueVisitors?.change || 0,
      positive: true,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Enquiries",
      value: analytics?.enquiries?.value?.toLocaleString() || "0",
      change: analytics?.enquiries?.change || 0,
      positive: true,
      icon: MessageSquare,
      color: "text-indigo-600",
    },
    {
      title: "Phone Calls",
      value: analytics?.phoneCalls?.value?.toLocaleString() || "0",
      change: analytics?.phoneCalls?.change || 0,
      positive: true,
      icon: Phone,
      color: "text-green-600",
    },
  ];

  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/vendor/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 md:hidden">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary hidden md:block" />
              Analytics
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="shrink-0 h-10 w-10"
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[130px] h-10 text-sm rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto space-y-6">
        {/* Main KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/50 rounded-xl p-4 animate-pulse min-h-[var(--card-min-h)]" />
            ))
          ) : (
            mainKPIs.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Link key={kpi.title} href={kpi.link}>
                  <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm rounded-xl min-h-[var(--card-min-h)]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">{kpi.title}</span>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                          "bg-gradient-to-br",
                          kpi.gradient
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold">{kpi.value}</div>
                      <div className="flex items-center gap-1 mt-2">
                        {kpi.positive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          kpi.positive ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {Math.abs(kpi.change)}% {getComparisonText()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex h-auto p-1 w-max">
              <TabsTrigger value="overview" className="text-sm py-2.5 px-4">Overview</TabsTrigger>
              <TabsTrigger value="sales" className="text-sm py-2.5 px-4">Sales</TabsTrigger>
              <TabsTrigger value="customers" className="text-sm py-2.5 px-4">Customers</TabsTrigger>
              <TabsTrigger value="inventory" className="text-sm py-2.5 px-4">Inventory</TabsTrigger>
              <TabsTrigger value="financial" className="text-sm py-2.5 px-4">Financial</TabsTrigger>
              <TabsTrigger value="website" className="text-sm py-2.5 px-4">Website</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Revenue Stats */}
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-500" />
                Revenue Overview
              </h3>
              <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
                {revenueStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.title} className="shadow-sm rounded-xl">
                      <CardContent className="p-4">
                        <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                        <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.title}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Order Status */}
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                Order Status
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {orderStatusStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.title}
                      className={cn("rounded-xl p-4 min-h-[var(--card-min-h)]", stat.bgColor, "border border-border/30")}
                    >
                      <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="mt-4 space-y-6">
            {/* Order Status */}
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                Order Status Breakdown
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {orderStatusStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.title}
                      className={cn("rounded-xl p-4 min-h-[var(--card-min-h)]", stat.bgColor, "border border-border/30")}
                    >
                      <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
              {revenueStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="shadow-sm rounded-xl">
                    <CardContent className="p-4">
                      <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {customerStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Link key={stat.title} href={stat.link}>
                    <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all h-full rounded-xl shadow-sm min-h-[var(--card-min-h)]">
                      <CardContent className="p-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bgColor)}>
                          <Icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.title}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {stat.positive ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span className={cn("text-xs font-medium", stat.positive ? "text-emerald-600" : "text-rose-600")}>
                            {Math.abs(stat.change)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {inventoryStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className={cn("rounded-xl p-4 min-h-[var(--card-min-h)]", stat.bgColor, "border border-border/30")}>
                    <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                    <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{stat.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {financialStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="shadow-sm rounded-xl min-h-[var(--card-min-h)]">
                    <CardContent className="p-4">
                      <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.positive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className={cn("text-xs font-medium", stat.positive ? "text-emerald-600" : "text-rose-600")}>
                          {Math.abs(stat.change)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {websiteStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="shadow-sm rounded-xl min-h-[var(--card-min-h)]">
                    <CardContent className="p-4">
                      <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.positive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className={cn("text-xs font-medium", stat.positive ? "text-emerald-600" : "text-rose-600")}>
                          {Math.abs(stat.change)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Downloads & Shares */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{analytics?.downloads?.value || 0}</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Share2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{analytics?.shares?.value || 0}</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
