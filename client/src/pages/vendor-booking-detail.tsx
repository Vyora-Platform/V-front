import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Booking, Vendor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  FileText,
  Monitor,
  Smartphone,
  Building2,
  MessageCircle,
  Repeat,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

type BookingWithService = Booking & {
  serviceName?: string;
  serviceCategory?: string;
};

export default function VendorBookingDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/bookings/:id");
  const bookingId = params?.id;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<BookingWithService>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId && !!vendorId,
  });

  // Fetch vendor info for WhatsApp message
  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async (paymentStatus: string) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}`, { paymentStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      toast({ title: "Payment status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update payment status", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/bookings/${bookingId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      toast({ title: "Booking deleted successfully" });
      setLocation("/vendor/bookings");
    },
    onError: () => {
      toast({ title: "Failed to delete booking", variant: "destructive" });
    },
  });

  if (isLoading || !booking) {
    return <LoadingSpinner />;
  }

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

  const getSourceInfo = (source: string | null) => {
    const sourceVal = source || "manual";
    const config: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
      manual: { icon: <User className="h-5 w-5" />, label: "Manual Entry", color: "text-gray-700", bgColor: "bg-gray-100" },
      miniwebsite: { icon: <Monitor className="h-5 w-5" />, label: "Mini Website", color: "text-purple-700", bgColor: "bg-purple-100" },
      pos: { icon: <Smartphone className="h-5 w-5" />, label: "POS", color: "text-blue-700", bgColor: "bg-blue-100" },
      app: { icon: <Smartphone className="h-5 w-5" />, label: "App", color: "text-green-700", bgColor: "bg-green-100" },
    };
    return config[sourceVal] || config.manual;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return "Past";
    return "Upcoming";
  };

  // Generate WhatsApp reminder message
  const generateWhatsAppMessage = () => {
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

  const handleCall = () => {
    window.open(`tel:${booking.patientPhone}`, '_self');
  };

  const handleWhatsApp = () => {
    const phone = booking.patientPhone.replace(/[^0-9]/g, '');
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    if (booking.patientEmail) {
      window.open(`mailto:${booking.patientEmail}`, '_blank');
    }
  };

  const sourceInfo = getSourceInfo(booking.source);
  const bookingDate = new Date(booking.bookingDate);
  const additionalCharges = (booking as any).additionalCharges || [];

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/bookings")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Booking Details</h1>
              <p className="text-xs text-muted-foreground">View and manage booking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className={`h-2 ${booking.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : booking.status === 'confirmed' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : booking.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${booking.patientName.charCodeAt(0) % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}>
                  {booking.patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{booking.patientName}</h2>
                  <p className="text-muted-foreground">{booking.serviceName || "Service Booking"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={`${getStatusColor(booking.status)} border`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                    <Badge className={`${getPaymentStatusColor(booking.paymentStatus || "pending")} border`}>
                      Payment: {(booking.paymentStatus || "pending").charAt(0).toUpperCase() + (booking.paymentStatus || "pending").slice(1)}
                    </Badge>
                    {booking.isHomeCollection && (
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        <MapPin className="h-3 w-3 mr-1" />
                        Home Collection
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Amount */}
              <div className="text-right">
                <p className="text-3xl font-bold flex items-center justify-end sm:justify-start">
                  <IndianRupee className="h-6 w-6" />
                  {booking.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={handleCall}
          >
            <Phone className="h-5 w-5 text-blue-600" />
            <span className="text-xs">Call Customer</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col h-auto py-4 gap-2 bg-green-50 hover:bg-green-100 border-green-200"
            onClick={handleWhatsApp}
          >
            <FaWhatsapp className="h-5 w-5 text-green-600" />
            <span className="text-xs">Send Reminder</span>
          </Button>
          {booking.patientEmail && (
            <Button
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={handleEmail}
            >
              <Mail className="h-5 w-5 text-purple-600" />
              <span className="text-xs">Email</span>
            </Button>
          )}
        </div>

        {/* Date & Time Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointment Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="font-semibold">{format(bookingDate, "EEEE, MMM d, yyyy")}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {getDateLabel(bookingDate)}
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Time</p>
                <p className="font-semibold">
                  {booking.timeSlot || format(bookingDate, "h:mm a")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{booking.patientPhone}</p>
              </div>
            </div>
            {booking.patientEmail && (
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{booking.patientEmail}</p>
                </div>
              </div>
            )}
            {(booking.patientAge || booking.patientGender) && (
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Details</p>
                  <p className="font-medium">
                    {booking.patientAge && `${booking.patientAge} years`}
                    {booking.patientAge && booking.patientGender && " • "}
                    {booking.patientGender && booking.patientGender.charAt(0).toUpperCase() + booking.patientGender.slice(1)}
                  </p>
                </div>
              </div>
            )}
            {booking.isHomeCollection && booking.collectionAddress && (
              <div className="flex items-start gap-3 p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <MapPin className="h-4 w-4 text-cyan-600 mt-0.5" />
                <div>
                  <p className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">Collection Address</p>
                  <p className="text-sm">{booking.collectionAddress}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Service Price</span>
                <span className="font-medium">₹{booking.price.toLocaleString()}</span>
              </div>
              {booking.isHomeCollection && booking.homeCollectionCharges && booking.homeCollectionCharges > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Home Collection Charges</span>
                  <span className="font-medium">₹{booking.homeCollectionCharges.toLocaleString()}</span>
                </div>
              )}
              {additionalCharges.length > 0 && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground font-medium pt-1">Additional Charges</p>
                  {additionalCharges.map((charge: any, index: number) => (
                    <div key={index} className="flex justify-between py-1 pl-3">
                      <span className="text-sm text-muted-foreground">{charge.name}</span>
                      <span className="text-sm">₹{charge.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </>
              )}
              <Separator />
              <div className="flex justify-between py-2">
                <span className="font-bold">Total Amount</span>
                <span className="font-bold text-lg">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source & Meta Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className={`p-2 rounded-lg ${sourceInfo.bgColor}`}>
                {sourceInfo.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking Source</p>
                <p className={`font-medium ${sourceInfo.color}`}>{sourceInfo.label}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">{format(new Date(booking.createdAt), "PPp")}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium">{format(new Date(booking.updatedAt), "PPp")}</p>
              </div>
            </div>
            {booking.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Actions */}
        {booking.status !== "completed" && booking.status !== "cancelled" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Update Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {booking.status === "pending" && (
                  <>
                    <Button
                      onClick={() => updateStatusMutation.mutate("confirmed")}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate("cancelled")}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <Button
                    onClick={() => updateStatusMutation.mutate("completed")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Status Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Update Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={booking.paymentStatus === "pending" ? "default" : "outline"}
                onClick={() => updatePaymentStatusMutation.mutate("pending")}
                disabled={updatePaymentStatusMutation.isPending || booking.paymentStatus === "pending"}
                className="flex-1 gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Pending
              </Button>
              <Button
                variant={booking.paymentStatus === "paid" ? "default" : "outline"}
                onClick={() => updatePaymentStatusMutation.mutate("paid")}
                disabled={updatePaymentStatusMutation.isPending || booking.paymentStatus === "paid"}
                className="flex-1 gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Paid
              </Button>
              <Button
                variant={booking.paymentStatus === "refunded" ? "default" : "outline"}
                onClick={() => updatePaymentStatusMutation.mutate("refunded")}
                disabled={updatePaymentStatusMutation.isPending || booking.paymentStatus === "refunded"}
                className="flex-1 gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-red-500" />
                Refunded
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking for {booking.patientName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

