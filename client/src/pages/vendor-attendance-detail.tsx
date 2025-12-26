import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Clock, Calendar as CalendarIcon, ArrowLeft, Timer, 
  LogIn, LogOut, Search, Download, Filter, TrendingUp, 
  ChevronLeft, ChevronRight, User, Coffee, RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
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
  type Attendance,
  type CustomerAttendance,
  type Employee,
  type Customer,
  type Leave
} from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorAttendanceDetail() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/attendance/:type/:id");
  
  const personType = params?.type as "employee" | "customer" | undefined;
  const personId = params?.id;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
  const { data: employeeAttendance = [], isLoading: isLoadingEmployeeAttendance, refetch: refetchEmployeeAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/vendors/${vendorId}/attendance`],
    enabled: !!vendorId && personType === "employee",
  });

  // Fetch customer attendance
  const { data: customerAttendance = [], isLoading: isLoadingCustomerAttendance, refetch: refetchCustomerAttendance } = useQuery<CustomerAttendance[]>({
    queryKey: [`/api/vendors/${vendorId}/customer-attendance`],
    enabled: !!vendorId && personType === "customer",
  });

  // Fetch leaves for employee
  const { data: leaves = [] } = useQuery<Leave[]>({
    queryKey: [`/api/vendors/${vendorId}/leaves`],
    enabled: !!vendorId && personType === "employee",
  });

  // Get person details
  const person = useMemo(() => {
    if (personType === "employee") {
      return employees.find(e => e.id === personId);
    } else if (personType === "customer") {
      return customers.find(c => c.id === personId);
    }
    return undefined;
  }, [personType, personId, employees, customers]);

  // Get attendance records for this person
  const attendanceRecords = useMemo(() => {
    if (personType === "employee") {
      return employeeAttendance.filter(a => a.employeeId === personId);
    } else if (personType === "customer") {
      return customerAttendance.filter(a => a.customerId === personId);
    }
    return [];
  }, [personType, personId, employeeAttendance, customerAttendance]);

  // Get leaves for this employee
  const personLeaves = useMemo(() => {
    if (personType === "employee") {
      return leaves.filter(l => l.employeeId === personId);
    }
    return [];
  }, [personType, personId, leaves]);

  // Calculate statistics
  const stats = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const monthRecords = attendanceRecords.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    });

    let totalMinutes = 0;
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let lateDays = 0;

    monthRecords.forEach(record => {
      if (record.status === "present") {
        presentDays++;
        if (record.checkInTime && record.checkOutTime) {
          const [inH, inM] = record.checkInTime.split(':').map(Number);
          const [outH, outM] = record.checkOutTime.split(':').map(Number);
          const inMinutes = inH * 60 + inM;
          const outMinutes = outH * 60 + outM;
          totalMinutes += Math.max(0, outMinutes - inMinutes);
        }
        // Check for late arrival (after 9:30 AM)
        if (record.checkInTime) {
          const [h, m] = record.checkInTime.split(':').map(Number);
          if (h > 9 || (h === 9 && m > 30)) {
            lateDays++;
          }
        }
      } else if (record.status === "on-leave") {
        leaveDays++;
      } else {
        absentDays++;
      }
    });

    // Calculate working days in month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
      .filter(d => d.getDay() !== 0); // Exclude Sundays
    const workingDays = daysInMonth.length;
    const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
    const avgHoursPerDay = presentDays > 0 ? Math.round(totalMinutes / presentDays / 60 * 10) / 10 : 0;

    return {
      presentDays,
      absentDays,
      leaveDays,
      lateDays,
      totalHours: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      avgHoursPerDay,
      attendanceRate,
      workingDays
    };
  }, [attendanceRecords, selectedMonth]);

  // Get attendance for a specific date
  const getAttendanceForDate = (date: Date) => {
    return attendanceRecords.find(a => {
      const recordDate = new Date(a.date);
      return isSameDay(recordDate, date);
    });
  };

  // Get leave for a specific date
  const getLeaveForDate = (date: Date) => {
    return personLeaves.find(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return date >= start && date <= end;
    });
  };

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [selectedMonth]);

  // Format time for display
  const formatTimeDisplay = (time: string | null | undefined) => {
    if (!time) return "—";
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Calculate duration
  const calculateDuration = (checkIn: string | null, checkOut: string | null): string => {
    if (!checkIn || !checkOut) return "—";
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

  // Filter records for list view
  const filteredRecords = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    let records = attendanceRecords.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    });

    if (statusFilter !== "all") {
      records = records.filter(r => r.status === statusFilter);
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, selectedMonth, statusFilter]);

  // Avatar component
  const Avatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-xl"
    };
    const initial = name?.charAt(0).toUpperCase() || "?";
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
      "bg-amber-500", "bg-rose-500", "bg-cyan-500"
    ];
    const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;
    
    return (
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
        {initial}
      </div>
    );
  };

  // Handle back navigation
  const handleBack = () => {
    setLocation("/vendor/attendance");
  };

  // Handle refresh
  const handleRefresh = () => {
    if (personType === "employee") {
      refetchEmployeeAttendance();
    } else {
      refetchCustomerAttendance();
    }
  };

  if (!vendorId) return <LoadingSpinner />;
  if (!person) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background items-center justify-center p-4">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Person not found</p>
          <p className="text-sm text-muted-foreground mb-6">The requested record could not be found.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = personType === "employee" ? isLoadingEmployeeAttendance : isLoadingCustomerAttendance;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Header - Full Width */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-foreground">Attendance Details</h1>
              <p className="text-xs lg:text-sm text-muted-foreground capitalize">{personType} Record</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5 h-9"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 lg:px-6 py-4 lg:py-6 pb-24 md:pb-6">
        {/* Person Info Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-4 lg:mb-6">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar name={person.name} size="xl" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl lg:text-2xl font-bold text-foreground truncate">{person.name}</h2>
                <p className="text-sm lg:text-base text-muted-foreground">
                  {personType === "employee" ? (person as Employee).role || "Staff" : "Customer"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                  {person.phone && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {person.phone}
                    </span>
                  )}
                  {person.email && (
                    <span className="flex items-center gap-1 truncate">
                      • {person.email}
                    </span>
                  )}
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 self-start sm:self-center">
                {personType === "employee" ? <Users className="h-3 w-3 mr-1" /> : <Coffee className="h-3 w-3 mr-1" />}
                {personType}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="h-9 w-9 lg:h-10 lg:w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg lg:text-xl font-semibold">
            {format(selectedMonth, "MMMM yyyy")}
          </h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="h-9 w-9 lg:h-10 lg:w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards - Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <Card className="p-3 lg:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
            <div className="text-center">
              <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Present</p>
              <p className="text-xl lg:text-2xl font-bold text-green-700 dark:text-green-400">{stats.presentDays}</p>
            </div>
          </Card>
          <Card className="p-3 lg:p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800">
            <div className="text-center">
              <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Absent</p>
              <p className="text-xl lg:text-2xl font-bold text-red-700 dark:text-red-400">{stats.absentDays}</p>
            </div>
          </Card>
          {personType === "employee" && (
            <Card className="p-3 lg:p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800">
              <div className="text-center">
                <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Leave</p>
                <p className="text-xl lg:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.leaveDays}</p>
              </div>
            </Card>
          )}
          <Card className="p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Rate</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.attendanceRate}%</p>
            </div>
          </Card>
          <Card className={`p-3 lg:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 ${personType !== "employee" ? "col-span-2 sm:col-span-1" : ""}`}>
            <div className="text-center">
              <p className="text-[10px] lg:text-xs text-muted-foreground uppercase tracking-wider">Avg Hours</p>
              <p className="text-lg lg:text-xl font-bold text-purple-700 dark:text-purple-400">{stats.avgHoursPerDay}h</p>
            </div>
          </Card>
        </div>

        {/* View Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="calendar" className="px-4 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="px-4 gap-2">
                <Filter className="h-4 w-4" />
                <span>List</span>
              </TabsTrigger>
            </TabsList>
            {viewMode === "list" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-0">
            <Card>
              <CardContent className="p-4 lg:p-6">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-2 lg:mb-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="text-center text-xs lg:text-sm font-medium text-muted-foreground py-2">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 lg:gap-2">
                  {calendarDays.map((day, idx) => {
                    const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                    const attendance = getAttendanceForDate(day);
                    const leave = getLeaveForDate(day);
                    const isSunday = day.getDay() === 0;
                    
                    let bgColor = "bg-muted/30";
                    let textColor = "text-muted-foreground";
                    
                    if (!isCurrentMonth) {
                      bgColor = "bg-transparent";
                      textColor = "text-muted-foreground/30";
                    } else if (leave) {
                      bgColor = "bg-amber-100 dark:bg-amber-900/30";
                      textColor = "text-amber-700 dark:text-amber-400";
                    } else if (attendance?.status === "present") {
                      bgColor = "bg-green-100 dark:bg-green-900/30";
                      textColor = "text-green-700 dark:text-green-400";
                    } else if (attendance?.status === "on-leave") {
                      bgColor = "bg-amber-100 dark:bg-amber-900/30";
                      textColor = "text-amber-700 dark:text-amber-400";
                    } else if (isSunday) {
                      bgColor = "bg-gray-100 dark:bg-gray-800/50";
                      textColor = "text-muted-foreground";
                    } else if (day < new Date() && isCurrentMonth) {
                      bgColor = "bg-red-50 dark:bg-red-900/20";
                      textColor = "text-red-600 dark:text-red-400";
                    }

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center ${bgColor} ${textColor} ${isToday(day) ? "ring-2 ring-primary" : ""} transition-colors`}
                      >
                        <span className="text-xs sm:text-sm font-medium">{format(day, "d")}</span>
                        {attendance && isCurrentMonth && (
                          <span className="text-[8px] sm:text-[10px] mt-0.5 hidden sm:block">
                            {attendance.checkInTime ? formatTimeDisplay(attendance.checkInTime).replace(" ", "") : ""}
                          </span>
                        )}
                        {leave && isCurrentMonth && (
                          <span className="text-[7px] sm:text-[8px] mt-0.5 font-medium">LEAVE</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 lg:mt-6 flex flex-wrap items-center gap-3 lg:gap-6 text-xs lg:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 lg:w-4 lg:h-4 bg-green-100 dark:bg-green-900/30 rounded"></span> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 lg:w-4 lg:h-4 bg-red-50 dark:bg-red-900/20 rounded"></span> Absent</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 lg:w-4 lg:h-4 bg-amber-100 dark:bg-amber-900/30 rounded"></span> Leave</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-100 dark:bg-gray-800/50 rounded"></span> Sunday</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No attendance records found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                record.status === "present" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                record.status === "on-leave" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                                <CalendarIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold">{format(new Date(record.date), "EEEE")}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(record.date), "MMM d, yyyy")}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              record.status === "present" ? "bg-green-100 text-green-700" :
                              record.status === "on-leave" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatTimeDisplay(record.checkInTime)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm">
                              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatTimeDisplay(record.checkOutTime)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm font-medium">
                              <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                              {calculateDuration(record.checkInTime, record.checkOutTime)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {record.notes ? (
                              <span className="text-sm text-muted-foreground line-clamp-1">{record.notes}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <Card className="p-8 text-center">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No attendance records found</p>
                    </Card>
                  ) : (
                    filteredRecords.map(record => (
                      <Card key={record.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                record.status === "present" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                record.status === "on-leave" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                                <CalendarIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{format(new Date(record.date), "EEEE, MMM d, yyyy")}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  {record.checkInTime && (
                                    <span className="flex items-center gap-1">
                                      <LogIn className="h-3 w-3" />
                                      {formatTimeDisplay(record.checkInTime)}
                                    </span>
                                  )}
                                  {record.checkOutTime && (
                                    <span className="flex items-center gap-1">
                                      <LogOut className="h-3 w-3" />
                                      {formatTimeDisplay(record.checkOutTime)}
                                    </span>
                                  )}
                                  {record.checkInTime && record.checkOutTime && (
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      {calculateDuration(record.checkInTime, record.checkOutTime)}
                                    </span>
                                  )}
                                </div>
                                {record.notes && (
                                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{record.notes}</p>
                                )}
                              </div>
                            </div>
                            <Badge className={`shrink-0 ${
                              record.status === "present" ? "bg-green-100 text-green-700" :
                              record.status === "on-leave" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {record.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
