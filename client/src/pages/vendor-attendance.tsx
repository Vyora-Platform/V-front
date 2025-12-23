import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Clock, Calendar as CalendarIcon, UserCheck, UserX, 
  ArrowLeft, Timer, LogIn, LogOut, MoreHorizontal, Search,
  CalendarDays, Coffee, History, ChevronDown, Check, X, Eye, ChevronRight
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMinutes, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
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
  insertLeaveSchema,
  type Attendance,
  type CustomerAttendance,
  type Employee,
  type Customer,
  type Leave
} from "@shared/schema";
import type { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// Status type definitions
type EmployeeStatus = "present" | "absent" | "checked-out" | "on-leave";
type CustomerStatus = "visited" | "not-visited" | "checked-out";

// Date filter options
type DateFilter = "today" | "yesterday" | "last7days" | "thisMonth";

export default function VendorAttendance() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"employees" | "customers">("employees");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  // Dialog states
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ type: "employee" | "customer"; id: string; name: string } | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  
  // Leave form states
  const [leaveType, setLeaveType] = useState("casual");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

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

  // Fetch leaves
  const { data: leaves = [] } = useQuery<Leave[]>({
    queryKey: [`/api/vendors/${vendorId}/leaves`],
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

  // Create leave mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertLeaveSchema>) => {
      const response = await apiRequest("POST", `/api/leaves`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/leaves`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/attendance`] });
      toast({ title: "✅ Leave recorded successfully" });
      setLeaveDialogOpen(false);
      resetLeaveForm();
    },
    onError: () => {
      toast({ title: "Failed to record leave", variant: "destructive" });
    },
  });

  const resetLeaveForm = () => {
    setLeaveType("casual");
    setLeaveStartDate("");
    setLeaveEndDate("");
    setLeaveReason("");
    setSelectedPerson(null);
  };

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

  // Check if employee is on leave today
  const isEmployeeOnLeaveToday = (employeeId: string) => {
    const today = new Date();
    return leaves.some(leave => {
      if (leave.employeeId !== employeeId) return false;
      if (leave.status !== "approved" && leave.status !== "pending") return false;
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      return today >= startDate && today <= endDate;
    });
  };

  // Get employee's leave for today
  const getEmployeeLeaveToday = (employeeId: string) => {
    const today = new Date();
    return leaves.find(leave => {
      if (leave.employeeId !== employeeId) return false;
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      return today >= startDate && today <= endDate;
    });
  };

  // Calculate employee status
  const getEmployeeStatus = (employeeId: string): EmployeeStatus => {
    // Check if on leave first
    if (isEmployeeOnLeaveToday(employeeId)) return "on-leave";
    
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
  }, [employees, employeeAttendance, leaves, todayStr]);

  const customerStats = useMemo(() => {
    const visitedCount = customers.filter(c => {
      const status = getCustomerStatus(c.id);
      return status === "visited" || status === "checked-out";
    }).length;
    
    return {
      total: customers.length,
      visitsToday: visitedCount,
      notVisited: customers.length - visitedCount
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

  // Handle mark leave
  const handleMarkLeave = (employeeId: string, name: string) => {
    setSelectedPerson({ type: "employee", id: employeeId, name });
    setLeaveStartDate(format(new Date(), "yyyy-MM-dd"));
    setLeaveEndDate(format(new Date(), "yyyy-MM-dd"));
    setLeaveDialogOpen(true);
  };

  // Submit leave
  const submitLeave = () => {
    if (!selectedPerson || !leaveStartDate || !leaveEndDate || !leaveReason) return;
    
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    createLeaveMutation.mutate({
      vendorId: vendorId,
      employeeId: selectedPerson.id,
      leaveType: leaveType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      numberOfDays: diffDays.toString(),
      reason: leaveReason,
      status: "approved", // Auto-approve when vendor marks leave
    });

    // Also mark attendance as on-leave for today if leave starts today
    if (isSameDay(start, new Date())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      markEmployeeAttendanceMutation.mutate({
        vendorId: vendorId,
        employeeId: selectedPerson.id,
        date: today.toISOString(),
        checkInTime: "00:00",
        status: "on-leave",
        notes: `Leave: ${leaveType} - ${leaveReason}`,
      });
    }
  };

  // Get status badge styles
  const getStatusBadge = (status: EmployeeStatus | CustomerStatus) => {
    switch (status) {
      case "present":
      case "visited":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-5">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-5">Absent</Badge>;
      case "not-visited":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 h-5">Not Visited</Badge>;
      case "checked-out":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-5">Checked Out</Badge>;
      case "on-leave":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-5">On Leave</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 h-5">Unknown</Badge>;
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
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
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

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) || 
        (e.phone && e.phone.includes(query))
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(e => getEmployeeStatus(e.id) === statusFilter);
    }
    
    result.sort((a, b) => a.name.localeCompare(b.name));
    
    return result;
  }, [employees, searchQuery, statusFilter, employeeAttendance, leaves, todayStr]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query))
      );
    }
    
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
    
    result.sort((a, b) => a.name.localeCompare(b.name));
    
    return result;
  }, [customers, searchQuery, statusFilter, customerAttendance, todayStr]);

  // Format time for display
  const formatTimeDisplay = (time: string | null | undefined) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Get filtered attendance history
  const getFilteredEmployeeHistory = () => {
    const dateRange = getDateRange();
    return employeeAttendance
      .filter(a => {
        const recordDate = new Date(a.date);
        return recordDate >= dateRange.start && recordDate <= dateRange.end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);
  };

  const getFilteredCustomerHistory = () => {
    const dateRange = getDateRange();
    return customerAttendance
      .filter(a => {
        const recordDate = new Date(a.date);
        return recordDate >= dateRange.start && recordDate <= dateRange.end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);
  };

  if (!vendorId) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Attendance</h1>
              <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1.5 h-9"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{showHistory ? "Hide History" : "History"}</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 pt-3 pb-20 md:pb-6">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any);
          setSearchQuery("");
          setStatusFilter("all");
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Coffee className="h-4 w-4" />
              Customers
            </TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="mt-4 space-y-4">
            {/* Stats Cards */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 min-w-max md:grid md:grid-cols-5">
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{employeeStats.total}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Present</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{employeeStats.present}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Absent</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400">{employeeStats.absent}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">On Leave</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{employeeStats.onLeave}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[110px] md:min-w-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hours</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{employeeStats.workingHours}</p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-10 text-sm shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee List - Full Width Cards (1 per row on mobile, 2 on tablet, 3 on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
              {filteredEmployees.length === 0 ? (
                <Card className="p-6 text-center col-span-full rounded-xl">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {employees.length === 0 ? "No employees found" : "No match found"}
                  </p>
                </Card>
              ) : (
                filteredEmployees.map(employee => {
                  const status = getEmployeeStatus(employee.id);
                  const attendance = getTodayEmployeeAttendance(employee.id);
                  const leaveInfo = getEmployeeLeaveToday(employee.id);
                  
                  return (
                    <Card 
                      key={employee.id} 
                      className="overflow-hidden rounded-xl cursor-pointer hover:shadow-md transition-shadow border"
                              onClick={() => setLocation(`/vendor/attendance/employee/${employee.id}`)}
                            >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <Avatar name={employee.name} size="md" />
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{employee.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.role || "Staff"}
                              </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(status)}
                              {attendance && status !== "on-leave" && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Timer className="h-3 w-3" />
                                    {calculateWorkingHours(attendance.checkInTime, attendance.checkOutTime)}
                                  </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            {status === "absent" && (
                                <Button 
                                  size="sm" 
                                onClick={(e) => { e.stopPropagation(); handleCheckIn("employee", employee.id, employee.name); }}
                                className="h-9 px-4 text-xs"
                                >
                                <LogIn className="h-4 w-4 mr-1" />
                                  Check-in
                                </Button>
                            )}
                            {status === "present" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleCheckOut("employee", employee.id); }}
                                className="h-9 px-4 text-xs"
                                >
                                <LogOut className="h-4 w-4 mr-1" />
                                  Check-out
                                </Button>
                            )}
                            {(status === "on-leave" || status === "checked-out") && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-9 px-4 text-xs"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Employee History Section */}
            {showHistory && (
              <Card className="mt-4 rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Attendance History
                    </CardTitle>
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                      <SelectTrigger className="w-[130px] h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {getFilteredEmployeeHistory().map(record => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar name={getEmployeeName(record.employeeId)} size="sm" />
                            <div>
                              <p className="font-medium text-sm">{getEmployeeName(record.employeeId)}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.date), "MMM d, yyyy")} • 
                                {record.checkInTime ? ` In: ${formatTimeDisplay(record.checkInTime)}` : ""} 
                                {record.checkOutTime ? ` Out: ${formatTimeDisplay(record.checkOutTime)}` : ""}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            record.status === "present" ? "bg-green-100 text-green-700" :
                            record.status === "on-leave" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }>
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                      {getFilteredEmployeeHistory().length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No records found</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-4 space-y-4">
            {/* Stats Cards */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 min-w-max md:grid md:grid-cols-3">
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{customerStats.total}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Visited</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{customerStats.visitsToday}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] md:min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30 border-gray-200 dark:border-gray-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Not Visited</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-400">{customerStats.notVisited}</p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-10 text-sm shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="visited">Visited</SelectItem>
                  <SelectItem value="not-visited">Not Visited</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer List - Full Width Cards (1 per row on mobile, 2 on tablet, full on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {filteredCustomers.length === 0 ? (
                <Card className="p-6 text-center col-span-full rounded-xl">
                  <Coffee className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {customers.length === 0 ? "No customers found" : "No match found"}
                  </p>
                </Card>
              ) : (
                filteredCustomers.map(customer => {
                  const status = getCustomerStatus(customer.id);
                  const attendance = getTodayCustomerAttendance(customer.id);
                  
                  return (
                    <Card 
                      key={customer.id} 
                      className="overflow-hidden rounded-xl cursor-pointer hover:shadow-md transition-shadow border"
                              onClick={() => setLocation(`/vendor/attendance/customer/${customer.id}`)}
                            >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <Avatar name={customer.name} size="md" />
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.phone || "—"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(status)}
                              {attendance && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Timer className="h-3 w-3" />
                                    {calculateWorkingHours(attendance.checkInTime, attendance.checkOutTime)}
                                  </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            {status === "not-visited" && (
                                <Button 
                                  size="sm" 
                                onClick={(e) => { e.stopPropagation(); handleCheckIn("customer", customer.id, customer.name); }}
                                className="h-9 px-4 text-xs"
                                >
                                <LogIn className="h-4 w-4 mr-1" />
                                  Check-in
                                </Button>
                            )}
                            {status === "visited" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                onClick={(e) => { e.stopPropagation(); handleCheckOut("customer", customer.id); }}
                                className="h-9 px-4 text-xs"
                                >
                                <LogOut className="h-4 w-4 mr-1" />
                                  Check-out
                                </Button>
                            )}
                            {status === "checked-out" && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-9 px-4 text-xs"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Customer History Section */}
            {showHistory && (
              <Card className="mt-4 rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Visit History
                    </CardTitle>
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                      <SelectTrigger className="w-[130px] h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {getFilteredCustomerHistory().map(record => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar name={getCustomerName(record.customerId)} size="sm" />
                            <div>
                              <p className="font-medium text-sm">{getCustomerName(record.customerId)}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(record.date), "MMM d, yyyy")} • 
                                {record.checkInTime ? ` In: ${formatTimeDisplay(record.checkInTime)}` : ""} 
                                {record.checkOutTime ? ` Out: ${formatTimeDisplay(record.checkOutTime)}` : ""}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            Visited
                          </Badge>
                        </div>
                      ))}
                      {getFilteredCustomerHistory().length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No records found</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-green-600" />
              {selectedPerson?.type === "employee" ? "Employee Check-in" : "Customer Check-in"}
            </DialogTitle>
            <DialogDescription>
              Record check-in for {selectedPerson?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {selectedPerson && <Avatar name={selectedPerson.name} size="lg" />}
              <div>
                <p className="font-semibold">{selectedPerson?.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedPerson?.type}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check-in Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
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
                placeholder="Add any notes..."
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                rows={2}
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
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              Mark Leave
            </DialogTitle>
            <DialogDescription>
              Record leave for {selectedPerson?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {selectedPerson && <Avatar name={selectedPerson.name} size="lg" />}
              <div>
                <p className="font-semibold">{selectedPerson?.name}</p>
                <p className="text-sm text-muted-foreground">Employee</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Enter leave reason..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setLeaveDialogOpen(false);
              resetLeaveForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={submitLeave}
              disabled={!leaveReason || createLeaveMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
