import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Clock, Calendar as CalendarIcon, UserCheck, UserX, 
  ArrowLeft, Timer, Flag, LogIn, LogOut, Edit2, Eye, 
  Filter, Download, ChevronDown, MoreHorizontal, Search,
  CalendarDays, Building2, History, Settings2, Coffee
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  insertAttendanceSchema, 
  insertCustomerAttendanceSchema,
  type Attendance,
  type CustomerAttendance,
  type Employee,
  type Customer
} from "@shared/schema";
import type { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// Status type definitions
type EmployeeStatus = "present" | "absent" | "checked-out" | "on-leave";
type CustomerStatus = "visited" | "not-visited" | "checked-out";

// Date filter options
type DateFilter = "today" | "yesterday" | "last7days" | "thisMonth" | "custom";

export default function VendorAttendance() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "employees" | "customers" | "history">("dashboard");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  
  // Dialog states
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ type: "employee" | "customer"; id: string; name: string } | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInTime, setCheckInTime] = useState("");

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: [`/api/vendors/${vendorId}/customers`],
    enabled: !!vendorId,
  });

  // Fetch employee attendance
  const { data: employeeAttendance = [], isLoading: isLoadingEmployeeAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/vendors/${vendorId}/attendance`],
    enabled: !!vendorId,
  });

  // Fetch customer attendance
  const { data: customerAttendance = [], isLoading: isLoadingCustomerAttendance } = useQuery<CustomerAttendance[]>({
    queryKey: [`/api/vendors/${vendorId}/customer-attendance`],
    enabled: !!vendorId,
  });

  // Mark employee attendance mutation
  const markEmployeeAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertAttendanceSchema>) => {
      const response = await apiRequest("POST", `/api/attendance`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/attendance`] });
      toast({ title: "✅ Attendance recorded successfully" });
      setCheckInDialogOpen(false);
      setCheckInNotes("");
    },
    onError: () => {
      toast({ title: "Failed to record attendance", variant: "destructive" });
    },
  });

  // Mark customer attendance mutation
  const markCustomerAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerAttendanceSchema>) => {
      const response = await apiRequest("POST", `/api/customer-attendance`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/customer-attendance`] });
      toast({ title: "✅ Customer visit recorded successfully" });
      setCheckInDialogOpen(false);
      setCheckInNotes("");
    },
    onError: () => {
      toast({ title: "Failed to record customer visit", variant: "destructive" });
    },
  });

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date();
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(today), end: endOfDay(today) };
      case "yesterday":
        const yesterday = subDays(today, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "last7days":
        return { start: startOfDay(subDays(today, 7)), end: endOfDay(today) };
      case "thisMonth":
        return { start: startOfMonth(today), end: endOfMonth(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };

  // Today's date string for comparisons
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Get today's employee attendance
  const getTodayEmployeeAttendance = (employeeId: string) => {
    return employeeAttendance.find(a => {
      if (!a.date) return false;
      try {
        const recordDate = format(new Date(a.date), "yyyy-MM-dd");
        return a.employeeId === employeeId && recordDate === todayStr;
      } catch {
        return false;
      }
    });
  };

  // Get today's customer attendance
  const getTodayCustomerAttendance = (customerId: string) => {
    return customerAttendance.find(a => {
      if (!a.date) return false;
      try {
        const recordDate = format(new Date(a.date), "yyyy-MM-dd");
        return a.customerId === customerId && recordDate === todayStr;
      } catch {
        return false;
      }
    });
  };

  // Calculate employee status
  const getEmployeeStatus = (employeeId: string): EmployeeStatus => {
    const attendance = getTodayEmployeeAttendance(employeeId);
    if (!attendance) return "absent";
    if (attendance.status === "present" && attendance.checkOutTime) return "checked-out";
    if (attendance.status === "present") return "present";
    if (attendance.status === "on-leave") return "on-leave";
    return "absent";
  };

  // Calculate customer status
  const getCustomerStatus = (customerId: string): CustomerStatus => {
    const attendance = getTodayCustomerAttendance(customerId);
    if (!attendance) return "not-visited";
    if (attendance.status === "present" && attendance.checkOutTime) return "checked-out";
    if (attendance.status === "present") return "visited";
    return "not-visited";
  };

  // Calculate working hours from time strings
  const calculateWorkingHours = (checkIn: string | null, checkOut: string | null): string => {
    if (!checkIn) return "—";
    if (!checkOut) {
      // Calculate from check-in to now
      const [hours, minutes] = checkIn.split(':').map(Number);
      const checkInDate = new Date();
      checkInDate.setHours(hours, minutes, 0, 0);
      const now = new Date();
      const diffMinutes = differenceInMinutes(now, checkInDate);
      if (diffMinutes < 0) return "—";
      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      return `${h}h ${String(m).padStart(2, '0')}m`;
    }
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const inMinutes = inH * 60 + inM;
    const outMinutes = outH * 60 + outM;
    const diffMinutes = outMinutes - inMinutes;
    if (diffMinutes < 0) return "—";
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  // Calculate statistics
  const employeeStats = useMemo(() => {
    const presentCount = employees.filter(e => getEmployeeStatus(e.id) === "present").length;
    const absentCount = employees.filter(e => getEmployeeStatus(e.id) === "absent").length;
    const checkedOutCount = employees.filter(e => getEmployeeStatus(e.id) === "checked-out").length;
    const onLeaveCount = employees.filter(e => getEmployeeStatus(e.id) === "on-leave").length;
    
    // Calculate total working hours tracked today
    let totalMinutes = 0;
    employees.forEach(emp => {
      const attendance = getTodayEmployeeAttendance(emp.id);
      if (attendance?.checkInTime) {
        const [hours, minutes] = attendance.checkInTime.split(':').map(Number);
        const checkInDate = new Date();
        checkInDate.setHours(hours, minutes, 0, 0);
        const endTime = attendance.checkOutTime 
          ? (() => {
              const [h, m] = attendance.checkOutTime.split(':').map(Number);
              const d = new Date();
              d.setHours(h, m, 0, 0);
              return d;
            })()
          : new Date();
        totalMinutes += differenceInMinutes(endTime, checkInDate);
      }
    });
    const workingHours = `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, '0')}m`;

    return {
      total: employees.length,
      present: presentCount,
      absent: absentCount,
      checkedOut: checkedOutCount,
      onLeave: onLeaveCount,
      workingHours
    };
  }, [employees, employeeAttendance, todayStr]);

  const customerStats = useMemo(() => {
    const visitedCount = customers.filter(c => {
      const status = getCustomerStatus(c.id);
      return status === "visited" || status === "checked-out";
    }).length;
    const newCustomersToday = 0; // Would need customer creation date
    const returningCustomers = visitedCount; // Simplified
    
    return {
      total: customers.length,
      visitsToday: visitedCount,
      newToday: newCustomersToday,
      returning: returningCustomers,
      avgDuration: "—"
    };
  }, [customers, customerAttendance, todayStr]);

  // Handle check-in
  const handleCheckIn = (type: "employee" | "customer", id: string, name: string) => {
    setSelectedPerson({ type, id, name });
    setCheckInTime(getCurrentTime());
    setCheckInNotes("");
    setCheckInDialogOpen(true);
  };

  // Handle check-out
  const handleCheckOut = (type: "employee" | "customer", id: string) => {
    const checkOutTime = getCurrentTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === "employee") {
      const existing = getTodayEmployeeAttendance(id);
      markEmployeeAttendanceMutation.mutate({
        vendorId: vendorId,
        employeeId: id,
        date: today.toISOString(),
        checkInTime: existing?.checkInTime || checkOutTime,
        checkOutTime: checkOutTime,
        status: "present",
      });
    } else {
      const existing = getTodayCustomerAttendance(id);
      markCustomerAttendanceMutation.mutate({
        vendorId: vendorId,
        customerId: id,
        date: today.toISOString(),
        checkInTime: existing?.checkInTime || checkOutTime,
        checkOutTime: checkOutTime,
        status: "present",
      });
    }
  };

  // Submit check-in
  const submitCheckIn = () => {
    if (!selectedPerson) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedPerson.type === "employee") {
      markEmployeeAttendanceMutation.mutate({
        vendorId: vendorId,
        employeeId: selectedPerson.id,
        date: today.toISOString(),
        checkInTime: checkInTime,
        status: "present",
        notes: checkInNotes || undefined,
      });
    } else {
      markCustomerAttendanceMutation.mutate({
        vendorId: vendorId,
        customerId: selectedPerson.id,
        date: today.toISOString(),
        checkInTime: checkInTime,
        status: "present",
        notes: checkInNotes || undefined,
      });
    }
  };

  // Mark as on leave
  const handleMarkLeave = (employeeId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    markEmployeeAttendanceMutation.mutate({
      vendorId: vendorId,
      employeeId: employeeId,
      date: today.toISOString(),
      checkInTime: "00:00",
      status: "on-leave",
      notes: "Marked as on leave",
    });
  };

  // Get status badge styles
  const getStatusBadge = (status: EmployeeStatus | CustomerStatus) => {
    switch (status) {
      case "present":
      case "visited":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">● Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">● Absent</Badge>;
      case "not-visited":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">● Not Visited</Badge>;
      case "checked-out":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">● Checked Out</Badge>;
      case "on-leave":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">● On Leave</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">● Unknown</Badge>;
    }
  };

  // Avatar component
  const Avatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base"
    };
    const initial = name.charAt(0).toUpperCase();
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
      "bg-amber-500", "bg-rose-500", "bg-cyan-500"
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold`}>
        {initial}
      </div>
    );
  };

  // Get employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || "Unknown";
  };

  // Get customer name
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown";
  };

  // Get employee phone
  const getEmployeePhone = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.phone || "—";
  };

  // Get customer phone
  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.phone || "—";
  };

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) || 
        (e.phone && e.phone.includes(query))
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(e => getEmployeeStatus(e.id) === statusFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "checkin") {
        const aTime = getTodayEmployeeAttendance(a.id)?.checkInTime || "";
        const bTime = getTodayEmployeeAttendance(b.id)?.checkInTime || "";
        return aTime.localeCompare(bTime);
      }
      return 0;
    });
    
    return result;
  }, [employees, searchQuery, statusFilter, sortBy, employeeAttendance, todayStr]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query))
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      const statusMap: Record<string, CustomerStatus> = {
        "visited": "visited",
        "not-visited": "not-visited",
        "checked-out": "checked-out"
      };
      if (statusMap[statusFilter]) {
        result = result.filter(c => getCustomerStatus(c.id) === statusMap[statusFilter]);
      }
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "checkin") {
        const aTime = getTodayCustomerAttendance(a.id)?.checkInTime || "";
        const bTime = getTodayCustomerAttendance(b.id)?.checkInTime || "";
        return aTime.localeCompare(bTime);
      }
      return 0;
    });
    
    return result;
  }, [customers, searchQuery, statusFilter, sortBy, customerAttendance, todayStr]);

  // Format time for display
  const formatTimeDisplay = (time: string | null | undefined) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="md:hidden flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🌟 Attendance</h1>
              </div>
              <p className="text-sm text-gray-500">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6 pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex bg-white border shadow-sm">
            <TabsTrigger value="dashboard" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:block" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Coffee className="h-4 w-4 hidden sm:block" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4 hidden sm:block" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            {/* Employee Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Employee Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-gray-900">{employeeStats.total}</div>
                    <p className="text-sm text-gray-500 mt-1">Total Employees</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-emerald-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-emerald-600">{employeeStats.present}</div>
                    <p className="text-sm text-emerald-700 mt-1">Present Today</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-red-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-red-600">{employeeStats.absent}</div>
                    <p className="text-sm text-red-700 mt-1">Absent</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-amber-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-amber-600">{employeeStats.onLeave}</div>
                    <p className="text-sm text-amber-700 mt-1">On Leave</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-blue-600">{employeeStats.checkedOut}</div>
                    <p className="text-sm text-blue-700 mt-1">Checked Out</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-purple-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-2xl font-bold text-purple-600">{employeeStats.workingHours}</div>
                    <p className="text-sm text-purple-700 mt-1">Hours Tracked</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Customer Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coffee className="h-5 w-5 text-purple-600" />
                Customer Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-gray-900">{customerStats.total}</div>
                    <p className="text-sm text-gray-500 mt-1">Total Customers</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-emerald-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-emerald-600">{customerStats.visitsToday}</div>
                    <p className="text-sm text-emerald-700 mt-1">Visits Today</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-blue-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-blue-600">{customerStats.newToday}</div>
                    <p className="text-sm text-blue-700 mt-1">New Today</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-purple-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl font-bold text-purple-600">{customerStats.returning}</div>
                    <p className="text-sm text-purple-700 mt-1">Returning</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gray-50">
                  <CardContent className="pt-5 pb-4">
                    <div className="text-2xl font-bold text-gray-600">{customerStats.avgDuration}</div>
                    <p className="text-sm text-gray-500 mt-1">Avg Duration</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Employee Activity */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-600" />
                    Recent Employee Check-ins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employees.slice(0, 5).map(employee => {
                      const status = getEmployeeStatus(employee.id);
                      const attendance = getTodayEmployeeAttendance(employee.id);
                      return (
                        <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar name={employee.name} size="sm" />
                            <div>
                              <p className="font-medium text-sm text-gray-900">{employee.name}</p>
                              <p className="text-xs text-gray-500">
                                {attendance?.checkInTime ? formatTimeDisplay(attendance.checkInTime) : "Not checked in"}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      );
                    })}
                    {employees.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No employees found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Customer Visits */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-purple-600" />
                    Recent Customer Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customers.slice(0, 5).map(customer => {
                      const status = getCustomerStatus(customer.id);
                      const attendance = getTodayCustomerAttendance(customer.id);
                      return (
                        <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar name={customer.name} size="sm" />
                            <div>
                              <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">
                                {attendance?.checkInTime ? formatTimeDisplay(attendance.checkInTime) : "Not visited"}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(status)}
                        </div>
                      );
                    })}
                    {customers.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No customers found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Employee Attendance
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="checked-out">Checked Out</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Check-in</TableHead>
                        <TableHead className="font-semibold">Check-out</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map(employee => {
                        const status = getEmployeeStatus(employee.id);
                        const attendance = getTodayEmployeeAttendance(employee.id);
                        
                        return (
                          <TableRow key={employee.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar name={employee.name} />
                                <div>
                                  <p className="font-medium text-gray-900">{employee.name}</p>
                                  <p className="text-xs text-gray-500">{employee.role || "Staff"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{employee.phone || "—"}</TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {attendance?.checkInTime ? formatTimeDisplay(attendance.checkInTime) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {attendance?.checkOutTime ? formatTimeDisplay(attendance.checkOutTime) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                {status === "absent" && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleCheckIn("employee", employee.id, employee.name)}
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                      <LogIn className="h-4 w-4 mr-1" />
                                      Check-in
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleMarkLeave(employee.id)}>
                                          <CalendarDays className="h-4 w-4 mr-2" />
                                          Mark Leave
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                                {status === "present" && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCheckOut("employee", employee.id)}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Check-out
                                  </Button>
                                )}
                                {(status === "checked-out" || status === "on-leave") && (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredEmployees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            {employees.length === 0 ? "No employees found. Add employees first." : "No employees match your filters."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium">Status:</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Present = Checked in</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Absent = No check-in</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Checked Out = Completed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> On Leave = Marked by admin</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-purple-600" />
                    Customer Attendance
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="visited">Visited</SelectItem>
                        <SelectItem value="not-visited">Not Visited</SelectItem>
                        <SelectItem value="checked-out">Checked Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Check-in</TableHead>
                        <TableHead className="font-semibold">Check-out</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map(customer => {
                        const status = getCustomerStatus(customer.id);
                        const attendance = getTodayCustomerAttendance(customer.id);
                        
                        return (
                          <TableRow key={customer.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar name={customer.name} />
                                <div>
                                  <p className="font-medium text-gray-900">{customer.name}</p>
                                  <p className="text-xs text-gray-500">{customer.email || "—"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{customer.phone || "—"}</TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {attendance?.checkInTime ? formatTimeDisplay(attendance.checkInTime) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {attendance?.checkOutTime ? formatTimeDisplay(attendance.checkOutTime) : "—"}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                {status === "not-visited" && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCheckIn("customer", customer.id, customer.name)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <LogIn className="h-4 w-4 mr-1" />
                                    Check-in
                                  </Button>
                                )}
                                {status === "visited" && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCheckOut("customer", customer.id)}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Check-out
                                  </Button>
                                )}
                                {status === "checked-out" && (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredCustomers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            {customers.length === 0 ? "No customers found. Add customers first." : "No customers match your filters."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium">Status:</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Visited = Checked in</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full"></span> Not Visited = No attendance</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Checked Out = Completed visit</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-600" />
                    Attendance History
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="checkin">Check-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Employee History */}
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Employee Records
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Check-in</TableHead>
                          <TableHead className="font-semibold">Check-out</TableHead>
                          <TableHead className="font-semibold">Hours</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeAttendance
                          .filter(a => {
                            if (statusFilter !== "all" && a.status !== statusFilter) return false;
                            const dateRange = getDateRange();
                            const recordDate = new Date(a.date);
                            return recordDate >= dateRange.start && recordDate <= dateRange.end;
                          })
                          .slice(0, 20)
                          .map(record => (
                            <TableRow key={record.id} className="hover:bg-gray-50/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar name={getEmployeeName(record.employeeId)} size="sm" />
                                  <span className="font-medium">{getEmployeeName(record.employeeId)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {format(new Date(record.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {record.checkInTime ? formatTimeDisplay(record.checkInTime) : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {record.checkOutTime ? formatTimeDisplay(record.checkOutTime) : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {calculateWorkingHours(record.checkInTime, record.checkOutTime)}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  record.status === "present" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                  record.status === "absent" ? "bg-red-100 text-red-700 border-red-200" :
                                  record.status === "on-leave" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                  "bg-gray-100 text-gray-600 border-gray-200"
                                }>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                                {record.notes || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        {employeeAttendance.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Customer Visit History */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-purple-600" />
                    Customer Visit Records
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Check-in</TableHead>
                          <TableHead className="font-semibold">Check-out</TableHead>
                          <TableHead className="font-semibold">Duration</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerAttendance
                          .filter(a => {
                            const statusMap: Record<string, string> = {
                              "present": "visited",
                              "absent": "not-visited"
                            };
                            if (statusFilter !== "all" && a.status !== statusFilter) return false;
                            const dateRange = getDateRange();
                            const recordDate = new Date(a.date);
                            return recordDate >= dateRange.start && recordDate <= dateRange.end;
                          })
                          .slice(0, 20)
                          .map(record => (
                            <TableRow key={record.id} className="hover:bg-gray-50/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar name={getCustomerName(record.customerId)} size="sm" />
                                  <span className="font-medium">{getCustomerName(record.customerId)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {format(new Date(record.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {record.checkInTime ? formatTimeDisplay(record.checkInTime) : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {record.checkOutTime ? formatTimeDisplay(record.checkOutTime) : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {calculateWorkingHours(record.checkInTime, record.checkOutTime)}
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  record.status === "present" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                  "bg-gray-100 text-gray-600 border-gray-200"
                                }>
                                  {record.status === "present" ? "Visited" : "Not Visited"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                                {record.notes || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        {customerAttendance.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              No customer visit records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-emerald-600" />
              {selectedPerson?.type === "employee" ? "Mark Employee Attendance" : "Mark Customer Visit"}
            </DialogTitle>
            <DialogDescription>
              Record check-in for {selectedPerson?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedPerson && <Avatar name={selectedPerson.name} size="lg" />}
              <div>
                <p className="font-semibold text-gray-900">{selectedPerson?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{selectedPerson?.type}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check-in Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  id="checkInTime"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder={selectedPerson?.type === "employee" ? "e.g., Late due to traffic" : "e.g., Workout session, Consultation"}
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitCheckIn}
              disabled={markEmployeeAttendanceMutation.isPending || markCustomerAttendanceMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Confirm Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
