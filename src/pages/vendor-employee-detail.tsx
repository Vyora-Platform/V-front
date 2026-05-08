import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Clock,
  FileText,
  Edit2,
  Briefcase,
  Wallet,
  CalendarDays,
  Target,
  UserCheck,
  UserX,
  Building2,
  Award,
  Timer,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Receipt,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Employee, Payroll } from "@shared/schema";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPayrollSchema } from "@shared/schema";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const payrollFormSchema = insertPayrollSchema.extend({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export default function VendorEmployeeDetail() {
  const { vendorId } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("attendance");
  const [showSalaryDialog, setShowSalaryDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch employee
  const { data: employee, isLoading, error } = useQuery<Employee>({
    queryKey: ['/api/employees', id],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/employees/${id}`), {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Employee not found');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch attendance for this employee
  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'attendance', id],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/attendance?employeeId=${id}`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!vendorId && !!id,
  });

  // Fetch payroll history
  const { data: payrollHistory = [], isLoading: payrollLoading } = useQuery<Payroll[]>({
    queryKey: ['/api/employees', id, 'payroll'],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/employees/${id}/payroll`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Fetch assigned leads
  const { data: allLeads = [] } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'leads'],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/leads`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!vendorId,
  });

  // Pay salary mutation
  const paySalaryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(getApiUrl(`/api/employees/${id}/payroll`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees', id, 'payroll'] });
      setShowSalaryDialog(false);
      payrollForm.reset();
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(getApiUrl(`/api/employees/${id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees', id] });
    },
  });

  const payrollForm = useForm<z.infer<typeof payrollFormSchema>>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      vendorId: vendorId,
      employeeId: id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 0,
      overtimeHours: 0,
      overtimePay: 0,
      bonuses: 0,
      deductions: 0,
      netSalary: 0,
      paymentStatus: "paid",
      paymentMethod: "bank_transfer",
      notes: "",
    },
  });

  // Filter leads assigned to this employee
  const assignedLeads = allLeads.filter((lead: any) => lead.assignedEmployeeId === id);

  if (!vendorId) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Employee Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">The employee you're looking for doesn't exist.</p>
        <Button onClick={() => setLocation("/vendor/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
    );
  }

  const joiningDate = employee.joiningDate ? new Date(employee.joiningDate) : new Date(employee.createdAt);
  const tenure = formatDistanceToNow(joiningDate, { addSuffix: false });

  // Build address
  const addressParts = [];
  if (employee.address) addressParts.push(employee.address);
  if (employee.city) addressParts.push(employee.city);
  if (employee.state) addressParts.push(employee.state);
  if (employee.pincode) addressParts.push(employee.pincode);
  const fullAddress = addressParts.join(', ');

  // Calculate attendance stats
  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();
  const monthAttendance = attendance.filter((a: any) => {
    const date = new Date(a.date || a.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const presentDays = monthAttendance.filter((a: any) => a.status === 'present').length;
  const absentDays = monthAttendance.filter((a: any) => a.status === 'absent').length;
  const leaveDays = monthAttendance.filter((a: any) => a.status === 'leave').length;
  const lateDays = monthAttendance.filter((a: any) => a.isLate).length;

  // Calculate total salary paid
  const totalPaid = payrollHistory.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);

  // Avatar component
  const Avatar = ({ name, size = "lg" }: { name: string; size?: "md" | "lg" | "xl" }) => {
    const sizeClasses = {
      md: "h-12 w-12 text-lg",
      lg: "h-16 w-16 text-xl",
      xl: "h-20 w-20 text-2xl"
    };
    const initial = name.charAt(0).toUpperCase();
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-purple-500",
      "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;

    return (
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
        {initial}
      </div>
    );
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      active: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <UserCheck className="h-3 w-3" /> },
      inactive: { bg: "bg-gray-100", text: "text-gray-600", icon: <UserX className="h-3 w-3" /> },
      onboarding: { bg: "bg-blue-100", text: "text-blue-700", icon: <Clock className="h-3 w-3" /> },
      "ex-employee": { bg: "bg-orange-100", text: "text-orange-700", icon: <UserX className="h-3 w-3" /> },
      terminated: { bg: "bg-red-100", text: "text-red-700", icon: <UserX className="h-3 w-3" /> },
    };
    const c = config[status] || config.active;
    const displayStatus = status === "ex-employee" ? "Ex-Employee" : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <Badge className={`${c.bg} ${c.text} border-0 gap-1 font-medium`}>
        {c.icon}
        {displayStatus}
      </Badge>
    );
  };

  // Generate calendar days
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - Fixed */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/employees")}
              className="h-9 w-9 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{employee.name}</h1>
              <p className="text-xs text-gray-500">{employee.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/vendor/employees?edit=${id}`)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar name={employee.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{employee.name}</h2>
              <StatusBadge status={employee.status} />
            </div>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">{employee.role}</span>
              {employee.department && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm">{employee.department}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className="bg-blue-100 text-blue-700 border-0">
                {employee.employmentType?.replace("-", " ")}
              </Badge>
              <span className="text-xs text-gray-500">Joined {tenure} ago</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`tel:${employee.phone}`, '_self')}
            className="flex-1 bg-white"
          >
            <Phone className="h-4 w-4 mr-1 text-blue-600" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://wa.me/${employee.phone.replace(/[^0-9]/g, '')}`, '_blank')}
            className="flex-1 bg-white"
          >
            <FaWhatsapp className="h-4 w-4 mr-1 text-green-600" />
            WhatsApp
          </Button>
          {employee.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${employee.email}`, '_blank')}
              className="flex-1 bg-white"
            >
              <Mail className="h-4 w-4 mr-1 text-purple-600" />
              Email
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{presentDays}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{absentDays}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Absent</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{leaveDays}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Leave</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{assignedLeads.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Leads</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b sticky top-[57px] z-10">
          <TabsList className="w-full justify-start gap-0 h-auto p-0 bg-transparent rounded-none overflow-x-auto">
            <TabsTrigger
              value="attendance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm whitespace-nowrap"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="salary"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm whitespace-nowrap"
            >
              Salary
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm whitespace-nowrap"
            >
              Leads ({assignedLeads.length})
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-3 text-sm whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Attendance Tab */}
          <TabsContent value="attendance" className="m-0 p-4 space-y-4">
            {/* Month Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-600">Present</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{presentDays}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-600">Absent</span>
                </div>
                <p className="text-2xl font-bold text-red-700 mt-1">{absentDays}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-amber-600">Leave</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 mt-1">{leaveDays}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-600">Late</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 mt-1">{lateDays}</p>
              </div>
            </div>

            {/* Attendance Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{format(selectedMonth, 'MMMM yyyy')}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
                      className="h-7 px-2"
                    >
                      ←
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMonth(new Date())}
                      className="h-7 px-2 text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
                      className="h-7 px-2"
                    >
                      →
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-xs text-gray-400 font-medium py-1">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {calendarDays.map((day) => {
                    const dayAttendance = monthAttendance.find((a: any) => 
                      isSameDay(new Date(a.date || a.createdAt), day)
                    );
                    const status = dayAttendance?.status || (isWeekend(day) ? 'weekend' : 'none');
                    const statusColors: Record<string, string> = {
                      present: 'bg-emerald-500 text-white',
                      absent: 'bg-red-500 text-white',
                      leave: 'bg-amber-500 text-white',
                      weekend: 'bg-gray-100 text-gray-400',
                      none: 'bg-gray-50 text-gray-600',
                    };
                    return (
                      <div
                        key={day.toISOString()}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${statusColors[status]}`}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500" />
                    <span>Leave</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Attendance Records */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Records</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : monthAttendance.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No attendance records this month</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {monthAttendance.slice(0, 10).map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{format(new Date(record.date || record.createdAt), 'EEE, MMM d')}</p>
                          {record.checkInTime && (
                            <p className="text-xs text-gray-500">
                              {record.checkInTime} - {record.checkOutTime || 'Not checked out'}
                            </p>
                          )}
                        </div>
                        <Badge className={`${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} border-0`}>
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent value="salary" className="m-0 p-4 space-y-4">
            {/* Current Salary Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Current Salary</p>
                    <p className="text-3xl font-bold text-emerald-700">₹{(employee.basicSalary || 0).toLocaleString()}</p>
                    <p className="text-xs text-emerald-600">per month</p>
                  </div>
                  <Button
                    onClick={() => {
                      payrollForm.reset({
                        vendorId: vendorId,
                        employeeId: id,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        basicSalary: employee.basicSalary || 0,
                        overtimeHours: 0,
                        overtimePay: 0,
                        bonuses: 0,
                        deductions: 0,
                        netSalary: employee.basicSalary || 0,
                        paymentStatus: "paid",
                        paymentMethod: "bank_transfer",
                        notes: "",
                      });
                      setShowSalaryDialog(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Pay Salary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Salary Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Total Paid</span>
                </div>
                <p className="text-lg font-bold text-blue-700 mt-1">₹{totalPaid.toLocaleString()}</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Payments</span>
                </div>
                <p className="text-lg font-bold text-purple-700 mt-1">{payrollHistory.length}</p>
              </Card>
            </div>

            {/* Bank Details */}
            {(employee.bankName || employee.bankAccountNumber) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.bankName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="text-sm font-medium">{employee.bankName}</span>
                    </div>
                  )}
                  {employee.bankAccountNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Account</span>
                      <span className="text-sm font-medium">••••{employee.bankAccountNumber.slice(-4)}</span>
                    </div>
                  )}
                  {employee.bankIfscCode && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">IFSC</span>
                      <span className="text-sm font-medium">{employee.bankIfscCode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payrollLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : payrollHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No payment records</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {payrollHistory.map((payroll: any) => (
                      <div key={payroll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{format(new Date(payroll.createdAt), 'MMM yyyy')}</p>
                          <p className="text-xs text-gray-500">{payroll.paymentMethod?.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">₹{(payroll.netSalary || 0).toLocaleString()}</p>
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{payroll.paymentStatus}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="m-0 p-4 space-y-3">
            {assignedLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No leads assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedLeads.map((lead: any) => (
                  <Card key={lead.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-gray-500">{lead.phone}</p>
                        </div>
                      </div>
                      <Badge className={`${lead.status === 'converted' ? 'bg-emerald-100 text-emerald-700' : lead.status === 'interested' ? 'bg-purple-100 text-purple-700' : lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} border-0`}>
                        {lead.status}
                      </Badge>
                    </div>
                    {lead.source && (
                      <p className="text-xs text-gray-500 mt-2">Source: {lead.source}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0 p-4 space-y-4">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{employee.phone}</span>
                </div>
                {employee.email && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm truncate">{employee.email}</span>
                  </div>
                )}
                {fullAddress && (
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{fullAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-medium">{employee.role}</span>
                </div>
                {employee.department && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Department</span>
                    <span className="text-sm font-medium">{employee.department}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-medium">{employee.employmentType?.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Joined</span>
                  <span className="text-sm font-medium">{format(joiningDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Tenure</span>
                  <span className="text-sm font-medium">{tenure}</span>
                </div>
                {employee.shiftStartTime && employee.shiftEndTime && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Shift</span>
                    <span className="text-sm font-medium">{employee.shiftStartTime} - {employee.shiftEndTime}</span>
                  </div>
                )}
                {employee.workingDays && employee.workingDays.length > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Working Days</span>
                    <span className="text-sm font-medium">{employee.workingDays.length} days/week</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ID & Documents */}
            {(employee.idProofType || employee.idProofNumber) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    ID & Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.idProofType && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">ID Type</span>
                      <span className="text-sm font-medium">{employee.idProofType}</span>
                    </div>
                  )}
                  {employee.idProofNumber && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-500">ID Number</span>
                      <span className="text-sm font-medium">••••{employee.idProofNumber.slice(-4)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => statusMutation.mutate('active')}
                  disabled={employee.status === 'active'}
                >
                  <UserCheck className="h-4 w-4 mr-2 text-emerald-600" />
                  Mark as Active
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => statusMutation.mutate('inactive')}
                  disabled={employee.status === 'inactive'}
                >
                  <UserX className="h-4 w-4 mr-2 text-gray-600" />
                  Mark as Inactive
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => statusMutation.mutate('onboarding')}
                  disabled={employee.status === 'onboarding'}
                >
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  Mark as Onboarding
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => statusMutation.mutate('ex-employee')}
                  disabled={employee.status === 'ex-employee'}
                >
                  <UserX className="h-4 w-4 mr-2 text-orange-600" />
                  Mark as Ex-Employee
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Pay Salary Dialog */}
      <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Pay Salary - {employee.name}
            </DialogTitle>
            <DialogDescription>
              Record salary payment for {format(new Date(), 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          <Form {...payrollForm}>
            <form onSubmit={payrollForm.handleSubmit((data) => {
              paySalaryMutation.mutate(data);
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={payrollForm.control}
                  name="basicSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basic Salary (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          field.onChange(value);
                          const total = value + (payrollForm.getValues("bonuses") || 0) - (payrollForm.getValues("deductions") || 0);
                          payrollForm.setValue("netSalary", total);
                        }} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={payrollForm.control}
                  name="bonuses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonuses (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || 0} onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          field.onChange(value);
                          const total = (payrollForm.getValues("basicSalary") || 0) + value - (payrollForm.getValues("deductions") || 0);
                          payrollForm.setValue("netSalary", total);
                        }} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={payrollForm.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || 0} onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                        const total = (payrollForm.getValues("basicSalary") || 0) + (payrollForm.getValues("bonuses") || 0) - value;
                        payrollForm.setValue("netSalary", total);
                      }} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={payrollForm.control}
                name="netSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Salary (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} readOnly className="bg-emerald-50 font-bold text-emerald-700" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={payrollForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Payment notes..." {...field} value={field.value || ""} rows={2} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSalaryDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={paySalaryMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  {paySalaryMutation.isPending ? "Recording..." : "Pay Salary"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

