import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Appointment, Vendor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Trash2,
  CheckCircle,
  XCircle,
  IndianRupee,
  FileText,
  Monitor,
  Smartphone,
  Building2,
  Stethoscope,
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
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorAppointmentDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/appointments/:id");
  const appointmentId = params?.id;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch appointment details
  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId && !!vendorId,
  });

  // Fetch vendor info for WhatsApp message
  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async (paymentStatus: string) => {
      const response = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, { paymentStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Payment status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update payment status", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/appointments/${appointmentId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Appointment deleted successfully" });
      setLocation("/vendor/appointments");
    },
    onError: () => {
      toast({ title: "Failed to delete appointment", variant: "destructive" });
    },
  });

  if (isLoading || !appointment) {
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

  const getVisitTypeInfo = (type: string) => {
    const config: Record<string, { label: string; color: string; bgColor: string }> = {
      first_visit: { label: "First Visit", color: "text-blue-700", bgColor: "bg-blue-100" },
      follow_up: { label: "Follow-up", color: "text-purple-700", bgColor: "bg-purple-100" },
      emergency: { label: "Emergency", color: "text-red-700", bgColor: "bg-red-100" },
      routine: { label: "Routine Check", color: "text-green-700", bgColor: "bg-green-100" },
    };
    return config[type] || { label: type, color: "text-gray-600", bgColor: "bg-gray-100" };
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
    const date = format(new Date(appointment.appointmentDate), "EEEE, MMMM d, yyyy");
    const time = appointment.appointmentTime;
    
    const message = `Hi ${appointment.patientName}! 👋

This is a friendly reminder from *${vendorName}*.

📅 *Appointment Details:*
• Purpose: ${appointment.purpose}
• Date: ${date}
• Time: ${time}
${appointment.consultationFee ? `• Fee: ₹${appointment.consultationFee}` : ''}

${appointment.status === "pending" ? "Please confirm your appointment by replying to this message." : "We look forward to seeing you!"}

Thank you for choosing us! 🙏`;

    return encodeURIComponent(message);
  };

  const handleCall = () => {
    window.open(`tel:${appointment.patientPhone}`, '_self');
  };

  const handleWhatsApp = () => {
    const phone = appointment.patientPhone.replace(/[^0-9]/g, '');
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    if (appointment.patientEmail) {
      window.open(`mailto:${appointment.patientEmail}`, '_blank');
    }
  };

  const sourceInfo = getSourceInfo((appointment as any).source);
  const visitTypeInfo = getVisitTypeInfo(appointment.visitType);
  const appointmentDate = new Date(appointment.appointmentDate);
  const additionalCharges = (appointment as any).additionalCharges || [];
  const totalAmount = (appointment as any).totalAmount || appointment.consultationFee || 0;

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/appointments")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Appointment Details</h1>
              <p className="text-xs text-muted-foreground">View and manage appointment</p>
            </div>
          </div>
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className={`h-2 ${appointment.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : appointment.status === 'confirmed' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : appointment.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${appointment.patientName.charCodeAt(0) % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}>
                  {appointment.patientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{appointment.patientName}</h2>
                  <p className="text-muted-foreground">{appointment.purpose}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={`${getStatusColor(appointment.status)} border`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                    <Badge className={`${getPaymentStatusColor(appointment.paymentStatus || "pending")} border`}>
                      Payment: {(appointment.paymentStatus || "pending").charAt(0).toUpperCase() + (appointment.paymentStatus || "pending").slice(1)}
                    </Badge>
                    <Badge className={`${visitTypeInfo.bgColor} ${visitTypeInfo.color} border-0`}>
                      {visitTypeInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Amount */}
              {totalAmount > 0 && (
                <div className="text-right">
                  <p className="text-3xl font-bold flex items-center justify-end sm:justify-start">
                    <IndianRupee className="h-6 w-6" />
                    {totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Amount</p>
                </div>
              )}
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
          {appointment.patientEmail && (
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

        {/* Schedule Card */}
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
                <p className="font-semibold">{format(appointmentDate, "EEEE, MMM d, yyyy")}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {getDateLabel(appointmentDate)}
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Time</p>
                <p className="font-semibold">{appointment.appointmentTime}</p>
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
                <p className="font-medium">{appointment.patientPhone}</p>
              </div>
            </div>
            {appointment.patientEmail && (
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{appointment.patientEmail}</p>
                </div>
              </div>
            )}
            {(appointment.patientAge || appointment.patientGender) && (
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Details</p>
                  <p className="font-medium">
                    {appointment.patientAge && `${appointment.patientAge} years`}
                    {appointment.patientAge && appointment.patientGender && " • "}
                    {appointment.patientGender && appointment.patientGender.charAt(0).toUpperCase() + appointment.patientGender.slice(1)}
                  </p>
                </div>
              </div>
            )}
            {(appointment as any).patientAddress && (
              <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{(appointment as any).patientAddress}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service & Visit Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Visit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Purpose</p>
              <p className="font-medium">{appointment.purpose}</p>
            </div>
            {(appointment as any).serviceName && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Service</p>
                <p className="font-medium">{(appointment as any).serviceName}</p>
              </div>
            )}
            {appointment.doctorName && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Doctor</p>
                <p className="font-medium">{appointment.doctorName}</p>
              </div>
            )}
            {appointment.department && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Department</p>
                <p className="font-medium">{appointment.department}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        {(appointment.consultationFee || additionalCharges.length > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Pricing Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointment.consultationFee && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-medium">₹{appointment.consultationFee.toLocaleString()}</span>
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
                  <span className="font-bold text-lg">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Source & Meta Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Appointment Information
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
                <p className="text-sm font-medium">{format(new Date(appointment.createdAt), "PPp")}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium">{format(new Date(appointment.updatedAt), "PPp")}</p>
              </div>
            </div>
            {appointment.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Notes</p>
                <p className="text-sm">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Actions */}
        {appointment.status !== "completed" && appointment.status !== "cancelled" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Update Appointment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {appointment.status === "pending" && (
                  <>
                    <Button
                      onClick={() => updateStatusMutation.mutate("confirmed")}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
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
                {appointment.status === "confirmed" && (
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
                variant={appointment.paymentStatus === "pending" ? "default" : "outline"}
                onClick={() => updatePaymentStatusMutation.mutate("pending")}
                disabled={updatePaymentStatusMutation.isPending || appointment.paymentStatus === "pending"}
                className="flex-1 gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Pending
              </Button>
              <Button
                variant={appointment.paymentStatus === "paid" ? "default" : "outline"}
                onClick={() => updatePaymentStatusMutation.mutate("paid")}
                disabled={updatePaymentStatusMutation.isPending || appointment.paymentStatus === "paid"}
                className="flex-1 gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Paid
              </Button>
              <Button
                variant={appointment.paymentStatus === "refunded" ? "default" : "outline"}
                onClick={() => updatePaymentStatusMutation.mutate("refunded")}
                disabled={updatePaymentStatusMutation.isPending || appointment.paymentStatus === "refunded"}
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
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment for {appointment.patientName}? This action cannot be undone.
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

