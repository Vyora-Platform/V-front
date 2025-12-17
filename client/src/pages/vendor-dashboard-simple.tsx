import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { 
  IndianRupee, 
  ShoppingCart, 
  Calendar, 
  CreditCard, 
  Users, 
  TrendingUp,
  FileText,
  Package2,
  BookOpen,
  CalendarCheck,
  Briefcase,
  CalendarDays,
  ListTodo,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Gift,
  Truck,
  Wallet,
  UserCheck,
  ClipboardList,
  ShoppingBag
} from "lucide-react";
import type { Vendor } from "@shared/schema";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorDashboardSimple() {
  const { vendorId } = useAuth();
  const [analyticsFilter, setAnalyticsFilter] = useState("today");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [, setLocation] = useLocation();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch real analytics data based on filter
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/analytics`, analyticsFilter],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/analytics?period=${analyticsFilter}`));
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch promo banners
  const { data: promoBanners = [] } = useQuery({
    queryKey: ['/api/promo-banners'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/promo-banners?status=active'));
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Auto-slide banners
  useEffect(() => {
    if (promoBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % promoBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [promoBanners.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      setCurrentBannerIndex((prev) => (prev + 1) % bannersToShow.length);
    } else if (distance < -minSwipeDistance) {
      setCurrentBannerIndex((prev) => (prev - 1 + bannersToShow.length) % bannersToShow.length);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Get comparison text based on filter
  const getComparisonText = () => {
    switch (analyticsFilter) {
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

  // Main 4 analytics stats for the dashboard
  const mainStats = [
    {
      title: "Total Sales",
      value: analytics?.totalSales ? `₹${analytics.totalSales.value.toLocaleString('en-IN')}` : "₹0",
      change: analytics?.totalSales?.change || 0,
      positive: analytics?.totalSales?.positive ?? true,
      icon: IndianRupee,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-500/10 to-emerald-600/10",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      title: "Total Orders",
      value: analytics?.totalOrders ? analytics.totalOrders.value.toLocaleString() : "0",
      change: analytics?.totalOrders?.change || 0,
      positive: analytics?.totalOrders?.positive ?? true,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/10 to-blue-600/10",
      shadowColor: "shadow-blue-500/20",
    },
    {
      title: "Bookings",
      value: analytics?.totalBookings ? analytics.totalBookings.value.toLocaleString() : "0",
      change: analytics?.totalBookings?.change || 0,
      positive: analytics?.totalBookings?.positive ?? true,
      icon: CalendarCheck,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-500/10 to-purple-600/10",
      shadowColor: "shadow-purple-500/20",
    },
    {
      title: "Appointments",
      value: analytics?.totalAppointments ? analytics.totalAppointments.value.toLocaleString() : "0",
      change: analytics?.totalAppointments?.change || 0,
      positive: analytics?.totalAppointments?.positive ?? true,
      icon: Calendar,
      gradient: "from-amber-500 to-amber-600",
      bgGradient: "from-amber-500/10 to-amber-600/10",
      shadowColor: "shadow-amber-500/20",
    },
  ];

  // Quick Actions - All blue icons
  const quickActions = [
    { title: "POS", subtitle: "Quick Billing", icon: CreditCard, link: "/vendor/pos" },
    { title: "Customers", subtitle: "Manage", icon: Users, link: "/vendor/customers" },
    { title: "Leads", subtitle: "View All", icon: Target, link: "/vendor/leads" },
    { title: "Quotation", subtitle: "Create New", icon: FileText, link: "/vendor/quotations" },
    { title: "Stock", subtitle: "Manage", icon: Package2, link: "/vendor/stock-turnover" },
    { title: "Ledger", subtitle: "Hisab-Kitab", icon: BookOpen, link: "/vendor/ledger" },
  ];

  const manageSales = [
    {
      title: "Online Orders",
      icon: ShoppingCart,
      link: "/vendor/orders",
      count: analytics?.totalOrders?.value || 0,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Bookings",
      icon: Calendar,
      link: "/vendor/bookings",
      count: analytics?.totalBookings?.value || 0,
      gradient: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Appointments",
      icon: CalendarCheck,
      link: "/vendor/appointments",
      count: analytics?.totalAppointments?.value || 0,
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Coupons",
      icon: Gift,
      link: "/vendor/coupons",
      count: analytics?.activeCoupons?.value || 0,
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  // Business Tools - All green icons
  const businessTools = [
    { title: "Suppliers", icon: Truck, link: "/vendor/suppliers" },
    { title: "Employees", icon: UserCheck, link: "/vendor/employees" },
    { title: "Expenses", icon: Wallet, link: "/vendor/expenses" },
    { title: "Attendance", icon: ClipboardList, link: "/vendor/attendance" },
    { title: "Leave", icon: CalendarDays, link: "/vendor/leaves" },
    { title: "Tasks", icon: ListTodo, link: "/vendor/tasks" },
  ];

  // Default banners if none from admin
  const defaultBanners = [
    {
      id: '1',
      title: 'Grow Your Business',
      subtitle: 'Get more customers with our powerful tools',
      imageUrl: '',
      navigationUrl: '/vendor/website',
      gradient: 'from-purple-600 via-violet-600 to-indigo-600',
    },
    {
      id: '2',
      title: 'Free Marketing Tools',
      subtitle: 'Create beautiful posters and share with customers',
      imageUrl: '',
      navigationUrl: '/vendors/' + vendorId + '/greeting',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    },
    {
      id: '3',
      title: 'Accept Online Payments',
      subtitle: 'Start accepting UPI, cards and more',
      imageUrl: '',
      navigationUrl: '/vendor/account/payment-settings',
      gradient: 'from-orange-600 via-red-600 to-pink-600',
    },
  ];

  const bannersToShow = promoBanners.length > 0 ? promoBanners : defaultBanners;

  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="max-w-7xl mx-auto pb-20 md:pb-6">
      {/* Analytics Summary */}
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-bold">Analytics</h2>
          <Link href="/vendor/analytics">
            <div className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:gap-2 transition-all cursor-pointer">
              View All
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
        
        {/* Filter Dropdown */}
        <div className="mb-3">
          <Select value={analyticsFilter} onValueChange={setAnalyticsFilter}>
            <SelectTrigger className="w-full h-10 bg-muted/50 border-border/50 rounded-xl">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="last-week">Last Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* 2x2 Grid for main stats */}
        <div className="grid grid-cols-2 gap-3">
          {analyticsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted/50 rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                  <div className="h-7 bg-muted rounded w-16 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              ))}
            </>
          ) : (
            mainStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} href="/vendor/analytics">
                  <div 
                    className={cn(
                      "relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-300",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "bg-gradient-to-br",
                      stat.bgGradient,
                      "border border-border/50"
                    )}
                  >
                    <div className={cn(
                      "absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20",
                      "bg-gradient-to-br",
                      stat.gradient
                    )} />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          "bg-gradient-to-br text-white shadow-lg",
                          stat.gradient,
                          stat.shadowColor
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold mb-1">{stat.value}</div>
                      <div className="flex items-center gap-1">
                        {stat.positive ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-rose-500" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          stat.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {Math.abs(stat.change)}% {getComparisonText()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800/50 mx-4" />

      {/* Quick Actions - Blue Icons */}
      <div className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.link}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs md:text-sm font-semibold leading-tight">{action.title}</p>
                    <p className="text-[10px] text-muted-foreground hidden md:block">{action.subtitle}</p>
                  </div>
                    </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800/50 mx-4" />

      {/* Manage Sales */}
      <div className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-3">Manage Sales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {manageSales.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.link}>
                <div className={cn(
                  "relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all",
                  "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                  item.bgColor,
                  "border border-border/30"
                )}>
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br text-white shadow-lg",
                      item.gradient
                    )}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">
                      {item.count}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold mt-3">{item.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <span>View all</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800/50 mx-4" />

      {/* Additional Services - Mobile Only - Compact Card */}
      <div className="px-4 py-2 md:hidden">
        <Link href="/vendor/additional-services">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold">Additional Services</span>
              <p className="text-[10px] text-muted-foreground">Book Professional Services Instantly</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Separator Line - Mobile Only */}
      <div className="md:hidden h-[3px] bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800/50 mx-4" />

      {/* Business Tools - Green Icons */}
      <div className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-3">Business Tools</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {businessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.title} href={tool.link}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20">
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-center leading-tight">{tool.title}</p>
                    </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800/50 mx-4" />

      {/* Promo Banner Slider - Slightly Rounded */}
      {bannersToShow.length > 0 && (
        <div className="px-4 md:px-6 py-4">
          <div 
            className="relative overflow-hidden rounded-2xl"
            ref={bannerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {bannersToShow.map((banner: any, index: number) => (
                <div
                  key={banner.id || index}
                  className="w-full flex-shrink-0 cursor-pointer relative"
                  onClick={() => {
                    if (banner.navigationUrl) {
                      if (banner.navigationUrl.startsWith('http')) {
                        window.open(banner.navigationUrl, '_blank');
                      } else {
                        setLocation(banner.navigationUrl);
                      }
                    }
                  }}
                >
                  {banner.imageUrl ? (
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title || 'Promo banner'}
                      className="w-full h-40 md:h-56 object-cover"
                    />
                  ) : (
                    <div className={cn(
                      "w-full h-40 md:h-56 bg-gradient-to-r flex items-center justify-center relative overflow-hidden",
                      banner.gradient || "from-purple-600 via-violet-600 to-indigo-600"
                    )}>
                      <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute bottom-4 left-4 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIHI9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
                      
                      <div className="relative z-10 text-center text-white px-6">
                        <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>
                        <p className="text-sm md:text-lg text-white/80">{banner.subtitle}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Dots on banner */}
                  {bannersToShow.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {bannersToShow.map((_: any, dotIndex: number) => (
                        <button
                          key={dotIndex}
                          onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex(dotIndex); }}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            dotIndex === currentBannerIndex 
                              ? "bg-white w-8 shadow-lg" 
                              : "bg-white/50 w-2"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refer & Earn - Full Screen Google Pay Style */}
      <Link href="/vendor/referral">
        <div className="bg-gradient-to-b from-blue-50 via-blue-50/50 to-background dark:from-blue-950/30 dark:via-blue-950/20 dark:to-background cursor-pointer hover:opacity-95 transition-all relative overflow-hidden min-h-[200px] md:min-h-[180px]">
          {/* Scallop decoration at top */}
          <div className="absolute top-0 left-0 right-0 flex justify-center">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-background -mt-2.5 mx-px" />
            ))}
          </div>
          
          <div className="p-5 pt-6 flex flex-col items-start">
            {/* Title */}
            <h2 className="text-xl font-bold text-foreground mb-2">
              Invite friends to get ₹200
            </h2>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Invite friends and earn rewards when they subscribe to Vyora.
            </p>
            
            {/* Invite Button */}
            <button className="rounded-full px-8 py-2.5 text-sm text-blue-600 border border-blue-200 dark:border-blue-800 font-medium bg-white dark:bg-background hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors shadow-sm">
              Invite
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
