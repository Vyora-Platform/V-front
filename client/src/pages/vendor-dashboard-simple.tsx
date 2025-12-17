import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { 
  IndianRupee, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  BarChart3,
  FileText,
  Package2,
  BookOpen,
  ShoppingCart,
  CalendarCheck,
  Users,
  Briefcase,
  Receipt,
  Clock,
  CalendarDays,
  ListTodo,
  Tag,
  CalendarRange
} from "lucide-react";
import type { Vendor } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorDashboardSimple() {
  const [analyticsFilter, setAnalyticsFilter] = useState("this-month");

  // Get vendor ID from localStorage
  const { vendorId } = useAuth();

  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch real analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/analytics`, analyticsFilter],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/analytics?period=${analyticsFilter}`));
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!vendorId,
  });

  const analyticsStats = [
    {
      title: "Total Sales",
      value: analytics?.totalSales ? `₹${analytics.totalSales.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.totalSales?.changeText || "+0.0%",
      link: "/vendor/orders",
      positive: analytics?.totalSales?.positive ?? true,
    },
    {
      title: "Total Orders",
      value: analytics?.totalOrders ? analytics.totalOrders.value.toLocaleString() : "0",
      change: analytics?.totalOrders?.changeText || "+0.0%",
      link: "/vendor/orders",
      positive: analytics?.totalOrders?.positive ?? true,
    },
    {
      title: "Total Bookings",
      value: analytics?.totalBookings ? analytics.totalBookings.value.toLocaleString() : "0",
      change: analytics?.totalBookings?.changeText || "+0.0%",
      link: "/vendor/bookings",
      positive: analytics?.totalBookings?.positive ?? true,
    },
    {
      title: "Total Customers",
      value: analytics?.totalCustomers ? analytics.totalCustomers.value.toLocaleString() : "0",
      change: analytics?.totalCustomers?.changeText || "+0.0%",
      link: "/vendor/customers",
      positive: analytics?.totalCustomers?.positive ?? true,
    },
    {
      title: "Total Leads",
      value: analytics?.totalLeads ? analytics.totalLeads.value.toLocaleString() : "0",
      change: analytics?.totalLeads?.changeText || "+0.0%",
      link: "/vendor/leads",
      positive: analytics?.totalLeads?.positive ?? true,
    },
    {
      title: "Total Appointments",
      value: analytics?.totalAppointments ? analytics.totalAppointments.value.toLocaleString() : "0",
      change: analytics?.totalAppointments?.changeText || "+0.0%",
      link: "/vendor/appointments",
      positive: analytics?.totalAppointments?.positive ?? true,
    },
    {
      title: "Active Coupons",
      value: analytics?.activeCoupons ? analytics.activeCoupons.value.toString() : "0",
      change: analytics?.activeCoupons?.changeText || "All active",
      link: "/vendor/coupons",
      positive: analytics?.activeCoupons?.positive ?? true,
    },
  ];

  const quickActions = [
    {
      title: "Point of Sale",
      icon: CreditCard,
      link: "/vendor/pos",
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Add Customer",
      icon: UserPlus,
      link: "/vendor/customers",
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Add Lead",
      icon: BarChart3,
      link: "/vendor/leads",
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Create Quotation",
      icon: FileText,
      link: "/vendor/quotations",
      color: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Stock Turnover",
      icon: Package2,
      link: "/vendor/stock-turnover",
      color: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Hisab-Kitab",
      icon: BookOpen,
      link: "/vendor/ledger",
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  const manageSales = [
    {
      title: "Online Orders",
      icon: ShoppingCart,
      link: "/vendor/orders",
      badge: "5 new",
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Bookings",
      icon: Calendar,
      link: "/vendor/bookings",
      badge: "2 new",
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Appointments",
      icon: CalendarCheck,
      link: "/vendor/appointments",
      badge: "3 new",
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Coupons & Offers",
      icon: Tag,
      link: "/vendor/coupons",
      badge: "4 active",
      color: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  const businessTools = [
    {
      title: "Suppliers",
      icon: Users,
      link: "/vendor/suppliers",
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Employees",
      icon: Briefcase,
      link: "/vendor/employees",
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Expenses",
      icon: Receipt,
      link: "/vendor/expenses",
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Attendance",
      icon: Clock,
      link: "/vendor/attendance",
      color: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Leave",
      icon: CalendarDays,
      link: "/vendor/leaves",
      color: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Tasks",
      icon: ListTodo,
      link: "/vendor/tasks",
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  ];


  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Analytics Section - Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Analytics</h2>
          <Select value={analyticsFilter} onValueChange={setAnalyticsFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs md:text-sm" data-testid="select-analytics-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative -mx-4 md:mx-0">
          {analyticsLoading ? (
            <div className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-0 pb-4 snap-x snap-mandatory scrollbar-hide">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Card key={i} className="snap-start flex-shrink-0 w-[200px] md:w-[240px] animate-pulse">
                  <CardHeader className="pb-2 pt-3 px-3 md:pt-5 md:px-5">
                    <div className="h-4 bg-muted rounded w-24"></div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 md:px-5 md:pb-5">
                    <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-0 pb-4 snap-x snap-mandatory scrollbar-hide">
              {analyticsStats.map((stat) => (
                <Link key={stat.title} href={stat.link}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer snap-start flex-shrink-0 w-[200px] md:w-[240px]" data-testid={`card-analytics-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <CardHeader className="pb-2 pt-3 px-3 md:pt-5 md:px-5">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 md:px-5 md:pb-5">
                      <div className="text-xl md:text-3xl font-bold mb-1">{stat.value}</div>
                      <p className={`text-xs ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid={`card-quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="flex flex-col items-center justify-center p-4 md:p-5 space-y-2 md:space-y-3">
                    <div className={`p-3 md:p-4 rounded-lg ${action.color}`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 ${action.iconColor}`} />
                    </div>
                    <p className="text-xs md:text-sm font-medium text-center leading-tight">{action.title}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Manage Sales */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Manage Sales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {manageSales.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid={`card-manage-sales-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 space-y-2 md:space-y-3">
                    <div className={`p-3 md:p-4 rounded-lg ${item.color}`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 ${item.iconColor}`} />
                    </div>
                    <p className="text-xs md:text-sm font-medium text-center leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.badge}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Business Tools */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Business Tools</h2>
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {businessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.title} href={tool.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid={`card-business-tool-${tool.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="flex flex-col items-center justify-center p-4 md:p-5 space-y-2 md:space-y-3">
                    <div className={`p-3 md:p-4 rounded-lg ${tool.color}`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 ${tool.iconColor}`} />
                    </div>
                    <p className="text-xs md:text-sm font-medium text-center leading-tight">{tool.title}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
