import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Clock, Calendar as CalendarIcon, UserCheck, UserX, 
  ArrowLeft
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";
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

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorAttendance() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"employee" | "customer">("employee");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingTimes, setEditingTimes] = useState<Record<string, string>>({});

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

  // Get time for a person (either editing time or current time)
  const getTimeForPerson = (personId: string) => {
    return editingTimes[personId] || getCurrentTime();
  };

  // Update editing time for a person
  const setTimeForPerson = (personId: string, time: string) => {
    setEditingTimes(prev => ({ ...prev, [personId]: time }));
  };

  // Mark employee attendance
  const markEmployeeAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertAttendanceSchema>) => {
      const response = await apiRequest("POST", `/api/attendance`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/attendance`] });
      toast({ title: "Attendance marked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to mark attendance", variant: "destructive" });
    },
  });

  // Mark customer attendance
  const markCustomerAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerAttendanceSchema>) => {
      const response = await apiRequest("POST", `/api/customer-attendance`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/customer-attendance`] });
      toast({ title: "Customer attendance marked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to mark customer attendance", variant: "destructive" });
    },
  });

  // Mark employee as present/absent
  const markEmployee = (employeeId: string, status: "present" | "absent") => {
    const checkInTime = getTimeForPerson(employeeId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
    markEmployeeAttendanceMutation.mutate({
      vendorId: vendorId,
      employeeId,
      date: today.toISOString(), // Send ISO string (schema accepts and transforms to Date)
      checkInTime,
      status,
    });
  };

  // Mark customer as present/absent
  const markCustomer = (customerId: string, status: "present" | "absent") => {
    const checkInTime = getTimeForPerson(customerId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
    markCustomerAttendanceMutation.mutate({
      vendorId: vendorId,
      customerId,
      date: today.toISOString(), // Send ISO string (schema accepts and transforms to Date)
      checkInTime,
      status,
    });
  };


  // Filter attendance by status
  const filteredEmployeeAttendance = employeeAttendance.filter(a => 
    statusFilter === "all" || a.status === statusFilter
  );

  const filteredCustomerAttendance = customerAttendance.filter(a => 
    statusFilter === "all" || a.status === statusFilter
  );

  // Calculate statistics - compare dates only in local timezone
  const todayStr = format(new Date(), "yyyy-MM-dd"); // Local timezone: "YYYY-MM-DD"
  
  // Get unique employees who have attendance today (regardless of status changes)
  const todayEmployeeAttendance = employeeAttendance.filter(a => {
    if (!a.date) return false;
    try {
      const recordDate = format(new Date(a.date), "yyyy-MM-dd");
      return recordDate === todayStr;
    } catch {
      return false;
    }
  });
  
  // Count unique employees by status (using Map to ensure uniqueness per employee)
  const uniqueEmployeesByStatus = todayEmployeeAttendance.reduce((acc, record) => {
    // Store only the latest record per employee (in case of duplicates)
    acc.set(record.employeeId, record);
    return acc;
  }, new Map());
  
  const employeeStats = {
    total: employees.length,
    present: Array.from(uniqueEmployeesByStatus.values()).filter(a => a.status === "present").length,
    absent: Array.from(uniqueEmployeesByStatus.values()).filter(a => a.status === "absent").length,
  };

  // Get unique customers who have attendance today (regardless of status changes)
  const todayCustomerAttendance = customerAttendance.filter(a => {
    if (!a.date) return false;
    try {
      const recordDate = format(new Date(a.date), "yyyy-MM-dd");
      return recordDate === todayStr;
    } catch {
      return false;
    }
  });
  
  // Count unique customers by status (using Map to ensure uniqueness per customer)
  const uniqueCustomersByStatus = todayCustomerAttendance.reduce((acc, record) => {
    // Store only the latest record per customer (in case of duplicates)
    acc.set(record.customerId, record);
    return acc;
  }, new Map());
  
  const customerStats = {
    total: uniqueCustomersByStatus.size,
    present: Array.from(uniqueCustomersByStatus.values()).filter(a => a.status === "present").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "absent": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "half-day": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "late": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || "Unknown";
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown";
  };

  // Safely format date, handling invalid dates
  const safeFormatDate = (date: Date | string | null | undefined, formatStr: string = "PPP") => {
    if (!date) return "Unknown date";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "Unknown date";
      return format(dateObj, formatStr);
    } catch {
      return "Unknown date";
    }
  };

  // Check if employee attendance is already marked today
  const getEmployeeTodayAttendance = (employeeId: string) => {
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

  // Check if customer attendance is already marked today
  const getCustomerTodayAttendance = (customerId: string) => {
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
            <h1 className="text-xl font-bold">Attendance</h1>
            <p className="text-xs text-muted-foreground">Mark attendance for {format(new Date(), "PPP")}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-employees">{employeeStats.total}</div>
              <p className="text-xs text-muted-foreground">Registered employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-present-today">{employeeStats.present}</div>
              <p className="text-xs text-muted-foreground">Checked in today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-customers">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Visits</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-customer-visits">{customerStats.present}</div>
              <p className="text-xs text-muted-foreground">Checked in today</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Tabs */}
      <div className="px-4 flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "employee" | "customer")} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employee" data-testid="tab-employee-attendance">
              Employee Attendance
            </TabsTrigger>
            <TabsTrigger value="customer" data-testid="tab-customer-attendance">
              Customer Attendance
            </TabsTrigger>
          </TabsList>

        <TabsContent value="employee" className="space-y-4 flex-1 overflow-y-auto">
          {/* Mark Employee Attendance Section */}
          <Card>
            <CardHeader>
              <CardTitle>Mark Employee Attendance</CardTitle>
              <CardDescription>Mark attendance for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <div className="space-y-2">
                  {employees.map(employee => {
                    const todayAttendance = getEmployeeTodayAttendance(employee.id);
                    const isPresent = todayAttendance?.status === "present";
                    const isAbsent = todayAttendance?.status === "absent";
                    
                    return (
                      <div key={employee.id} className={`flex items-center justify-between gap-4 p-3 border rounded-lg transition-colors ${
                        isPresent ? 'bg-green-50 border-green-200' : isAbsent ? 'bg-red-50 border-red-200' : 'hover:bg-muted/50'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium" data-testid={`text-employee-${employee.id}`}>{employee.name}</p>
                            {todayAttendance && (
                              <Badge className={getStatusColor(todayAttendance.status)}>
                                {todayAttendance.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{employee.role}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={getTimeForPerson(employee.id)}
                              onChange={(e) => setTimeForPerson(employee.id, e.target.value)}
                              className="w-28"
                              data-testid={`input-time-${employee.id}`}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant={isPresent ? "default" : "outline"}
                            onClick={() => markEmployee(employee.id, "present")}
                            disabled={markEmployeeAttendanceMutation.isPending}
                            data-testid={`button-present-${employee.id}`}
                            className={isPresent ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={isAbsent ? "destructive" : "outline"}
                            onClick={() => markEmployee(employee.id, "absent")}
                            disabled={markEmployeeAttendanceMutation.isPending}
                            data-testid={`button-absent-${employee.id}`}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No employees found. Add employees first.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Attendance Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Attendance Records</CardTitle>
                  <CardDescription>View employee attendance history</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployeeAttendance ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredEmployeeAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmployeeAttendance.map((attendance) => (
                    <div 
                      key={attendance.id} 
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`attendance-record-${attendance.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-employee-name-${attendance.id}`}>
                              {getEmployeeName(attendance.employeeId)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {safeFormatDate(attendance.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {attendance.checkInTime}
                            {attendance.checkOutTime && ` - ${attendance.checkOutTime}`}
                          </p>
                          {attendance.notes && (
                            <p className="text-xs text-muted-foreground">{attendance.notes}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(attendance.status)}>
                          {attendance.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4 flex-1 overflow-y-auto">
          {/* Mark Customer Attendance Section */}
          <Card>
            <CardHeader>
              <CardTitle>Mark Customer Attendance</CardTitle>
              <CardDescription>Mark attendance for all customers</CardDescription>
            </CardHeader>
            <CardContent>
              {customers.length > 0 ? (
                <div className="space-y-2">
                  {customers.map(customer => {
                    const todayAttendance = getCustomerTodayAttendance(customer.id);
                    const isPresent = todayAttendance?.status === "present";
                    const isAbsent = todayAttendance?.status === "absent";
                    
                    return (
                      <div key={customer.id} className={`flex items-center justify-between gap-4 p-3 border rounded-lg transition-colors ${
                        isPresent ? 'bg-green-50 border-green-200' : isAbsent ? 'bg-red-50 border-red-200' : 'hover:bg-muted/50'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium" data-testid={`text-customer-${customer.id}`}>{customer.name}</p>
                            {todayAttendance && (
                              <Badge className={getStatusColor(todayAttendance.status)}>
                                {todayAttendance.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={getTimeForPerson(customer.id)}
                              onChange={(e) => setTimeForPerson(customer.id, e.target.value)}
                              className="w-28"
                              data-testid={`input-time-customer-${customer.id}`}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant={isPresent ? "default" : "outline"}
                            onClick={() => markCustomer(customer.id, "present")}
                            disabled={markCustomerAttendanceMutation.isPending}
                            data-testid={`button-present-customer-${customer.id}`}
                            className={isPresent ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={isAbsent ? "destructive" : "outline"}
                            onClick={() => markCustomer(customer.id, "absent")}
                            disabled={markCustomerAttendanceMutation.isPending}
                            data-testid={`button-absent-customer-${customer.id}`}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No customers found. Add customers first.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Attendance Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customer Attendance Records</CardTitle>
                  <CardDescription>View customer visit history</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-customer-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCustomerAttendance ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredCustomerAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customer attendance records found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomerAttendance.map((attendance) => (
                    <div 
                      key={attendance.id} 
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`customer-attendance-record-${attendance.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-customer-name-${attendance.id}`}>
                              {getCustomerName(attendance.customerId)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {safeFormatDate(attendance.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {attendance.checkInTime}
                            {attendance.checkOutTime && ` - ${attendance.checkOutTime}`}
                          </p>
                          {attendance.notes && (
                            <p className="text-xs text-muted-foreground">{attendance.notes}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(attendance.status)}>
                          {attendance.status}
                        </Badge>
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
    </div>
  );
}
