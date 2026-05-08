import { useState, useEffect } from "react";
import { 
  Bell, Check, X, ExternalLink, Loader2, ChevronRight, RefreshCw, 
  ShoppingCart, CreditCard, Calendar, Users, FileText, Boxes, Receipt,
  CheckCircle, Shield, Megaphone, Info, Target, CalendarDays, Package,
  Inbox, CircleDot, MailOpen, Clock
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getVendorId } from "@/hooks/useVendor";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes, differenceInHours } from "date-fns";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import { cn } from "@/lib/utils";

// Notification category configurations
const notificationCategories: Record<string, { icon: any; color: string; bgLight: string }> = {
  order: { icon: ShoppingCart, color: "from-blue-500 to-blue-600", bgLight: "bg-blue-100 dark:bg-blue-900" },
  payment: { icon: CreditCard, color: "from-emerald-500 to-emerald-600", bgLight: "bg-emerald-100 dark:bg-emerald-900" },
  appointment: { icon: Calendar, color: "from-purple-500 to-purple-600", bgLight: "bg-purple-100 dark:bg-purple-900" },
  booking: { icon: CalendarDays, color: "from-indigo-500 to-indigo-600", bgLight: "bg-indigo-100 dark:bg-indigo-900" },
  customer: { icon: Users, color: "from-cyan-500 to-cyan-600", bgLight: "bg-cyan-100 dark:bg-cyan-900" },
  lead: { icon: Target, color: "from-amber-500 to-amber-600", bgLight: "bg-amber-100 dark:bg-amber-900" },
  task: { icon: FileText, color: "from-orange-500 to-orange-600", bgLight: "bg-orange-100 dark:bg-orange-900" },
  stock: { icon: Boxes, color: "from-rose-500 to-rose-600", bgLight: "bg-rose-100 dark:bg-rose-900" },
  expense: { icon: Receipt, color: "from-red-500 to-red-600", bgLight: "bg-red-100 dark:bg-red-900" },
  approval: { icon: CheckCircle, color: "from-green-500 to-green-600", bgLight: "bg-green-100 dark:bg-green-900" },
  quotation: { icon: FileText, color: "from-violet-500 to-violet-600", bgLight: "bg-violet-100 dark:bg-violet-900" },
  system: { icon: Shield, color: "from-slate-500 to-slate-600", bgLight: "bg-slate-100 dark:bg-slate-900" },
  marketing: { icon: Megaphone, color: "from-pink-500 to-pink-600", bgLight: "bg-pink-100 dark:bg-pink-900" },
  info: { icon: Info, color: "from-sky-500 to-sky-600", bgLight: "bg-sky-100 dark:bg-sky-900" },
  employee: { icon: Users, color: "from-teal-500 to-teal-600", bgLight: "bg-teal-100 dark:bg-teal-900" },
  supplier: { icon: Package, color: "from-fuchsia-500 to-fuchsia-600", bgLight: "bg-fuchsia-100 dark:bg-fuchsia-900" },
  default: { icon: Bell, color: "from-gray-500 to-gray-600", bgLight: "bg-gray-100 dark:bg-gray-900" },
};

const getCategoryConfig = (type: string) => {
  return notificationCategories[type] || notificationCategories.default;
};

// Format time intelligently
const formatNotificationTime = (date: Date) => {
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

interface NotificationBellProps {
  variant?: "default" | "mobile";
  className?: string;
}

export default function NotificationBell({ variant = "default", className }: NotificationBellProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  const getVendorIdSafe = (): string | null => {
    try {
      return getVendorId();
    } catch (error) {
      return null;
    }
  };
  
  const VENDOR_ID = getVendorIdSafe();

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: [`/api/vendors/${VENDOR_ID}/notifications`],
    refetchInterval: 30000,
    enabled: !!VENDOR_ID,
  });

  // Track new notifications for animation
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount > 0) {
      setHasNewNotifications(true);
      const timer = setTimeout(() => setHasNewNotifications(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}`, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${VENDOR_ID}/notifications`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/vendors/${VENDOR_ID}/notifications/mark-all-read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${VENDOR_ID}/notifications`] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${VENDOR_ID}/notifications`] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
      setLocation(notification.link);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setLocation("/vendor/notifications");
  };

  if (!VENDOR_ID) {
    return null;
  }

  // Check if parent is using white text color
  const isWhiteText = className?.includes('text-white');
  
  // Mobile variant - 2x larger icon (equal to logo size w-8 h-8)
  if (variant === "mobile") {
    return (
      <Button 
        variant="ghost"
        size="icon" 
        className={cn("relative hover:bg-white/20 w-10 h-10", className)}
        onClick={() => setLocation("/vendor/notifications")}
      >
        <Bell className={cn(
          "h-7 w-7 transition-all duration-200",
          hasNewNotifications && unreadCount > 0 && "animate-wiggle",
          isWhiteText && "text-white"
        )} />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] text-[10px] font-bold text-white rounded-full",
            "bg-gradient-to-r from-rose-500 to-rose-600 border-2",
            isWhiteText ? "border-blue-600" : "border-background",
            "shadow-lg",
            hasNewNotifications && "animate-pulse"
          )}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    );
  }

  // Desktop variant - popover with notifications
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative hover:bg-white/20 w-10 h-10", className)}
        >
          <Bell className={cn(
            "h-6 w-6 transition-all duration-200",
            hasNewNotifications && unreadCount > 0 && "animate-wiggle",
            isWhiteText && "text-white"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 flex items-center justify-center",
              "min-w-[18px] h-[18px] text-[10px] font-bold text-white rounded-full",
              "bg-gradient-to-r from-rose-500 to-rose-600 border-2",
              isWhiteText ? "border-blue-600" : "border-background",
              "shadow-lg",
              hasNewNotifications && "animate-pulse"
            )}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] md:w-[420px] p-0 overflow-hidden shadow-2xl border-0" 
        align="end"
        sideOffset={8}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Notifications</h3>
                <p className="text-xs opacity-80">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                  className="h-8 text-xs text-primary-foreground hover:bg-white/20"
              >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Read all
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px] bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1 opacity-60">We'll notify you when something arrives</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 8).map((notification) => {
                const config = getCategoryConfig(notification.type);
                const Icon = config.icon;
                
                return (
                <div
                  key={notification.id}
                    className={cn(
                      "group p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200",
                      !notification.read && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                        "bg-gradient-to-br text-white shadow-sm",
                        config.color
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "text-sm leading-tight line-clamp-1",
                              !notification.read ? "font-semibold" : "font-medium"
                            )}>
                          {notification.title}
                        </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                        <Button
                          variant="ghost"
                          size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatNotificationTime(new Date(notification.createdAt))}
                        </span>
                        {notification.link && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              View
                            </span>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              className="w-full justify-between hover:bg-muted"
              onClick={handleViewAll}
            >
              <span className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
              View all notifications
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Export a simple notification indicator for mobile bottom nav
export function NotificationIndicator() {
  const getVendorIdSafe = (): string | null => {
    try {
      return getVendorId();
    } catch (error) {
      return null;
    }
  };
  
  const VENDOR_ID = getVendorIdSafe();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/vendors/${VENDOR_ID}/notifications`],
    refetchInterval: 30000,
    enabled: !!VENDOR_ID,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!VENDOR_ID || unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 text-[10px] font-bold text-white rounded-full bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
