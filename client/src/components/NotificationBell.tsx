import { useState } from "react";
import { Bell, Check, X, ExternalLink } from "lucide-react";
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
import { format, formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

export default function NotificationBell() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('🔔 [NotificationBell] Component is rendering!');
  
  // Get VENDOR_ID inside the component so it's evaluated after localStorage is available
  // Use a safe getter that returns null instead of throwing
  const getVendorIdSafe = (): string | null => {
    try {
      const id = getVendorId();
      console.log('🔔 [NotificationBell] Got vendor ID:', id);
      return id;
    } catch (error) {
      console.error('❌ [NotificationBell] Error getting vendor ID:', error);
      console.error('   userId in localStorage:', localStorage.getItem('userId'));
      console.error('   vendorId in localStorage:', localStorage.getItem('vendorId'));
      return null;
    }
  };
  
  const VENDOR_ID = getVendorIdSafe();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/vendors/${VENDOR_ID}/notifications`],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!VENDOR_ID, // Only fetch if VENDOR_ID exists
  });

  console.log('[NotificationBell] Rendered with VENDOR_ID:', VENDOR_ID);
  console.log('[NotificationBell] Notifications:', notifications);
  console.log('[NotificationBell] Loading:', isLoading);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}`, {
        read: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${VENDOR_ID}/notifications`] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/vendors/${VENDOR_ID}/notifications/mark-all-read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${VENDOR_ID}/notifications`] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${VENDOR_ID}/notifications`] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return "📅";
      case "payment":
        return "💰";
      case "order":
        return "🛒";
      case "task":
        return "📋";
      case "approval":
        return "✅";
      case "info":
        return "ℹ️";
      default:
        return "🔔";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to link if available
    if (notification.link) {
      setIsOpen(false);
      setLocation(notification.link);
    }
  };

  // Don't render if no vendor ID - show warning button
  if (!VENDOR_ID) {
    console.error('❌ [NotificationBell] No VENDOR_ID found!');
    console.error('   localStorage.userId:', localStorage.getItem('userId'));
    console.error('   localStorage.vendorId:', localStorage.getItem('vendorId'));
    console.error('   Showing error button...');
    
    // Always show a visible error button so user knows something is wrong
    return (
      <Button 
        variant="outline" 
        size="icon" 
        className="relative border-red-500 text-red-500 hover:bg-red-50"
        title="⚠️ No Vendor ID found. Please log in. Check browser console for details."
        onClick={() => {
          alert('❌ Notification Bell Error\n\nNo vendor ID found in localStorage.\n\nPlease log in or set:\nlocalStorage.setItem("vendorId", "YOUR_ID")');
        }}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notification-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
              data-testid="notification-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="mark-all-read"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}>
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          data-testid={`delete-notification-${notification.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {notification.link && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                setLocation("/vendor/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

