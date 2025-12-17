import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Phone, Mail, MapPin, Briefcase, Calendar, 
  IndianRupee, Plus, Edit, Trash2, UserCheck, UserX, Upload, Wallet, ArrowLeft
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { UploadResult } from "@uppy/core";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, insertPayrollSchema, type Employee, type Payroll } from "@shared/schema";
import { z } from "zod";
import { Link, useLocation } from "wouter";


import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const payrollFormSchema = insertPayrollSchema.extend({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export default function VendorEmployees() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [payingSalaryEmployee, setPayingSalaryEmployee] = useState<Employee | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);

  // Fetch vendor's employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Create employee
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeeSchema>) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/employees`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "Employee added successfully" });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add employee", variant: "destructive" });
    },
  });

  // Update employee
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/employees/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "Employee updated successfully" });
      setEditingEmployee(null);
    },
    onError: () => {
      toast({ title: "Failed to update employee", variant: "destructive" });
    },
  });

  // Delete employee
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/employees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "Employee removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove employee", variant: "destructive" });
    },
  });

  // Pay salary (create payroll)
  const paySalaryMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: z.infer<typeof payrollFormSchema> }) => {
      const response = await apiRequest("POST", `/api/employees/${employeeId}/payroll`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Salary payment recorded successfully" });
      setPayingSalaryEmployee(null);
      payrollForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to record salary payment", variant: "destructive" });
    },
  });

  const form = useForm<z.infer<typeof insertEmployeeSchema>>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      vendorId: vendorId,
      name: "",
      email: "",
      phone: "",
      role: "",
      address: null,
      city: null,
      state: null,
      pincode: null,
      department: null,
      employmentType: "full-time",
      shiftStartTime: null,
      shiftEndTime: null,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      basicSalary: 0,
      status: "active",
      permissions: [],
    },
  });

  const payrollForm = useForm<z.infer<typeof payrollFormSchema>>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      vendorId: vendorId,
      employeeId: "",
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

  const filteredEmployees = statusFilter === "all" 
    ? employees 
    : employees.filter(emp => emp.status === statusFilter);

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    inactive: employees.filter(e => e.status === "inactive").length,
    fullTime: employees.filter(e => e.employmentType === "full-time").length,
    partTime: employees.filter(e => e.employmentType === "part-time").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "inactive": return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "terminated": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case "full-time": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "part-time": return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "contract": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const onSubmit = (data: z.infer<typeof insertEmployeeSchema>) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, updates: data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      vendorId: employee.vendorId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      pincode: employee.pincode || "",
      department: employee.department || "",
      employmentType: employee.employmentType,
      shiftStartTime: employee.shiftStartTime || "",
      shiftEndTime: employee.shiftEndTime || "",
      workingDays: employee.workingDays || [],
      basicSalary: employee.basicSalary || 0,
      status: employee.status,
      permissions: employee.permissions,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this employee? This action cannot be undone.")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const toggleStatus = (employee: Employee) => {
    const newStatus = employee.status === "active" ? "inactive" : "active";
    updateEmployeeMutation.mutate({
      id: employee.id,
      updates: { status: newStatus }
    });
  };

  // File upload handlers (simplified - to be implemented)
  const handleGetUploadURL = async () => {
    // Placeholder for file upload functionality
    toast({ title: "File upload feature coming soon", variant: "default" });
    return { method: "PUT" as const, url: "" };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    // Placeholder for upload completion
    console.log("Upload complete:", result);
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
            <h1 className="text-xl font-bold text-foreground">Employees</h1>
            <p className="text-xs text-muted-foreground">Manage your team</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingEmployee(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-employee">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Update employee information" : "Add a new team member to your business"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-name" placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role/Position *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-role" placeholder="Trainer, Coach, Manager, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-email" type="email" placeholder="employee@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-phone" placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea data-testid="input-employee-address" placeholder="Street address" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-city" placeholder="Mumbai" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-state" placeholder="Maharashtra" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-pincode" placeholder="400001" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-department" placeholder="Sales, Operations, etc." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employment-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full-time">Full-Time</SelectItem>
                            <SelectItem value="part-time">Part-Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="shiftStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift Start Time</FormLabel>
                        <FormControl>
                          <Input data-testid="input-shift-start" placeholder="09:00 AM" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shiftEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift End Time</FormLabel>
                        <FormControl>
                          <Input data-testid="input-shift-end" placeholder="06:00 PM" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="basicSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Salary (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-employee-salary" 
                            type="number" 
                            placeholder="30000" 
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-employee-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File upload feature to be implemented */}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-submit-employee" disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}>
                    {createEmployeeMutation.isPending || updateEmployeeMutation.isPending ? "Saving..." : (editingEmployee ? "Update Employee" : "Add Employee")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-lg font-bold text-green-600">{stats.active}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Inactive</p>
            <p className="text-lg font-bold text-gray-600">{stats.inactive}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Full-Time</p>
            <p className="text-lg font-bold text-blue-600">{stats.fullTime}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Part-Time</p>
            <p className="text-lg font-bold text-purple-600">{stats.partTime}</p>
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
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee List */}
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Team Members ({filteredEmployees.length})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredEmployees.length === 0 ? (
            <div className="p-8 text-center border rounded-lg lg:col-span-2">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No employees found</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter === "all" 
                ? "Add your first employee to get started" 
                : `No ${statusFilter} employees`}
            </p>
            {statusFilter === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-employee">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            )}
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div key={employee.id} data-testid={`card-employee-${employee.id}`} className="p-3 sm:p-4 border rounded-lg hover-elevate">
              <div className="flex flex-row items-start justify-between space-y-0 pb-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg" data-testid={`text-employee-name-${employee.id}`}>{employee.name}</h3>
                    <Badge className={getStatusColor(employee.status)} data-testid={`badge-status-${employee.id}`}>
                      {employee.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span data-testid={`text-employee-role-${employee.id}`}>{employee.role}</span>
                    {employee.department && (
                      <>
                        <span>•</span>
                        <span>{employee.department}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge className={getEmploymentTypeColor(employee.employmentType)}>
                  {employee.employmentType}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span data-testid={`text-employee-email-${employee.id}`}>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span data-testid={`text-employee-phone-${employee.id}`}>{employee.phone}</span>
                  </div>
                  {(employee.city || employee.state) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{[employee.city, employee.state].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {employee.joiningDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {format(new Date(employee.joiningDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {(employee.basicSalary || 0) > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IndianRupee className="h-4 w-4" />
                      <span>₹{(employee.basicSalary || 0).toLocaleString('en-IN')}/month</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(employee)}
                      data-testid={`button-edit-${employee.id}`}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleStatus(employee)}
                      data-testid={`button-toggle-status-${employee.id}`}
                      className="flex-1"
                    >
                      {employee.status === "active" ? (
                        <><UserX className="h-4 w-4 mr-1" />Deactivate</>
                      ) : (
                        <><UserCheck className="h-4 w-4 mr-1" />Activate</>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(employee.id)}
                      data-testid={`button-delete-${employee.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setPayingSalaryEmployee(employee);
                      payrollForm.reset({
                        vendorId: vendorId,
                        employeeId: employee.id,
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
                    }}
                    data-testid={`button-pay-salary-${employee.id}`}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    Pay Salary
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pay Salary Dialog */}
      <Dialog open={!!payingSalaryEmployee} onOpenChange={(open) => !open && setPayingSalaryEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Salary - {payingSalaryEmployee?.name}</DialogTitle>
            <DialogDescription>
              Record salary payment for {format(new Date(), 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          <Form {...payrollForm}>
            <form onSubmit={payrollForm.handleSubmit((data) => {
              if (payingSalaryEmployee) {
                paySalaryMutation.mutate({ employeeId: payingSalaryEmployee.id, data });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                        }} data-testid="input-basic-salary" />
                      </FormControl>
                      <FormMessage />
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
                        }} data-testid="input-bonuses" />
                      </FormControl>
                      <FormMessage />
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
                      }} data-testid="input-deductions" />
                    </FormControl>
                    <FormMessage />
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
                      <Input type="number" {...field} readOnly className="bg-muted" data-testid="input-net-salary" />
                    </FormControl>
                    <FormMessage />
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
                      <Textarea placeholder="Payment notes..." {...field} value={field.value || ""} data-testid="textarea-salary-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPayingSalaryEmployee(null)} data-testid="button-cancel-salary">
                  Cancel
                </Button>
                <Button type="submit" disabled={paySalaryMutation.isPending} data-testid="button-submit-salary">
                  {paySalaryMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
