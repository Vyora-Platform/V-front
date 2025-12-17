import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Bell, Check, Trash2, ExternalLink, Filter, Search, 
  Calendar, ShoppingCart, CreditCard, Users, Package, Settings,
  AlertCircle, CheckCircle, Clock, Star, TrendingUp, RefreshCw,
  MoreVertical, Archive, BellOff, Volume2, VolumeX, ChevronRight,
  Loader2, X, Sparkles, MessageSquare, FileText, UserPlus, Tag,
  Boxes, CalendarDays, Receipt, Wallet, ChevronDown, BellRing,
  Inbox, CircleDot, CheckCheck, Eye, MailOpen, Zap, Gift, Target,
  CircleAlert, Info, Shield, Megaphone, BarChart3
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, differenceInMinutes, differenceInHours } from "date-fns";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";

// Notification category configurations with beautiful colors
const notificationCategories = {
  order: { 
    icon: ShoppingCart, 
    label: "Orders", 
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/50",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  payment: { 
    icon: CreditCard, 
    label: "Payments", 
    color: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/50",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800"
  },
  appointment: { 
    icon: Calendar, 
    label: "Appointments", 
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50 dark:bg-purple-950/50",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  booking: { 
    icon: CalendarDays, 
    label: "Bookings", 
    color: "from-indigo-500 to-indigo-600",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/50",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-200 dark:border-indigo-800"
  },
  customer: { 
    icon: Users, 
    label: "Customers", 
    color: "from-cyan-500 to-cyan-600",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/50",
    textColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800"
  },
  lead: { 
    icon: Target, 
    label: "Leads", 
    color: "from-amber-500 to-amber-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/50",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800"
  },
  task: { 
    icon: FileText, 
    label: "Tasks", 
    color: "from-orange-500 to-orange-600",
    bgLight: "bg-orange-50 dark:bg-orange-950/50",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800"
  },
  stock: { 
    icon: Boxes, 
    label: "Stock", 
    color: "from-rose-500 to-rose-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/50",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800"
  },
  expense: { 
    icon: Receipt, 
    label: "Expenses", 
    color: "from-red-500 to-red-600",
    bgLight: "bg-red-50 dark:bg-red-950/50",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800"
  },
  approval: { 
    icon: CheckCircle, 
    label: "Approvals", 
    color: "from-green-500 to-green-600",
    bgLight: "bg-green-50 dark:bg-green-950/50",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800"
  },
  quotation: { 
    icon: FileText, 
    label: "Quotations", 
    color: "from-violet-500 to-violet-600",
    bgLight: "bg-violet-50 dark:bg-violet-950/50",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800"
  },
  system: { 
    icon: Shield, 
    label: "System", 
    color: "from-slate-500 to-slate-600",
    bgLight: "bg-slate-50 dark:bg-slate-950/50",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-200 dark:border-slate-800"
  },
  marketing: { 
    icon: Megaphone, 
    label: "Marketing", 
    color: "from-pink-500 to-pink-600",
    bgLight: "bg-pink-50 dark:bg-pink-950/50",
    textColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800"
  },
  info: { 
    icon: Info, 
    label: "Info", 
    color: "from-sky-500 to-sky-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/50",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-800"
  },
  employee: { 
    icon: Users, 
    label: "Employees", 
    color: "from-teal-500 to-teal-600",
    bgLight: "bg-teal-50 dark:bg-teal-950/50",
    textColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-200 dark:border-teal-800"
  },
  supplier: { 
    icon: Package, 
    label: "Suppliers", 
    color: "from-fuchsia-500 to-fuchsia-600",
    bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/50",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
    borderColor: "border-fuchsia-200 dark:border-fuchsia-800"
  },
  default: { 
    icon: Bell, 
    label: "General", 
    color: "from-gray-500 to-gray-600",
    bgLight: "bg-gray-50 dark:bg-gray-950/50",
    textColor: "text-gray-600 dark:text-gray-400",
    borderColor: "border-gray-200 dark:border-gray-800"
  },
};

// Get category config
const getCategoryConfig = (type: string) => {
  return notificationCategories[type as keyof typeof notificationCategories] || notificationCategories.default;
};

// Format time intelligently
const formatNotificationTime = (date: Date) => {
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  if (isThisWeek(date)) return format(date, "EEEE, h:mm a");
  return format(date, "MMM d, h:mm a");
};

// Group notifications by date
const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { [key: string]: Notification[] } = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    let groupKey: string;
    
    if (isToday(date)) {
      groupKey = "Today";
    } else if (isYesterday(date)) {
      groupKey = "Yesterday";
    } else if (isThisWeek(date)) {
      groupKey = "This Week";
    } else {
      groupKey = format(date, "MMMM d, yyyy");
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  return groups;
};

// Quick Stats Card Component
interface QuickStatsProps {
  stats: {
    total: number;
    unread: number;
    today: number;
    urgent: number;
  };
}

function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center justify-between">
          <Inbox className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
          <span className="text-lg md:text-2xl font-bold">{stats.total}</span>
        </div>
        <p className="text-[10px] md:text-xs opacity-80 mt-1">Total</p>
      </div>
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-3 text-white shadow-lg shadow-rose-500/20">
        <div className="flex items-center justify-between">
          <CircleDot className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
          <span className="text-lg md:text-2xl font-bold">{stats.unread}</span>
        </div>
        <p className="text-[10px] md:text-xs opacity-80 mt-1">Unread</p>
      </div>
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg shadow-amber-500/20">
        <div className="flex items-center justify-between">
          <Zap className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
          <span className="text-lg md:text-2xl font-bold">{stats.today}</span>
        </div>
        <p className="text-[10px] md:text-xs opacity-80 mt-1">Today</p>
      </div>
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white shadow-lg shadow-emerald-500/20">
        <div className="flex items-center justify-between">
          <CheckCheck className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
          <span className="text-lg md:text-2xl font-bold">{stats.total - stats.unread}</span>
        </div>
        <p className="text-[10px] md:text-xs opacity-80 mt-1">Read</p>
      </div>
    </div>
  );
}

// Category Filter Chips
interface CategoryChipsProps {
  categories: { type: string; count: number }[];
  selected: string;
  onSelect: (type: string) => void;
}

function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
          selected === "all"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
        )}
      >
        <Inbox className="w-3.5 h-3.5" />
        All
      </button>
      {categories.map(({ type, count }) => {
        const config = getCategoryConfig(type);
        const Icon = config.icon;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selected === type
                ? `bg-gradient-to-r ${config.color} text-white shadow-md`
                : `${config.bgLight} ${config.textColor} hover:opacity-80`
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
            {count > 0 && (
              <span className={cn(
                "ml-1 text-xs px-1.5 rounded-full",
                selected === type ? "bg-white/20" : "bg-current/10"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Enhanced Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

function NotificationItem({ notification, onRead, onDelete, onClick }: NotificationItemProps) {
  const config = getCategoryConfig(notification.type);
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex items-start gap-3 p-4 cursor-pointer transition-all duration-200",
        "hover:bg-muted/50 active:scale-[0.99]",
        !notification.read && `${config.bgLight} border-l-4 ${config.borderColor}`
      )}
      onClick={() => onClick(notification)}
    >
      {/* Icon with gradient background */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center",
        "bg-gradient-to-br shadow-sm",
        config.color
      )}>
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "text-sm md:text-base leading-tight line-clamp-1",
                !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              )}>
                {notification.title}
              </h4>
              {!notification.read && (
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>
        
        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2">
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", config.textColor, config.borderColor)}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatNotificationTime(new Date(notification.createdAt))}
          </span>
          {notification.link && (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <ExternalLink className="w-3 h-3" />
              View
            </span>
          )}
        </div>
      </div>
      
      {/* Actions - visible on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
          >
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Notification Detail Sheet
interface NotificationDetailProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string) => void;
}

function NotificationDetail({ notification, isOpen, onClose, onRead, onDelete, onNavigate }: NotificationDetailProps) {
  if (!notification) return null;
  
  const config = getCategoryConfig(notification.type);
  const Icon = config.icon;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className={cn("bg-gradient-to-r p-6 text-white", config.color)}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold leading-tight">{notification.title}</h2>
              <p className="text-white/80 text-sm mt-1">
                {format(new Date(notification.createdAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>
          
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("bg-gradient-to-r text-white", config.color)}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            <Badge variant={notification.read ? "secondary" : "default"}>
              {notification.read ? (
                <><CheckCheck className="w-3 h-3 mr-1" /> Read</>
              ) : (
                <><CircleDot className="w-3 h-3 mr-1" /> Unread</>
              )}
            </Badge>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </Badge>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            {notification.link && (
              <Button 
                className={cn("flex-1 bg-gradient-to-r text-white", config.color)}
                onClick={() => {
                  onNavigate(notification.link!);
                  onClose();
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </Button>
            )}
            {!notification.read && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onRead(notification.id);
                  onClose();
                }}
              >
                <MailOpen className="w-4 h-4 mr-2" />
                Mark Read
              </Button>
            )}
            <Button 
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(notification.id);
                onClose();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Empty State Component
function EmptyState({ type, onClear }: { type: string; onClear?: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center px-4"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
        <BellRing className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {type === "unread" ? "All caught up!" : "No notifications yet"}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        {type === "unread" 
          ? "You've read all your notifications. New ones will appear here."
          : "When you receive notifications about your business, they'll show up here."}
      </p>
      {onClear && (
        <Button variant="outline" className="mt-4" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </motion.div>
  );
}

// Main Component
export default function VendorNotifications() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications with auto-refresh
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: [`/api/vendors/${vendorId}/notifications`],
    enabled: !!vendorId,
    refetchInterval: 30000,
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}`, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/notifications`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/vendors/${vendorId}/notifications/mark-all-read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/notifications`] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/notifications`] });
      toast({ title: "Notification deleted" });
    },
  });

  // Manual refresh with haptic feedback
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(50);
    await refetch();
    setIsRefreshing(false);
    toast({ title: "Notifications refreshed" });
  };

  // Calculate stats
  const unreadNotifications = notifications.filter((n) => !n.read);
  const stats = {
    total: notifications.length,
    unread: unreadNotifications.length,
    today: notifications.filter(n => isToday(new Date(n.createdAt))).length,
    urgent: 0,
  };

  // Get category counts
  const categoryCounts = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Filter notifications
  let filteredNotifications = notifications;
  
  if (activeTab === "unread") {
    filteredNotifications = unreadNotifications;
  }
  
  if (selectedCategory !== "all") {
    filteredNotifications = filteredNotifications.filter(n => n.type === selectedCategory);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredNotifications = filteredNotifications.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.message.toLowerCase().includes(query)
    );
  }

  // Group notifications
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleNavigate = (link: string) => {
    setLocation(link);
  };

  // Show loading
  if (!vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 md:py-4">
          {/* Mobile Header */}
          <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vendor/dashboard")}
              className="flex-shrink-0 md:hidden"
        >
              <ArrowLeft className="w-5 h-5" />
        </Button>
            
        <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold">Notifications</h1>
                  <p className="text-xs text-muted-foreground hidden md:block">Stay updated with your business</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="h-9 w-9"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={stats.unread === 0 || markAllAsReadMutation.isPending}
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/vendor/account")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Notification Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-auto pb-20 md:pb-6">
        <div className="container max-w-4xl mx-auto px-4 py-4 space-y-4 md:space-y-6">
          {/* Quick Stats */}
          <QuickStats stats={stats} />
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="all" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Inbox className="w-4 h-4 mr-2" />
                All
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="unread"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <CircleDot className="w-4 h-4 mr-2" />
                Unread
                {stats.unread > 0 && (
                  <Badge className="ml-2 h-5 px-1.5 text-xs bg-rose-500">
                    {stats.unread}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/50 border-0 focus-visible:ring-2"
            />
            {searchQuery && (
          <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery("")}
          >
                <X className="w-4 h-4" />
          </Button>
        )}
      </div>

          {/* Category Chips */}
          {categories.length > 0 && (
            <CategoryChips 
              categories={categories} 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          )}
          
          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState 
              type={activeTab} 
              onClear={searchQuery || selectedCategory !== "all" ? () => {
                setSearchQuery("");
                setSelectedCategory("all");
              } : undefined}
            />
          ) : (
            <div className="bg-background rounded-2xl border shadow-sm overflow-hidden">
              <AnimatePresence>
                {Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-4 py-2 border-b">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {date}
                        <span className="text-muted-foreground/50">({items.length})</span>
                      </span>
                          </div>
                    
                    {/* Notifications */}
                    <div className="divide-y">
                      {items.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={(id) => markAsReadMutation.mutate(id)}
                          onDelete={(id) => deleteNotificationMutation.mutate(id)}
                          onClick={handleNotificationClick}
                        />
                      ))}
                    </div>
                  </div>
              ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {/* Notification Detail Modal */}
      <NotificationDetail
        notification={selectedNotification}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRead={(id) => markAsReadMutation.mutate(id)}
        onDelete={(id) => deleteNotificationMutation.mutate(id)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
