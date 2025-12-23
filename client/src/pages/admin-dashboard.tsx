import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, Calendar, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AdminDashboard() {
  const [analyticsFilter, setAnalyticsFilter] = useState("this-month");

  // Fetch real analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/admin/analytics`, analyticsFilter],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/admin/analytics?period=${analyticsFilter}`));
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Transform category data for pie chart
  const categoryData = analytics?.categoryDistribution?.map((cat: any, index: number) => ({
    ...cat,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const marketplaceData = analytics?.marketplacePerformance || [];
  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-20 md:pb-6">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Platform overview and management</p>
          </div>
          <Select value={analyticsFilter} onValueChange={setAnalyticsFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 text-sm" data-testid="select-analytics-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Stats Grid */}
      {analyticsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 md:p-6 animate-pulse rounded-xl min-h-[var(--card-min-h)]">
              <div className="h-4 bg-muted rounded w-24 mb-4"></div>
              <div className="h-8 bg-muted rounded w-32"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Revenue"
            value={`₹${(analytics?.totalRevenue?.value || 0).toLocaleString('en-IN')}`}
            icon={DollarSign}
            trend={{ 
              value: analytics?.totalRevenue?.changeText || "+0.0%", 
              isPositive: analytics?.totalRevenue?.positive ?? true 
            }}
          />
          <StatCard
            title="Active Vendors"
            value={analytics?.activeVendors?.value?.toString() || "0"}
            icon={Building2}
            trend={{ 
              value: analytics?.activeVendors?.changeText || "0 new", 
              isPositive: true 
            }}
          />
          <StatCard
            title="Total Bookings"
            value={analytics?.totalBookings?.value?.toString() || "0"}
            icon={Calendar}
            subtitle="This period"
            trend={{ 
              value: analytics?.totalBookings?.changeText || "+0.0%", 
              isPositive: analytics?.totalBookings?.positive ?? true 
            }}
          />
          <StatCard
            title="Platform Growth"
            value={analytics?.platformGrowth?.value || "+0.0%"}
            icon={TrendingUp}
            subtitle="Period over period"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Revenue and Bookings Trend */}
        <Card className="p-4 md:p-6 rounded-xl">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Marketplace Performance</h3>
          {analyticsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : marketplaceData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">No data available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marketplaceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category Distribution */}
        <Card className="p-4 md:p-6 rounded-xl">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Service Category Distribution</h3>
          {analyticsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">No categories available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Info Message - Auto-Approval */}
      <Card className="p-4 md:p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">Auto-Approval Enabled</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              New vendor registrations are automatically approved. Vendors can start using the platform immediately after signing up.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 md:p-6 hover-elevate cursor-pointer rounded-xl min-h-[var(--card-min-h)]" data-testid="card-manage-vendors">
          <Building2 className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">Manage Vendors</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            View and manage all registered vendors
          </p>
        </Card>
        <Card className="p-4 md:p-6 hover-elevate cursor-pointer rounded-xl min-h-[var(--card-min-h)]" data-testid="card-master-catalogue">
          <Calendar className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">Master Catalogue</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage platform-wide service offerings
          </p>
        </Card>
        <Card className="p-4 md:p-6 hover-elevate cursor-pointer rounded-xl min-h-[var(--card-min-h)]" data-testid="card-analytics">
          <TrendingUp className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">View Analytics</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Detailed platform performance metrics
          </p>
        </Card>
      </div>
      </div>
    </div>
  );
}
