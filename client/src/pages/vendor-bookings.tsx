import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Mail, MapPin, User, Clock, IndianRupee, ArrowLeft, Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingFormDialog } from "@/components/BookingFormDialog";
import type { Booking } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

type BookingWithService = Booking & {
  serviceName?: string;
  serviceCategory?: string;
};

export default function VendorBookings() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch vendor's bookings
  const { data: bookings = [], isLoading } = useQuery<BookingWithService[]>({
    queryKey: [`/api/vendors/${vendorId}/bookings`],
    enabled: !!vendorId,
  });

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

  const filteredBookings = statusFilter === "all" 
    ? bookings 
    : bookings.filter(bkg => bkg.status === statusFilter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "confirmed": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "completed": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "cancelled": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "pending": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "refunded": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleBookingCreated = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Bookings</h1>
            <p className="text-xs text-muted-foreground">Manage service bookings</p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="sm"
          className="flex-shrink-0"
          data-testid="button-create-booking"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Create Booking</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <BookingFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleBookingCreated}
      />

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
            <p className="text-lg font-bold text-blue-600">{stats.confirmed}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-lg font-bold text-green-600">{stats.completed}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
            <p className="text-lg font-bold text-red-600">{stats.cancelled}</p>
          </Card>
        </div>
      </div>

      {/* Filter - Horizontal Scroll */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Bookings ({filteredBookings.length})</h2>
        {filteredBookings.length === 0 ? (
        <div className="p-12 text-center border rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            {statusFilter === "all" 
              ? "You don't have any bookings yet." 
              : `No ${statusFilter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="p-3 sm:p-6 border rounded-lg hover-elevate"
              data-testid={`booking-${booking.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left Section - Patient & Service Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {booking.patientName}
                        {booking.isHomeCollection && (
                          <Badge variant="outline" className="text-xs">
                            Home Collection
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.serviceName || "Service"} • {booking.serviceCategory || ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(booking.paymentStatus || "pending")}>
                        {booking.paymentStatus || "pending"}
                      </Badge>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{booking.patientPhone}</span>
                    </div>
                    {booking.patientEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{booking.patientEmail}</span>
                      </div>
                    )}
                    {booking.patientAge && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{booking.patientAge} yrs • {booking.patientGender}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(booking.bookingDate), "PPp")}</span>
                    </div>
                  </div>

                  {/* Collection Address */}
                  {booking.isHomeCollection && booking.collectionAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{booking.collectionAddress}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {booking.notes && (
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Notes: </span>
                      <span className="text-muted-foreground">{booking.notes}</span>
                    </div>
                  )}
                </div>

                {/* Right Section - Amount & Actions */}
                <div className="flex flex-col items-end gap-3 lg:min-w-[200px]">
                  {/* Amount */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold text-foreground">
                      <IndianRupee className="w-5 h-5" />
                      {booking.totalAmount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Service: ₹{booking.price}
                      {booking.isHomeCollection && ` + ₹${booking.homeCollectionCharges} home`}
                    </p>
                  </div>

                  {/* Status Actions */}
                  {booking.status !== "completed" && booking.status !== "cancelled" && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: booking.id, 
                              status: "confirmed" 
                            })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-confirm-${booking.id}`}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: booking.id, 
                              status: "cancelled" 
                            })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            id: booking.id, 
                            status: "completed" 
                          })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-complete-${booking.id}`}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
