import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, ArrowLeft, User, Clock, FileText,
  ChevronLeft, ChevronRight, Filter, TrendingUp, AlertCircle,
  CheckCircle, XCircle, TimerOff, Users, Download
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, startOfWeek, endOfWeek, isToday, parseISO, differenceInDays, startOfYear, endOfYear, getMonth } from "date-fns";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  type Leave,
  type Employee
} from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorLeaveDetail() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/leaves/:id");
  
  const employeeId = params?.id;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "summary">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Fetch leaves
  const { data: allLeaves = [], isLoading: isLoadingLeaves } = useQuery<Leave[]>({
    queryKey: [`/api/vendors/${vendorId}/leaves`],
    enabled: !!vendorId,
  });

  // Get employee details
  const employee = useMemo(() => {
    return employees.find(e => e.id === employeeId);
  }, [employeeId, employees]);

  // Get leaves for this employee
  const employeeLeaves = useMemo(() => {
    return allLeaves.filter(l => l.employeeId === employeeId);
  }, [allLeaves, employeeId]);

  // Calculate leave balance and statistics
  const leaveStats = useMemo(() => {
    const year = parseInt(yearFilter);
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    
    const yearLeaves = employeeLeaves.filter(l => {
      const leaveDate = new Date(l.startDate);
      return leaveDate >= yearStart && leaveDate <= yearEnd;
    });

    const approvedLeaves = yearLeaves.filter(l => l.status === "approved");
    const pendingLeaves = yearLeaves.filter(l => l.status === "pending");
    const rejectedLeaves = yearLeaves.filter(l => l.status === "rejected");

    // Calculate total days by type
    const byType: Record<string, number> = {};
    approvedLeaves.forEach(l => {
      const days = typeof l.numberOfDays === 'string' ? parseFloat(l.numberOfDays) : l.numberOfDays;
      if (!byType[l.leaveType]) byType[l.leaveType] = 0;
      byType[l.leaveType] += days;
    });

    // Total approved days
    const totalApprovedDays = approvedLeaves.reduce((sum, l) => {
      const days = typeof l.numberOfDays === 'string' ? parseFloat(l.numberOfDays) : l.numberOfDays;
      return sum + days;
    }, 0);

    // Monthly breakdown
    const monthlyBreakdown: Record<number, number> = {};
    for (let m = 0; m < 12; m++) {
      monthlyBreakdown[m] = 0;
    }
    approvedLeaves.forEach(l => {
      const month = getMonth(new Date(l.startDate));
      const days = typeof l.numberOfDays === 'string' ? parseFloat(l.numberOfDays) : l.numberOfDays;
      monthlyBreakdown[month] += days;
    });

    // Default leave entitlements (can be customized)
    const entitlements = {
      casual: 12,
      sick: 10,
      earned: 15,
      paid: 10,
      maternity: 180,
      paternity: 15
    };

    // Calculate remaining leaves
    const remaining: Record<string, number> = {};
    Object.keys(entitlements).forEach(type => {
      const used = byType[type] || 0;
      remaining[type] = Math.max(0, entitlements[type as keyof typeof entitlements] - used);
    });

    return {
      totalLeaves: yearLeaves.length,
      totalApprovedDays,
      pendingCount: pendingLeaves.length,
      rejectedCount: rejectedLeaves.length,
      approvedCount: approvedLeaves.length,
      byType,
      monthlyBreakdown,
      entitlements,
      remaining
    };
  }, [employeeLeaves, yearFilter]);

  // Filter leaves for list view
  const filteredLeaves = useMemo(() => {
    let leaves = [...employeeLeaves];
    
    // Filter by year
    const year = parseInt(yearFilter);
    leaves = leaves.filter(l => {
      const leaveDate = new Date(l.startDate);
      return leaveDate.getFullYear() === year;
    });

    // Filter by status
    if (statusFilter !== "all") {
      leaves = leaves.filter(l => l.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      leaves = leaves.filter(l => l.leaveType === typeFilter);
    }

    return leaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [employeeLeaves, statusFilter, typeFilter, yearFilter]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [selectedMonth]);

  // Get leave for a specific date
  const getLeaveForDate = (date: Date) => {
    return employeeLeaves.find(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end && l.status === "approved";
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // Get leave type color
  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "casual": return "bg-blue-100 text-blue-700 border-blue-200";
      case "sick": return "bg-purple-100 text-purple-700 border-purple-200";
      case "earned": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "paid": return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "maternity": return "bg-pink-100 text-pink-700 border-pink-200";
      case "paternity": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

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

  // Format days display
  const formatDays = (days: number | string) => {
    const numDays = typeof days === 'string' ? parseFloat(days) : days;
    if (numDays === 1) return "1 day";
    return `${numDays} days`;
  };

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Month names for summary
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (!vendorId) return <LoadingSpinner />;
  if (!employee) {
    return (
      <div className="flex flex-col h-full w-full bg-background items-center justify-center">
        <p className="text-muted-foreground">Employee not found</p>
        <Button variant="outline" onClick={() => setLocation("/vendor/leaves")} className="mt-4">
          Back to Leaves
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/leaves")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Leave Details</h1>
              <p className="text-xs text-muted-foreground">Employee Leave Record</p>
            </div>
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Info Card */}
      <div className="px-4 py-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar name={employee.name} size="xl" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate">{employee.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {employee.role || "Staff"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {employee.phone || "—"} {employee.email ? `• ${employee.email}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{leaveStats.totalApprovedDays}</p>
                <p className="text-xs text-muted-foreground">Days Taken ({yearFilter})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="px-4 space-y-4">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-3 min-w-max">
            <Card className="p-3 min-w-[100px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
              <div className="text-center">
                <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">{leaveStats.approvedCount}</p>
              </div>
            </Card>
            <Card className="p-3 min-w-[100px] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800">
              <div className="text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{leaveStats.pendingCount}</p>
              </div>
            </Card>
            <Card className="p-3 min-w-[100px] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800">
              <div className="text-center">
                <XCircle className="h-4 w-4 mx-auto mb-1 text-red-600" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rejected</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{leaveStats.rejectedCount}</p>
              </div>
            </Card>
            <Card className="p-3 min-w-[100px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <CalendarIcon className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{leaveStats.totalLeaves}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex-1 px-4 py-4 overflow-hidden">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="list" className="px-3">
                <FileText className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="px-3">
                <CalendarIcon className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="px-3">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
            </TabsList>
            {viewMode === "list" && (
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="earned">Earned</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="paternity">Paternity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* List View */}
          <TabsContent value="list" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="space-y-2 pb-4">
                {isLoadingLeaves ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredLeaves.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No leave records found</p>
                  </Card>
                ) : (
                  filteredLeaves.map(leave => (
                    <Card key={leave.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge className={getLeaveTypeColor(leave.leaveType)}>
                                {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                              </Badge>
                              <Badge className={getStatusColor(leave.status)}>
                                {leave.status}
                              </Badge>
                              <span className="text-sm font-medium text-muted-foreground">
                                {formatDays(leave.numberOfDays)}
                              </span>
                            </div>
                            <p className="font-semibold mb-1">
                              {format(new Date(leave.startDate), "MMM d, yyyy")} 
                              {!isSameDay(new Date(leave.startDate), new Date(leave.endDate)) && (
                                <span> — {format(new Date(leave.endDate), "MMM d, yyyy")}</span>
                              )}
                            </p>
                            {leave.reason && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {leave.reason}
                              </p>
                            )}
                            {leave.durationType && leave.durationType !== "full" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Duration: {leave.durationType === "half" ? "Half Day" : "Quarter Day"}
                              </p>
                            )}
                            {leave.approvedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Marked on {format(new Date(leave.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="flex-1 overflow-auto">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {format(selectedMonth, "MMMM yyyy")}
                  </h3>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                    const leave = getLeaveForDate(day);
                    const isSunday = day.getDay() === 0;
                    
                    let bgColor = "bg-muted/30";
                    let textColor = "text-muted-foreground";
                    let leaveLabel = "";
                    
                    if (!isCurrentMonth) {
                      bgColor = "bg-transparent";
                      textColor = "text-muted-foreground/30";
                    } else if (leave) {
                      switch (leave.leaveType) {
                        case "sick":
                          bgColor = "bg-purple-100 dark:bg-purple-900/30";
                          textColor = "text-purple-700 dark:text-purple-400";
                          break;
                        case "casual":
                          bgColor = "bg-blue-100 dark:bg-blue-900/30";
                          textColor = "text-blue-700 dark:text-blue-400";
                          break;
                        case "earned":
                          bgColor = "bg-emerald-100 dark:bg-emerald-900/30";
                          textColor = "text-emerald-700 dark:text-emerald-400";
                          break;
                        default:
                          bgColor = "bg-amber-100 dark:bg-amber-900/30";
                          textColor = "text-amber-700 dark:text-amber-400";
                      }
                      leaveLabel = leave.leaveType.substring(0, 3).toUpperCase();
                    } else if (isSunday) {
                      bgColor = "bg-gray-100 dark:bg-gray-800/50";
                      textColor = "text-muted-foreground";
                    }

                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center ${bgColor} ${textColor} ${isToday(day) ? "ring-2 ring-primary" : ""}`}
                      >
                        <span className="text-sm font-medium">{format(day, "d")}</span>
                        {leave && isCurrentMonth && (
                          <span className="text-[8px] mt-0.5 font-medium">{leaveLabel}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 rounded"></span> Casual</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 rounded"></span> Sick</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 rounded"></span> Earned</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 rounded"></span> Other</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary View */}
          <TabsContent value="summary" className="flex-1 overflow-auto">
            <ScrollArea className="h-full">
              <div className="space-y-4 pb-4">
                {/* Leave Balance Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Leave Balance ({yearFilter})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(leaveStats.entitlements).map(([type, entitled]) => {
                        const used = leaveStats.byType[type] || 0;
                        const remaining = leaveStats.remaining[type];
                        const percentage = (used / entitled) * 100;
                        
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize font-medium">{type}</span>
                              <span className="text-muted-foreground">
                                {used} / {entitled} days
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  percentage > 80 ? "bg-red-500" : 
                                  percentage > 50 ? "bg-amber-500" : "bg-green-500"
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {remaining} days remaining
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Monthly Breakdown ({yearFilter})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-2">
                      {monthNames.map((month, idx) => (
                        <div 
                          key={month}
                          className={`text-center p-2 rounded-lg ${
                            leaveStats.monthlyBreakdown[idx] > 0 
                              ? "bg-primary/10 border border-primary/20" 
                              : "bg-muted/50"
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">{month}</p>
                          <p className={`text-lg font-bold ${
                            leaveStats.monthlyBreakdown[idx] > 0 ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {leaveStats.monthlyBreakdown[idx]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Leave Type Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Leave Type Summary ({yearFilter})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(leaveStats.byType).length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No leaves taken this year</p>
                      ) : (
                        Object.entries(leaveStats.byType).map(([type, days]) => (
                          <div 
                            key={type}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className={getLeaveTypeColor(type)}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Badge>
                            </div>
                            <span className="font-semibold">{formatDays(days)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}




