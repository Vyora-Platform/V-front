import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, ArrowLeft, User
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

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorLeaves() {
  const { vendorId, userId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"employees" | "all">("employees");

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
            <h1 className="text-xl font-bold">Leaves</h1>
            <p className="text-xs text-muted-foreground">Manage employee leaves</p>
          </div>
        </div>
      </div>

      {/* Mark Leave Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-md">
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "employees" | "all")} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees" data-testid="tab-employees">
            Employees ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-leaves">
            All Leaves ({leaves.length})
          </TabsTrigger>
        </TabsList>

        {/* Employee Cards Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Employees</CardTitle>
              <CardDescription>
                Select an employee to mark their leave
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No employees found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => {
                    // Calculate employee's leave stats
                    const employeeLeaves = leaves.filter(l => l.employeeId === employee.id);
                    const approvedLeaves = employeeLeaves.filter(l => l.status === "approved");
                    const totalLeaveDays = approvedLeaves.reduce((sum, l) => {
                      const days = typeof l.numberOfDays === 'string' ? parseFloat(l.numberOfDays) : l.numberOfDays;
                      return sum + days;
                    }, 0);

                    return (
                      <Card key={employee.id} className="hover-elevate">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 rounded-full bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{employee.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{employee.position || "Employee"}</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className="text-muted-foreground">
                                    <strong>{employeeLeaves.length}</strong> leaves
                                  </span>
                                  <span className="text-muted-foreground">
                                    <strong>{totalLeaveDays.toFixed(1)}</strong> days taken
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={() => openMarkLeaveDialog(employee.id)}
                            data-testid={`button-mark-leave-${employee.id}`}
                          >
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Mark Leave
                          </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>All Leaves</CardTitle>
              <CardDescription>
                View all employee leaves marked by the vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : leaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leaves found
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map((leave) => (
                    <div 
                      key={leave.id} 
                      className="flex items-start justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`leave-request-${leave.id}`}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="font-medium" data-testid={`text-leave-employee-${leave.id}`}>
                            {getEmployeeName(leave.employeeId)}
                          </p>
                          <Badge className={getLeaveTypeColor(leave.leaveType)}>
                            {leave.leaveType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(leave.startDate), "PPP")} - {format(new Date(leave.endDate), "PPP")}
                          </span>
                          <span>({formatLeaveDays(leave.numberOfDays, leave.durationType)})</span>
                        </div>
                        <p className="text-sm">{leave.reason}</p>
                        {leave.approvedAt && (
                          <p className="text-xs text-muted-foreground">
                            Marked on {format(new Date(leave.approvedAt), "PPP")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
