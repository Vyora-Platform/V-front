import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, Phone, Mail, MapPin, User, Clock, IndianRupee, ArrowLeft, Plus,
  Search, Filter, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle,
  MoreVertical, Eye, Edit, Trash2, MessageCircle, ChevronRight, CalendarDays,
  Timer, DollarSign, Repeat, FileText, Sparkles, Building2, Smartphone, Monitor,
  UserCheck, ChevronDown, CreditCard
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isPast, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookingFormDialog } from "@/components/BookingFormDialog";
import type { Booking, Vendor, Employee } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

type BookingWithService = Booking & {
  serviceName?: string;
  serviceCategory?: string;
  assignedToName?: string;
};

// Time slot options
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

export default function VendorBookings() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming" | "analytics">("all");
  
  // Pro subscription
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<string | undefined>();

  const handleProAction = (action: string, callback: () => void) => {
    const result = canPerformAction(action as any);
    if (!result.allowed) {
      setBlockedAction(action);
      setShowUpgradeModal(true);
      return;
    }
    callback();
  };

  // Fetch vendor's bookings
  const { data: bookings = [], isLoading } = useQuery<BookingWithService[]>({
    queryKey: [`/api/vendors/${vendorId}/bookings`],
    enabled: !!vendorId,
  });

  // Fetch vendor info for WhatsApp message
  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch employees for assignment names
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Create employee map for quick lookup
  const employeeMap = employees.reduce((acc, emp) => {
    acc[emp.id] = emp;
    return acc;
  }, {} as Record<string, Employee>);

  // Update booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      toast({ title: "Booking status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // Update payment status
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { paymentStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      toast({ title: "Payment status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update payment status", variant: "destructive" });
    },
  });

  // Delete booking mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/bookings/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      toast({ title: "Booking deleted successfully" });
      setDeleteBookingId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete booking", variant: "destructive" });
    },
  });

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.patientName.toLowerCase().includes(query) ||
        b.patientPhone.includes(query) ||
        (b.serviceName && b.serviceName.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(b => b.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      result = result.filter(b => b.paymentStatus === paymentFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter(b => (b.source || "manual") === sourceFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      result = result.filter(b => isToday(new Date(b.bookingDate)));
    } else if (dateFilter === "upcoming") {
      result = result.filter(b => new Date(b.bookingDate) > now);
    } else if (dateFilter === "past") {
      result = result.filter(b => isPast(new Date(b.bookingDate)) && !isToday(new Date(b.bookingDate)));
    }

    // Tab-based filtering
    if (activeTab === "today") {
      result = result.filter(b => isToday(new Date(b.bookingDate)));
    } else if (activeTab === "upcoming") {
      result = result.filter(b => new Date(b.bookingDate) > now && !isToday(new Date(b.bookingDate)));
    }

    return result.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }, [bookings, searchQuery, statusFilter, paymentFilter, sourceFilter, dateFilter, activeTab]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthBookings = bookings.filter(b =>
      isWithinInterval(new Date(b.createdAt), { start: thisMonthStart, end: thisMonthEnd })
    );
    const lastMonthBookings = bookings.filter(b =>
      isWithinInterval(new Date(b.createdAt), { start: lastMonthStart, end: lastMonthEnd })
    );

    const thisMonthRevenue = thisMonthBookings
      .filter(b => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);
    const lastMonthRevenue = lastMonthBookings
      .filter(b => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    const todayBookings = bookings.filter(b => isToday(new Date(b.bookingDate)));
    const upcomingBookings = bookings.filter(b => new Date(b.bookingDate) > now && !isToday(new Date(b.bookingDate)));

    const totalRevenue = bookings
      .filter(b => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const sourceBreakdown = bookings.reduce((acc, b) => {
      const source = b.source || "manual";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "pending").length,
      confirmed: bookings.filter(b => b.status === "confirmed").length,
      completed: bookings.filter(b => b.status === "completed").length,
      cancelled: bookings.filter(b => b.status === "cancelled").length,
      today: todayBookings.length,
      upcoming: upcomingBookings.length,
      totalRevenue,
      thisMonthRevenue,
      revenueChange,
      paidCount: bookings.filter(b => b.paymentStatus === "paid").length,
      pendingPayment: bookings.filter(b => b.paymentStatus === "pending").length,
      sourceBreakdown,
      homeCollection: bookings.filter(b => b.isHomeCollection).length,
    };
  }, [bookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "confirmed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "refunded": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getSourceBadge = (source: string | null) => {
    const sourceVal = source || "manual";
    const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      manual: { icon: <User className="h-3 w-3" />, label: "Manual", color: "bg-gray-100 text-gray-700" },
      miniwebsite: { icon: <Monitor className="h-3 w-3" />, label: "Mini Website", color: "bg-purple-100 text-purple-700" },
      pos: { icon: <Smartphone className="h-3 w-3" />, label: "POS", color: "bg-blue-100 text-blue-700" },
      app: { icon: <Smartphone className="h-3 w-3" />, label: "App", color: "bg-green-100 text-green-700" },
    };
    const c = config[sourceVal] || config.manual;
    return (
      <Badge variant="outline" className={`${c.color} border-0 text-[10px] gap-1`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  // Generate WhatsApp reminder message
  const generateWhatsAppMessage = (booking: BookingWithService) => {
    const vendorName = vendor?.businessName || "Our Business";
    const date = format(new Date(booking.bookingDate), "EEEE, MMMM d, yyyy");
    const time = booking.timeSlot || format(new Date(booking.bookingDate), "h:mm a");
    const service = booking.serviceName || "your scheduled service";
    
    const message = `Hi ${booking.patientName}! 👋

This is a friendly reminder from *${vendorName}*.

📅 *Booking Details:*
• Service: ${service}
• Date: ${date}
• Time: ${time}
• Amount: ₹${booking.totalAmount}
${booking.isHomeCollection ? `• Type: Home Collection at ${booking.collectionAddress}` : '• Type: Visit at our location'}

${booking.status === "pending" ? "Please confirm your booking by replying to this message." : "We look forward to serving you!"}

Thank you for choosing us! 🙏`;

    return encodeURIComponent(message);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (booking: BookingWithService) => {
    const phone = booking.patientPhone.replace(/[^0-9]/g, '');
    const message = generateWhatsAppMessage(booking);
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  if (isLoading || !vendorId) {
    return <LoadingSpinner />;
  }

  const handleBookingCreated = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
  };

  // Avatar component
  const Avatar = ({ name }: { name: string }) => {
    const initial = name.charAt(0).toUpperCase();
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
      "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`h-10 w-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-20">
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="shrink-0 h-10 w-10 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Bookings</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Manage service bookings</p>
            </div>
          </div>
          <Button
            onClick={() => handleProAction('create', () => setIsCreateDialogOpen(true))}
            size="sm"
            className="gap-1.5 h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Booking</span>
            <span className="sm:hidden">New</span>
            {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
          </Button>
        </div>
      </div>

      <BookingFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleBookingCreated}
      />

      {/* Stats Cards - Responsive Grid */}
      <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto w-full">
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-6 scrollbar-hide">
          <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total</p>
                <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">bookings</p>
              </div>
              <div className="p-2.5 bg-blue-200/50 dark:bg-blue-800/50 rounded-xl">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Today</p>
                <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.today}</p>
                <p className="text-xs text-muted-foreground mt-1">scheduled</p>
              </div>
              <div className="p-2.5 bg-amber-200/50 dark:bg-amber-800/50 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
                <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.pending}</p>
                <p className="text-xs text-muted-foreground mt-1">to confirm</p>
              </div>
              <div className="p-2.5 bg-purple-200/50 dark:bg-purple-800/50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Completed</p>
                <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
                <p className="text-xs text-muted-foreground mt-1">done</p>
              </div>
              <div className="p-2.5 bg-green-200/50 dark:bg-green-800/50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[130px] shrink-0 md:min-w-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{stats.thisMonthRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.revenueChange >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(stats.revenueChange)}%
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-xl">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 border-cyan-200 dark:border-cyan-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Home Visit</p>
                <p className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-400">{stats.homeCollection}</p>
                <p className="text-xs text-muted-foreground mt-1">collections</p>
              </div>
              <div className="p-2.5 bg-cyan-200/50 dark:bg-cyan-800/50 rounded-xl">
                <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <div className="px-4 md:px-6 border-b overflow-x-auto scrollbar-hide">
            <TabsList className="h-12 w-max md:w-full justify-start bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0"
              >
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger 
                value="today" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0"
              >
                Today ({stats.today})
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0"
              >
                Upcoming ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filter Bar */}
          {activeTab !== "analytics" && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-muted/30">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl bg-background"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-10 text-sm shrink-0 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[120px] h-10 text-sm shrink-0 rounded-lg">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[130px] h-10 text-sm shrink-0 rounded-lg">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="miniwebsite">Mini Website</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Content Area */}
          <TabsContent value="all" className="flex-1 px-4 md:px-6 py-4 mt-0">
            <BookingsList 
              bookings={filteredBookings}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getSourceBadge={getSourceBadge}
              getDateLabel={getDateLabel}
              Avatar={Avatar}
              handleCall={handleCall}
              handleWhatsApp={handleWhatsApp}
              updateStatusMutation={updateStatusMutation}
              updatePaymentStatusMutation={updatePaymentStatusMutation}
              setDeleteBookingId={setDeleteBookingId}
              setLocation={setLocation}
              employeeMap={employeeMap}
            />
          </TabsContent>

          <TabsContent value="today" className="flex-1 px-4 md:px-6 py-4 mt-0">
            <BookingsList 
              bookings={filteredBookings}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getSourceBadge={getSourceBadge}
              getDateLabel={getDateLabel}
              Avatar={Avatar}
              handleCall={handleCall}
              handleWhatsApp={handleWhatsApp}
              updateStatusMutation={updateStatusMutation}
              updatePaymentStatusMutation={updatePaymentStatusMutation}
              setDeleteBookingId={setDeleteBookingId}
              setLocation={setLocation}
              employeeMap={employeeMap}
            />
          </TabsContent>

          <TabsContent value="upcoming" className="flex-1 px-4 md:px-6 py-4 mt-0">
            <BookingsList 
              bookings={filteredBookings}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getSourceBadge={getSourceBadge}
              getDateLabel={getDateLabel}
              Avatar={Avatar}
              handleCall={handleCall}
              handleWhatsApp={handleWhatsApp}
              updateStatusMutation={updateStatusMutation}
              updatePaymentStatusMutation={updatePaymentStatusMutation}
              setDeleteBookingId={setDeleteBookingId}
              setLocation={setLocation}
              employeeMap={employeeMap}
            />
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 px-4 md:px-6 py-4 mt-0 space-y-4">
            {/* Analytics Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Pending", value: stats.pending, color: "bg-amber-500" },
                      { label: "Confirmed", value: stats.confirmed, color: "bg-blue-500" },
                      { label: "Completed", value: stats.completed, color: "bg-green-500" },
                      { label: "Cancelled", value: stats.cancelled, color: "bg-red-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} transition-all`}
                            style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Source Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Source Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.sourceBreakdown).map(([source, count]) => {
                      const config: Record<string, { label: string; color: string }> = {
                        manual: { label: "Manual Entry", color: "bg-gray-500" },
                        miniwebsite: { label: "Mini Website", color: "bg-purple-500" },
                        pos: { label: "POS", color: "bg-blue-500" },
                        app: { label: "App", color: "bg-green-500" },
                      };
                      const c = config[source] || config.manual;
                      return (
                        <div key={source}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{c.label}</span>
                            <span className="text-sm text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${c.color} transition-all`}
                              style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Paid</p>
                      <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.pendingPayment}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Home Collection</p>
                      <p className="text-lg font-bold">{stats.homeCollection}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Visit Bookings</p>
                      <p className="text-lg font-bold">{stats.total - stats.homeCollection}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">This Month</p>
                      <p className="text-lg font-bold">{bookings.filter(b => 
                        isWithinInterval(new Date(b.createdAt), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
                      ).length}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
                      <p className="text-lg font-bold">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteBookingId} onOpenChange={() => setDeleteBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBookingId && deleteMutation.mutate(deleteBookingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
      />
    </div>
  );
}

// Bookings List Component
interface BookingsListProps {
  bookings: BookingWithService[];
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getSourceBadge: (source: string | null) => React.ReactNode;
  getDateLabel: (date: Date) => string;
  Avatar: React.FC<{ name: string }>;
  handleCall: (phone: string) => void;
  handleWhatsApp: (booking: BookingWithService) => void;
  updateStatusMutation: any;
  updatePaymentStatusMutation: any;
  setDeleteBookingId: (id: string) => void;
  setLocation: (path: string) => void;
  employeeMap: Record<string, Employee>;
}

function BookingsList({
  bookings,
  getStatusColor,
  getPaymentStatusColor,
  getSourceBadge,
  getDateLabel,
  Avatar,
  handleCall,
  handleWhatsApp,
  updateStatusMutation,
  updatePaymentStatusMutation,
  setDeleteBookingId,
  setLocation,
  employeeMap,
}: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
        <p className="text-muted-foreground text-center text-sm">
          No bookings match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const assignedEmployee = booking.assignedTo ? employeeMap[booking.assignedTo] : null;
        
        return (
          <Card 
            key={booking.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation(`/vendor/bookings/${booking.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar name={booking.patientName} />

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{booking.patientName}</h3>
                        {getSourceBadge(booking.source)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {booking.serviceName || "Service"} {booking.serviceCategory ? `• ${booking.serviceCategory}` : ""}
                      </p>
                    </div>
                    
                    {/* Amount & Badges */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg flex items-center justify-end">
                        <IndianRupee className="h-4 w-4" />
                        {booking.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid - One info per line */}
                  <div className="space-y-1.5 text-sm border-t pt-3 mb-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{getDateLabel(new Date(booking.bookingDate))}</span>
                    </div>
                    
                    {/* Time */}
                    {booking.timeSlot && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{booking.timeSlot}</span>
                      </div>
                    )}

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{booking.patientPhone}</span>
                    </div>

                    {/* Visit Type / Home Collection */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{booking.isHomeCollection ? "Home Collection" : "Visit at Location"}</span>
                      {booking.isHomeCollection && (
                        <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200 ml-1">
                          Home
                        </Badge>
                      )}
                    </div>

                    {/* Assigned To */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{assignedEmployee ? assignedEmployee.name : "Unassigned"}</span>
                      {assignedEmployee && (
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {assignedEmployee.role}
                        </Badge>
                      )}
                    </div>

                    {/* Booking Status */}
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`${getStatusColor(booking.status)} text-[10px] px-1.5 py-0 h-5 border`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Payment:</span>
                      <Badge className={`${getPaymentStatusColor(booking.paymentStatus || "pending")} text-[10px] px-1.5 py-0 h-5 border`}>
                        {(booking.paymentStatus || "pending").charAt(0).toUpperCase() + (booking.paymentStatus || "pending").slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(booking.patientPhone);
                      }}
                      className="h-9 gap-1.5 text-xs"
                    >
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="hidden sm:inline">Call</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(booking);
                      }}
                      className="h-9 gap-1.5 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      <FaWhatsapp className="h-4 w-4 text-green-600" />
                      <span className="hidden sm:inline">Reminder</span>
                    </Button>
                    
                    {/* Booking Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                          <AlertCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Booking Status</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Booking Status</div>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "pending" })}
                          disabled={booking.status === "pending"}
                        >
                          <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                          Pending
                          {booking.status === "pending" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "confirmed" })}
                          disabled={booking.status === "confirmed"}
                        >
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                          Confirmed
                          {booking.status === "confirmed" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "completed" })}
                          disabled={booking.status === "completed"}
                        >
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                          Completed
                          {booking.status === "completed" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "cancelled" })}
                          disabled={booking.status === "cancelled"}
                        >
                          <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                          Cancelled
                          {booking.status === "cancelled" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Payment Status</div>
                        <DropdownMenuItem 
                          onClick={() => updatePaymentStatusMutation.mutate({ id: booking.id, paymentStatus: "pending" })}
                          disabled={booking.paymentStatus === "pending"}
                        >
                          <IndianRupee className="h-4 w-4 mr-2 text-amber-600" />
                          Payment Pending
                          {booking.paymentStatus === "pending" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePaymentStatusMutation.mutate({ id: booking.id, paymentStatus: "paid" })}
                          disabled={booking.paymentStatus === "paid"}
                        >
                          <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                          Paid
                          {booking.paymentStatus === "paid" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePaymentStatusMutation.mutate({ id: booking.id, paymentStatus: "refunded" })}
                          disabled={booking.paymentStatus === "refunded"}
                        >
                          <IndianRupee className="h-4 w-4 mr-2 text-red-600" />
                          Refunded
                          {booking.paymentStatus === "refunded" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setLocation(`/vendor/bookings/${booking.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteBookingId(booking.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Booking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
