import { useState } from "react";
import { ArrowLeft, Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorNotifications() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/vendors/${vendorId}/notifications`],
    enabled: !!vendorId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}`, {
        read: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/notifications`] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/vendors/${vendorId}/notifications/mark-all-read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/notifications`] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/notifications`] });
    },
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const filteredNotifications = activeTab === "unread" ? unreadNotifications : notifications;

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
      setLocation(notification.link);
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 pb-16 md:pb-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vendor/dashboard")}
          className="md:hidden flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with all your activities</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading notifications...
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Bell className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-sm">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer hover:bg-accent transition-colors ${
                    !notification.read ? "border-primary/50 bg-blue-50/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-medium ${!notification.read ? "font-semibold" : ""}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <Badge variant="default" className="h-5 text-xs">New</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          <span>{format(new Date(notification.createdAt), "PPp")}</span>
                          {notification.link && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Click to view
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

