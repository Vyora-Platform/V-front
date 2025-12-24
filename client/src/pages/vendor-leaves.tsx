import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, ArrowLeft, User, Eye, ChevronRight, 
  Filter, Search, TrendingUp, CheckCircle, XCircle, Clock
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertLeaveSchema,
  type Leave,
  type Employee,
  type LeaveBalance
} from "@shared/schema";
import type { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorLeaves() {
  const { vendorId, userId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"employees" | "all">("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Fetch leaves
  const { data: leaves = [], isLoading } = useQuery<Leave[]>({
    queryKey: [`/api/vendors/${vendorId}/leaves`],
    enabled: !!vendorId,
  });

  // Mark leave for employee
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertLeaveSchema>) => {
      const response = await apiRequest("POST", `/api/leaves`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/leaves`] });
      toast({ title: "Leave marked successfully" });
      setIsApplyDialogOpen(false);
      setSelectedEmployeeId("");
      form.reset({
        vendorId: vendorId,
        employeeId: "",
        leaveType: "casual",
        startDate: new Date(),
        endDate: new Date(),
        numberOfDays: 1,
        durationType: "full",
        reason: "",
        status: "approved",
      });
    },
    onError: () => {
      toast({ title: "Failed to mark leave", variant: "destructive" });
    },
  });

  // Open dialog for specific employee
  const openMarkLeaveDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    form.setValue("employeeId", employeeId);
    setIsApplyDialogOpen(true);
  };

  const [leaveDuration, setLeaveDuration] = useState<"full" | "half" | "quarter">("full");

  const form = useForm<z.infer<typeof insertLeaveSchema>>({
    resolver: zodResolver(insertLeaveSchema),
    defaultValues: {
      vendorId: vendorId,
      employeeId: "",
      leaveType: "casual",
      startDate: new Date(),
      endDate: new Date(),
      numberOfDays: 1,
      durationType: "full",
      reason: "",
      status: "approved", // Auto-approve since vendor is marking it
    },
  });

  const handleSubmit = (data: z.infer<typeof insertLeaveSchema>) => {
    // Calculate number of days based on date range and duration
    const dateRangeDays = differenceInDays(new Date(data.endDate), new Date(data.startDate)) + 1;
    
    // Apply duration multiplier (1 for full, 0.5 for half, 0.25 for quarter)
    const durationMultiplier = leaveDuration === "full" ? 1 : leaveDuration === "half" ? 0.5 : 0.25;
    const totalDays = dateRangeDays * durationMultiplier;
    
    applyLeaveMutation.mutate({ 
      ...data, 
      numberOfDays: totalDays,
      durationType: leaveDuration, // Store duration type for display
      status: "approved", // Auto-approve since vendor is marking it
      approvedBy: userId, // Set vendor as approver
      approvedAt: new Date() // Set approval timestamp
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "approved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "casual": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "sick": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "earned": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "paid": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "maternity": return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      case "paternity": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || "Unknown";
  };

  const formatLeaveDays = (days: string | number, durationType?: string) => {
    const numDays = typeof days === 'string' ? parseFloat(days) : days;
    
    // If duration type is provided, use it for display
    if (durationType) {
      const durationLabel = durationType === "quarter" ? "Quarter Day" : durationType === "half" ? "Half Day" : "Full Day";
      if (numDays === 1) return `1 day (${durationLabel})`;
      return `${numDays} days (${durationLabel} per day)`;
    }
    
    // Fallback to number-based formatting
    if (numDays === 0.25) return "0.25 days (Quarter Day)";
    if (numDays === 0.5) return "0.5 days (Half Day)";
    if (numDays === 1) return "1 day";
    if (numDays % 1 === 0) return `${numDays} days`;
    return `${numDays} days`;
  };

  // Calculate leave stats
  const leaveStats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === "approved").length,
    pending: leaves.filter(l => l.status === "pending").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    totalDays: leaves.filter(l => l.status === "approved").reduce((sum, l) => {
      const days = typeof l.numberOfDays === 'string' ? parseFloat(l.numberOfDays) : l.numberOfDays;
      return sum + days;
    }, 0)
  };

  // Filtered employees for search
  const filteredEmployees = employees.filter(e => {
    if (!searchQuery) return true;
    return e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (e.phone && e.phone.includes(searchQuery));
  });

  // Filtered leaves for All Leaves tab
  const filteredLeaves = leaves.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (typeFilter !== "all" && l.leaveType !== typeFilter) return false;
    if (searchQuery) {
      const empName = getEmployeeName(l.employeeId);
      return empName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b flex items-center justify-between gap-3 sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0 h-9 w-9"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold">Leaves</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Manage employee leaves</p>
          </div>
        </div>
      </div>

      {/* Mark Leave Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Leave for {selectedEmployeeId ? getEmployeeName(selectedEmployeeId) : "Employee"}</DialogTitle>
            <DialogDescription>
              Grant leave to the employee. The leave will be automatically approved.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-leave-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="earned">Earned Leave</SelectItem>
                        <SelectItem value="paid">Paid Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" data-testid="button-select-start-date">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" data-testid="button-select-end-date">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Leave Duration</FormLabel>
                <Select value={leaveDuration} onValueChange={(value: "full" | "half" | "quarter") => setLeaveDuration(value)}>
                  <SelectTrigger data-testid="select-leave-duration" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Day</SelectItem>
                    <SelectItem value="half">Half Day</SelectItem>
                    <SelectItem value="quarter">Quarter Day</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {leaveDuration === "full" && "Full day leave (1 day per day)"}
                  {leaveDuration === "half" && "Half day leave (0.5 days per day)"}
                  {leaveDuration === "quarter" && "Quarter day leave (0.25 days per day)"}
                </p>
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Explain the reason for leave..." 
                        data-testid="input-leave-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={applyLeaveMutation.isPending}
                  data-testid="button-submit-leave"
                >
                  {applyLeaveMutation.isPending ? "Marking..." : "Mark Leave"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Leave Tabs */}
      <div className="px-4 md:px-6 py-4 flex-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "employees" | "all")} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-[var(--input-h)]">
            <TabsTrigger value="employees" className="text-sm" data-testid="tab-employees">
              Employees ({employees.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm" data-testid="tab-all-leaves">
              All Leaves ({leaves.length})
            </TabsTrigger>
          </TabsList>

          {/* Employee Cards Tab */}
          <TabsContent value="employees" className="space-y-4">
            {/* Stats Cards */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 min-w-max">
                <Card className="p-3 min-w-[100px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{leaveStats.total}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 rounded-xl">
                  <div className="text-center">
                    <CheckCircle className="h-4 w-4 mx-auto mb-0.5 text-green-600" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{leaveStats.approved}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[100px] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto mb-0.5 text-amber-600" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{leaveStats.pending}</p>
                  </div>
                </Card>
                <Card className="p-3 min-w-[110px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="text-center">
                    <TrendingUp className="h-4 w-4 mx-auto mb-0.5 text-purple-600" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days Used</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{leaveStats.totalDays.toFixed(1)}</p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-[var(--input-h)] text-sm"
              />
            </div>

            <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All Employees</CardTitle>
              <CardDescription>
                Select an employee to mark leave or view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {employees.length === 0 ? "No employees found" : "No matching employees"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredEmployees.map((employee) => {
                    // Calculate employee's leave stats
                    const employeeLeaves = leaves.filter(l => l.employeeId === employee.id);
                    const approvedLeaves = employeeLeaves.filter(l => l.status === "approved");
                    const totalLeaveDays = approvedLeaves.reduce((sum, l) => {
                      const days = typeof l.numberOfDays === 'string' ? parseFloat(l.numberOfDays) : l.numberOfDays;
                      return sum + days;
                    }, 0);

                    return (
                      <Card key={employee.id} className="hover-elevate overflow-hidden rounded-xl min-h-[var(--card-min-h)]">
                        <CardContent className="p-3 md:p-4">
                          <div 
                            className="flex items-start justify-between cursor-pointer"
                            onClick={() => setLocation(`/vendor/leaves/${employee.id}`)}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                                <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm md:text-base">{employee.name}</p>
                                <p className="text-xs md:text-sm text-muted-foreground truncate">{employee.role || "Employee"}</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className="text-muted-foreground">
                                    <strong>{employeeLeaves.length}</strong> leaves
                                  </span>
                                  <span className="text-muted-foreground">
                                    <strong>{totalLeaveDays.toFixed(1)}</strong> days taken
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              className="flex-1 h-9 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMarkLeaveDialog(employee.id);
                              }}
                              data-testid={`button-mark-leave-${employee.id}`}
                            >
                              <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Mark Leave
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0"
                              onClick={() => setLocation(`/vendor/leaves/${employee.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Leaves Tab */}
          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-[var(--input-h)] text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] h-[var(--input-h)] text-sm flex-shrink-0">
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
                <SelectTrigger className="w-[110px] h-[var(--input-h)] text-sm flex-shrink-0">
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

            <Card className="rounded-xl">
              <CardHeader className="pb-2 p-3 md:p-4">
                <CardTitle className="text-sm md:text-base">All Leaves</CardTitle>
                <CardDescription className="text-xs">
                  {filteredLeaves.length} leave records found
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leaves found matching your filters
                </div>
              ) : (
                  <ScrollArea className="h-[400px] md:h-[500px]">
                    <div className="space-y-3 pr-4">
                      {filteredLeaves.map((leave) => (
                        <Card 
                          key={leave.id} 
                          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow rounded-xl"
                          onClick={() => setLocation(`/vendor/leaves/${leave.employeeId}`)}
                          data-testid={`leave-request-${leave.id}`}
                        >
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <p className="font-semibold text-sm md:text-base" data-testid={`text-leave-employee-${leave.id}`}>
                                    {getEmployeeName(leave.employeeId)}
                                  </p>
                                  <Badge className={`${getLeaveTypeColor(leave.leaveType)} text-xs`}>
                                    {leave.leaveType}
                                  </Badge>
                                  <Badge className={`${getStatusColor(leave.status)} text-xs`}>
                                    {leave.status}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-1">
                                  <span>
                                    {format(new Date(leave.startDate), "MMM d, yyyy")} 
                                    {format(new Date(leave.startDate), "yyyy-MM-dd") !== format(new Date(leave.endDate), "yyyy-MM-dd") && (
                                      <span> — {format(new Date(leave.endDate), "MMM d, yyyy")}</span>
                                    )}
                                  </span>
                                  <span className="font-medium">({formatLeaveDays(leave.numberOfDays, leave.durationType)})</span>
                                </div>
                                {leave.reason && (
                                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{leave.reason}</p>
                                )}
                                {leave.approvedAt && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                    Marked on {format(new Date(leave.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
