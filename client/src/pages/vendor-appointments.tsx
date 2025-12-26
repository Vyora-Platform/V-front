import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, Phone, Mail, User, Clock, IndianRupee, FileText, Plus, ArrowLeft,
  Search, Filter, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle,
  MoreVertical, Eye, Edit, Trash2, ChevronRight, CalendarDays,
  Timer, DollarSign, Sparkles, Building2, Smartphone, Monitor, MapPin, UserPlus,
  UserCheck, ChevronDown, Stethoscope
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Appointment, Customer, VendorCatalogue, Vendor, Employee } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

// Time slot options
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

const VISIT_TYPES = [
  { value: "first_visit", label: "First Visit" },
  { value: "follow_up", label: "Follow-up" },
  { value: "emergency", label: "Emergency" },
  { value: "routine", label: "Routine Check" },
];

interface AdditionalCharge {
  name: string;
  amount: number;
}

export default function VendorAppointments() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
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

  // Form state
  const [customerType, setCustomerType] = useState<"existing" | "walkin">("walkin");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    patientAge: "",
    patientGender: "",
    patientAddress: "",
    appointmentDate: undefined as Date | undefined,
    appointmentTime: "",
    visitType: "first_visit",
    purpose: "",
    notes: "",
    consultationFee: "",
    paymentStatus: "pending" as "pending" | "paid" | "refunded",
    assignedTo: "",
  });
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: [`/api/vendors/${vendorId}/appointments`],
    enabled: !!vendorId,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: [`/api/vendors/${vendorId}/customers`],
    enabled: !!vendorId && isCreateDialogOpen,
  });

  // Fetch services
  const { data: services = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId && isCreateDialogOpen,
  });

  // Fetch vendor info
  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Create employee map for quick lookup
  const employeeMap = employees.reduce((acc, emp) => {
    acc[emp.id] = emp;
    return acc;
  }, {} as Record<string, Employee>);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Appointment created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create appointment", variant: "destructive" });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Appointment status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Appointment deleted successfully" });
      setDeleteAppointmentId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete appointment", variant: "destructive" });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, { paymentStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/appointments`] });
      toast({ title: "Payment status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update payment status", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setCustomerType("walkin");
    setSelectedCustomerId("");
    setSelectedServiceId("");
    setFormData({
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      patientAge: "",
      patientGender: "",
      patientAddress: "",
      appointmentDate: undefined,
      appointmentTime: "",
      visitType: "first_visit",
      purpose: "",
      notes: "",
      consultationFee: "",
      paymentStatus: "pending",
      assignedTo: "",
    });
    setAdditionalCharges([]);
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.patientName.toLowerCase().includes(query) ||
        a.patientPhone.includes(query) ||
        (a.purpose && a.purpose.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(a => a.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter(a => a.paymentStatus === paymentFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter(a => ((a as any).source || "manual") === sourceFilter);
    }

    if (visitTypeFilter !== "all") {
      result = result.filter(a => a.visitType === visitTypeFilter);
    }

    const now = new Date();
    if (activeTab === "today") {
      result = result.filter(a => isToday(new Date(a.appointmentDate)));
    } else if (activeTab === "upcoming") {
      result = result.filter(a => new Date(a.appointmentDate) > now && !isToday(new Date(a.appointmentDate)));
    }

    return result.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }, [appointments, searchQuery, statusFilter, paymentFilter, sourceFilter, visitTypeFilter, activeTab]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthAppointments = appointments.filter(a =>
      isWithinInterval(new Date(a.createdAt), { start: thisMonthStart, end: thisMonthEnd })
    );
    const lastMonthAppointments = appointments.filter(a =>
      isWithinInterval(new Date(a.createdAt), { start: lastMonthStart, end: lastMonthEnd })
    );

    const thisMonthRevenue = thisMonthAppointments
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
    const lastMonthRevenue = lastMonthAppointments
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);

    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    const todayAppointments = appointments.filter(a => isToday(new Date(a.appointmentDate)));
    const upcomingAppointments = appointments.filter(a => new Date(a.appointmentDate) > now && !isToday(new Date(a.appointmentDate)));

    const totalRevenue = appointments
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);

    const sourceBreakdown = appointments.reduce((acc, a) => {
      const source = (a as any).source || "manual";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const visitTypeBreakdown = appointments.reduce((acc, a) => {
      acc[a.visitType] = (acc[a.visitType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: appointments.length,
      pending: appointments.filter(a => a.status === "pending").length,
      confirmed: appointments.filter(a => a.status === "confirmed").length,
      completed: appointments.filter(a => a.status === "completed").length,
      cancelled: appointments.filter(a => a.status === "cancelled").length,
      today: todayAppointments.length,
      upcoming: upcomingAppointments.length,
      totalRevenue,
      thisMonthRevenue,
      revenueChange,
      paidCount: appointments.filter(a => a.paymentStatus === "paid").length,
      pendingPayment: appointments.filter(a => a.paymentStatus === "pending").length,
      sourceBreakdown,
      visitTypeBreakdown,
    };
  }, [appointments]);

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

  const getVisitTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      first_visit: { label: "First Visit", color: "bg-blue-100 text-blue-700" },
      follow_up: { label: "Follow-up", color: "bg-purple-100 text-purple-700" },
      emergency: { label: "Emergency", color: "bg-red-100 text-red-700" },
      routine: { label: "Routine", color: "bg-green-100 text-green-700" },
    };
    const c = config[type] || { label: type, color: "bg-gray-100 text-gray-600" };
    return <Badge className={`${c.color} border-0 text-[10px]`}>{c.label}</Badge>;
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
  const generateWhatsAppMessage = (appointment: Appointment) => {
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

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (appointment: Appointment) => {
    const phone = appointment.patientPhone.replace(/[^0-9]/g, '');
    const message = generateWhatsAppMessage(appointment);
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        patientName: customer.name || "",
        patientPhone: customer.phone || "",
        patientEmail: customer.email || "",
        patientAddress: customer.address || "",
      });
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormData({
        ...formData,
        consultationFee: String(service.offerPrice || service.price || ""),
        purpose: service.name || "",
      });
    }
  };

  const handleAddCharge = () => {
    if (newChargeName && newChargeAmount && parseFloat(newChargeAmount) > 0) {
      setAdditionalCharges([
        ...additionalCharges,
        { name: newChargeName, amount: parseFloat(newChargeAmount) }
      ]);
      setNewChargeName("");
      setNewChargeAmount("");
    }
  };

  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const totalAdditionalCharges = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
  const baseFee = parseFloat(formData.consultationFee) || 0;
  const totalAmount = baseFee + totalAdditionalCharges;

  const handleSubmit = () => {
    if (!formData.patientName || !formData.patientPhone || !formData.appointmentDate || !formData.appointmentTime || !formData.purpose) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const appointmentData = {
      vendorId,
      customerId: customerType === "existing" ? selectedCustomerId : null,
      patientName: formData.patientName,
      patientPhone: formData.patientPhone,
      patientEmail: formData.patientEmail || null,
      patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
      patientGender: formData.patientGender || null,
      patientAddress: formData.patientAddress || null,
      serviceId: selectedServiceId || null,
      serviceName: services.find(s => s.id === selectedServiceId)?.name || null,
      appointmentDate: formData.appointmentDate.toISOString(),
      appointmentTime: formData.appointmentTime,
      purpose: formData.purpose,
      visitType: formData.visitType,
      notes: formData.notes || null,
      consultationFee: baseFee || null,
      additionalCharges: additionalCharges.length > 0 ? additionalCharges : [],
      totalAmount: totalAmount || null,
      status: "pending",
      paymentStatus: formData.paymentStatus,
      assignedTo: formData.assignedTo && formData.assignedTo !== "none" ? formData.assignedTo : null,
      source: "manual",
    };

    createMutation.mutate(appointmentData);
  };

  if (isLoading || !vendorId) {
    return <LoadingSpinner />;
  }

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
              <h1 className="text-xl md:text-2xl font-bold">Appointments</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Manage visits and sessions</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="sm"
            className="gap-1.5 h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Create New Appointment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Customer Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Customer Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={customerType === "existing" ? "default" : "outline"}
                  className="h-12"
                  onClick={() => setCustomerType("existing")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Existing Customer
                </Button>
                <Button
                  type="button"
                  variant={customerType === "walkin" ? "default" : "outline"}
                  className="h-12"
                  onClick={() => {
                    setCustomerType("walkin");
                    setSelectedCustomerId("");
                    setFormData({ ...formData, patientName: "", patientPhone: "", patientEmail: "", patientAddress: "" });
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Walk-in Customer
                </Button>
              </div>
            </div>

            {/* Existing Customer Selection */}
            {customerType === "existing" && (
              <div className="space-y-2">
                <Label>Select Customer <span className="text-destructive">*</span></Label>
                <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-xs text-muted-foreground">{customer.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Customer Details */}
            <Card className="p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-3">Customer Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Customer name"
                    disabled={customerType === "existing" && !!selectedCustomerId}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    disabled={customerType === "existing" && !!selectedCustomerId}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                    placeholder="email@example.com"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    placeholder="25"
                    className="h-10"
                  />
                </div>
                {customerType === "walkin" && (
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.patientAddress}
                      onChange={(e) => setFormData({ ...formData, patientAddress: e.target.value })}
                      placeholder="Full address"
                      className="h-10"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label>Select Service</Label>
              <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose a service (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="text-muted-foreground ml-2">₹{service.offerPrice || service.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal",
                        !formData.appointmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.appointmentDate ? format(formData.appointmentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.appointmentDate}
                      onSelect={(date) => setFormData({ ...formData, appointmentDate: date })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time Slot <span className="text-destructive">*</span></Label>
                <Select value={formData.appointmentTime} onValueChange={(v) => setFormData({ ...formData, appointmentTime: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visit Type & Purpose */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Type <span className="text-destructive">*</span></Label>
                <Select value={formData.visitType} onValueChange={(v) => setFormData({ ...formData, visitType: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Consultation Fee (₹)</Label>
                <Input
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  placeholder="500"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose <span className="text-destructive">*</span></Label>
              <Input
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Reason for visit"
                className="h-11"
              />
            </div>

            {/* Additional Charges */}
            <Card className="p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Additional Charges
              </h3>
              
              {additionalCharges.length > 0 && (
                <div className="space-y-2 mb-3">
                  {additionalCharges.map((charge, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                      <span className="text-sm">{charge.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">₹{charge.amount}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => handleRemoveCharge(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Charge name"
                  value={newChargeName}
                  onChange={(e) => setNewChargeName(e.target.value)}
                  className="flex-1 h-9 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newChargeAmount}
                  onChange={(e) => setNewChargeAmount(e.target.value)}
                  className="w-24 h-9 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleAddCharge}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Assign To Employee */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Assign To
              </Label>
              <Select 
                value={formData.assignedTo} 
                onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select employee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Unassigned</span>
                  </SelectItem>
                  {employees.filter(e => e.status === 'active').map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{employee.name}</span>
                          <span className="text-xs text-muted-foreground">{employee.role}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select 
                value={formData.paymentStatus} 
                onValueChange={(v: "pending" | "paid" | "refunded") => setFormData({ ...formData, paymentStatus: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Paid</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="refunded">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Refunded</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            {/* Total Summary */}
            {(baseFee > 0 || totalAdditionalCharges > 0) && (
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span>₹{baseFee}</span>
                  </div>
                  {totalAdditionalCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Charges:</span>
                      <span>₹{totalAdditionalCharges}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-green-300">
                    <span className="text-green-800">Total:</span>
                    <span className="text-green-700">₹{totalAmount}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto w-full">
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-6 scrollbar-hide">
          <Card className="p-4 rounded-xl min-w-[100px] shrink-0 md:min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total</p>
                <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-blue-200/50 dark:bg-blue-800/50 rounded-xl">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[100px] shrink-0 md:min-w-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Today</p>
                <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.today}</p>
              </div>
              <div className="p-2.5 bg-amber-200/50 dark:bg-amber-800/50 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[100px] shrink-0 md:min-w-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
                <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.pending}</p>
              </div>
              <div className="p-2.5 bg-purple-200/50 dark:bg-purple-800/50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[100px] shrink-0 md:min-w-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Completed</p>
                <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
              </div>
              <div className="p-2.5 bg-green-200/50 dark:bg-green-800/50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-400">₹{stats.thisMonthRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-xl">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl min-w-[100px] shrink-0 md:min-w-0 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 border-cyan-200 dark:border-cyan-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Upcoming</p>
                <p className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-400">{stats.upcoming}</p>
              </div>
              <div className="p-2.5 bg-cyan-200/50 dark:bg-cyan-800/50 rounded-xl">
                <Timer className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <div className="px-4 md:px-6 border-b overflow-x-auto scrollbar-hide">
            <TabsList className="h-12 w-max md:w-full justify-start bg-transparent p-0 gap-6">
              <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0">
                Today ({stats.today})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0">
                Upcoming ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm shrink-0">
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
                    placeholder="Search by name, phone..."
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
                <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
                  <SelectTrigger className="w-[120px] h-10 text-sm shrink-0 rounded-lg">
                    <SelectValue placeholder="Visit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {VISIT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Appointments List */}
          <TabsContent value="all" className="flex-1 px-4 md:px-6 py-4 mt-0">
            <AppointmentsList 
              appointments={filteredAppointments}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getVisitTypeBadge={getVisitTypeBadge}
              getSourceBadge={getSourceBadge}
              getDateLabel={getDateLabel}
              Avatar={Avatar}
              handleCall={handleCall}
              handleWhatsApp={handleWhatsApp}
              updateStatusMutation={updateStatusMutation}
              updatePaymentStatusMutation={updatePaymentStatusMutation}
              setDeleteAppointmentId={setDeleteAppointmentId}
              setLocation={setLocation}
              employeeMap={employeeMap}
            />
          </TabsContent>

          <TabsContent value="today" className="flex-1 overflow-auto p-4 mt-0">
            <AppointmentsList 
              appointments={filteredAppointments}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getVisitTypeBadge={getVisitTypeBadge}
              getSourceBadge={getSourceBadge}
              getDateLabel={getDateLabel}
              Avatar={Avatar}
              handleCall={handleCall}
              handleWhatsApp={handleWhatsApp}
              updateStatusMutation={updateStatusMutation}
              updatePaymentStatusMutation={updatePaymentStatusMutation}
              setDeleteAppointmentId={setDeleteAppointmentId}
              setLocation={setLocation}
              employeeMap={employeeMap}
            />
          </TabsContent>

          <TabsContent value="upcoming" className="flex-1 overflow-auto p-4 mt-0">
            <AppointmentsList 
              appointments={filteredAppointments}
              getStatusColor={getStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              getVisitTypeBadge={getVisitTypeBadge}
              getSourceBadge={getSourceBadge}
              getDateLabel={getDateLabel}
              Avatar={Avatar}
              handleCall={handleCall}
              handleWhatsApp={handleWhatsApp}
              updateStatusMutation={updateStatusMutation}
              updatePaymentStatusMutation={updatePaymentStatusMutation}
              setDeleteAppointmentId={setDeleteAppointmentId}
              setLocation={setLocation}
              employeeMap={employeeMap}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-auto p-4 mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Breakdown</CardTitle>
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
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Visit Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.visitTypeBreakdown).map(([type, count]) => (
                      <div key={type}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Paid</p>
                      <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Source Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.sourceBreakdown).map(([source, count]) => (
                      <div key={source}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize">{source.replace("_", " ")}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAppointmentId} onOpenChange={() => setDeleteAppointmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAppointmentId && deleteMutation.mutate(deleteAppointmentId)}
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

// Appointments List Component
interface AppointmentsListProps {
  appointments: Appointment[];
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  getVisitTypeBadge: (type: string) => React.ReactNode;
  getSourceBadge: (source: string | null) => React.ReactNode;
  getDateLabel: (date: Date) => string;
  Avatar: React.FC<{ name: string }>;
  handleCall: (phone: string) => void;
  handleWhatsApp: (appointment: Appointment) => void;
  updateStatusMutation: any;
  updatePaymentStatusMutation: any;
  setDeleteAppointmentId: (id: string) => void;
  setLocation: (path: string) => void;
  employeeMap: Record<string, Employee>;
}

function AppointmentsList({
  appointments,
  getStatusColor,
  getPaymentStatusColor,
  getVisitTypeBadge,
  getSourceBadge,
  getDateLabel,
  Avatar,
  handleCall,
  handleWhatsApp,
  updateStatusMutation,
  updatePaymentStatusMutation,
  setDeleteAppointmentId,
  setLocation,
  employeeMap,
}: AppointmentsListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
        <p className="text-muted-foreground text-center text-sm">
          No appointments match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => {
        const assignedEmployee = appointment.assignedTo ? employeeMap[appointment.assignedTo] : null;
        
        return (
          <Card 
            key={appointment.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation(`/vendor/appointments/${appointment.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={appointment.patientName} />

                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{appointment.patientName}</h3>
                        {getSourceBadge((appointment as any).source)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {appointment.purpose}
                      </p>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      {(appointment.totalAmount || appointment.consultationFee) && (
                        <p className="font-bold text-lg flex items-center justify-end">
                          <IndianRupee className="h-4 w-4" />
                          {(appointment.totalAmount || appointment.consultationFee || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details Grid - One info per line */}
                  <div className="space-y-1.5 text-sm border-t pt-3 mb-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{getDateLabel(new Date(appointment.appointmentDate))}</span>
                    </div>
                    
                    {/* Time */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{appointment.appointmentTime}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{appointment.patientPhone}</span>
                    </div>

                    {/* Visit Type */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Stethoscope className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Visit Type:</span>
                      {getVisitTypeBadge(appointment.visitType)}
                    </div>

                    {/* Doctor */}
                    {appointment.doctorName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Doctor: {appointment.doctorName}</span>
                      </div>
                    )}

                    {/* Department */}
                    {appointment.department && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Department: {appointment.department}</span>
                      </div>
                    )}

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

                    {/* Appointment Status */}
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`${getStatusColor(appointment.status)} text-[10px] px-1.5 py-0 h-5 border`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Payment:</span>
                      <Badge className={`${getPaymentStatusColor(appointment.paymentStatus || "pending")} text-[10px] px-1.5 py-0 h-5 border`}>
                        {(appointment.paymentStatus || "pending").charAt(0).toUpperCase() + (appointment.paymentStatus || "pending").slice(1)}
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
                        handleCall(appointment.patientPhone);
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
                        handleWhatsApp(appointment);
                      }}
                      className="h-9 gap-1.5 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      <FaWhatsapp className="h-4 w-4 text-green-600" />
                      <span className="hidden sm:inline">Reminder</span>
                    </Button>
                    
                    {/* Appointment Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                          <AlertCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Appointment Status</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Appointment Status</div>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "pending" })}
                          disabled={appointment.status === "pending"}
                        >
                          <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                          Pending
                          {appointment.status === "pending" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "confirmed" })}
                          disabled={appointment.status === "confirmed"}
                        >
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                          Confirmed
                          {appointment.status === "confirmed" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "completed" })}
                          disabled={appointment.status === "completed"}
                        >
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                          Completed
                          {appointment.status === "completed" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "cancelled" })}
                          disabled={appointment.status === "cancelled"}
                        >
                          <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                          Cancelled
                          {appointment.status === "cancelled" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Payment Status</div>
                        <DropdownMenuItem 
                          onClick={() => updatePaymentStatusMutation.mutate({ id: appointment.id, paymentStatus: "pending" })}
                          disabled={appointment.paymentStatus === "pending"}
                        >
                          <IndianRupee className="h-4 w-4 mr-2 text-amber-600" />
                          Payment Pending
                          {appointment.paymentStatus === "pending" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePaymentStatusMutation.mutate({ id: appointment.id, paymentStatus: "paid" })}
                          disabled={appointment.paymentStatus === "paid"}
                        >
                          <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                          Paid
                          {appointment.paymentStatus === "paid" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePaymentStatusMutation.mutate({ id: appointment.id, paymentStatus: "refunded" })}
                          disabled={appointment.paymentStatus === "refunded"}
                        >
                          <IndianRupee className="h-4 w-4 mr-2 text-red-600" />
                          Refunded
                          {appointment.paymentStatus === "refunded" && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
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
                        <DropdownMenuItem onClick={() => setLocation(`/vendor/appointments/${appointment.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteAppointmentId(appointment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
