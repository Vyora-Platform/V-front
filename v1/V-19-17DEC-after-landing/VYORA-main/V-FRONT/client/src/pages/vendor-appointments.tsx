import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Mail, User, Clock, IndianRupee, FileText, Plus, ArrowLeft } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "@shared/schema";
import type { Appointment, InsertAppointment } from "@shared/schema";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
});

export default function VendorAppointments() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      vendorId: vendorId || undefined,
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      patientAge: undefined,
      patientGender: "",
      appointmentDate: "",
      appointmentTime: "",
      purpose: "",
      doctorName: "",
      department: "",
      status: "pending",
      visitType: "first_visit",
      notes: "",
      paymentStatus: "pending",
      consultationFee: undefined,
    },
  });

  // Fetch vendor's appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: [`/api/vendors/${vendorId}/appointments`],
    enabled: !!vendorId,
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appointmentFormSchema>) => {
      const response = await apiRequest("POST", "/api/appointments", {
        ...data,
        appointmentDate: new Date(data.appointmentDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: "Appointment created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create appointment", variant: "destructive" });
    },
  });

  // Update appointment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: "Appointment status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const filteredAppointments = statusFilter === "all" 
    ? appointments 
    : appointments.filter(apt => apt.status === statusFilter);

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
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

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case "first_visit": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "follow_up": return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "emergency": return "bg-red-500/10 text-red-700 dark:text-red-400";
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
            <h1 className="text-xl font-bold text-foreground">Appointments</h1>
            <p className="text-xs text-muted-foreground">Manage visits and sessions</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-appointment">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
          </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createAppointmentMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="customer@example.com" {...field} value={field.value || ""} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-age" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="appointmentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-visit-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="first_visit">First Visit</SelectItem>
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consultationFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Fee (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-fee" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose/Reason *</FormLabel>
                      <FormControl>
                        <Input placeholder="Reason for visit" {...field} data-testid="input-purpose" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAppointmentMutation.isPending} data-testid="button-submit-appointment">
                    {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
                  </Button>
                </div>
              </form>
            </Form>
        </DialogContent>
      </Dialog>

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
              <SelectItem value="all">All Appointments</SelectItem>
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
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Appointments ({filteredAppointments.length})</h2>
        {filteredAppointments.length === 0 ? (
        <div className="p-8 md:p-12 text-center border rounded-lg">
          <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-base md:text-lg font-semibold mb-2">No appointments found</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            {statusFilter === "all" 
              ? "You don't have any appointments yet. Click 'Create Appointment' to get started." 
              : `No ${statusFilter} appointments.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="p-3 md:p-4 border rounded-lg hover-elevate"
              data-testid={`appointment-${appointment.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                {/* Left Section - Customer & Appointment Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-foreground flex flex-wrap items-center gap-2">
                        {appointment.patientName}
                        {appointment.visitType && (
                          <Badge variant="outline" className={getVisitTypeColor(appointment.visitType)}>
                            {appointment.visitType.replace('_', ' ')}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">ID: {appointment.id}</p>
                    </div>
                    <div className="flex lg:hidden gap-2">
                      <Badge className={getStatusColor(appointment.status)} data-testid={`status-${appointment.id}`}>
                        {appointment.status.toUpperCase()}
                      </Badge>
                      <Badge className={getPaymentStatusColor(appointment.paymentStatus || "pending")} data-testid={`payment-${appointment.id}`}>
                        {(appointment.paymentStatus || "pending").toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs md:text-sm">
                    {appointment.patientAge && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>Age: {appointment.patientAge}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{appointment.patientPhone}</span>
                    </div>
                    {appointment.patientEmail && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{appointment.patientEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(appointment.appointmentDate), 'PP')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                    {appointment.purpose && (
                      <div className="flex items-center gap-1.5 text-muted-foreground sm:col-span-2 lg:col-span-1">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{appointment.purpose}</span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="p-2 bg-muted/50 rounded-md">
                      <p className="text-xs font-medium mb-0.5">Notes:</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Section - Status & Actions */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 lg:gap-3 lg:min-w-[180px]">
                  <div className="hidden lg:flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(appointment.status)} data-testid={`status-${appointment.id}`}>
                      {appointment.status.toUpperCase()}
                    </Badge>
                    <Badge className={getPaymentStatusColor(appointment.paymentStatus || "pending")} data-testid={`payment-${appointment.id}`}>
                      {(appointment.paymentStatus || "pending").toUpperCase()}
                    </Badge>
                  </div>

                  {appointment.consultationFee && (
                    <div className="text-left lg:text-right">
                      <div className="flex items-center gap-1 text-base md:text-lg font-bold text-foreground">
                        <IndianRupee className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>{appointment.consultationFee.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Service Fee</p>
                    </div>
                  )}

                  {/* Status Update Actions */}
                  {appointment.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "confirmed" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`btn-confirm-${appointment.id}`}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "cancelled" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`btn-cancel-${appointment.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {appointment.status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "completed" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`btn-complete-${appointment.id}`}
                    >
                      Complete
                    </Button>
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
