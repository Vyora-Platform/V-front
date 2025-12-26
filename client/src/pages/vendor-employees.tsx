import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, insertPayrollSchema, type Employee, type Payroll } from "@shared/schema";
import { z } from "zod";
import {
  Users, Phone, Mail, MapPin, Briefcase, Calendar, Plus, Edit2, Trash2,
  UserCheck, UserX, Wallet, ArrowLeft, Search, RefreshCw, Eye,
  MoreHorizontal, Clock, Building2, Award, FileText, Timer, Activity,
  CalendarDays, DollarSign, AlertTriangle, CheckCircle2, Crown, Target, ChevronRight
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { format, formatDistanceToNow, differenceInDays, isPast } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

const payrollFormSchema = insertPayrollSchema.extend({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export default function VendorEmployees() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [payingSalaryEmployee, setPayingSalaryEmployee] = useState<Employee | null>(null);
  
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

  // Fetch employees
  const { data: employees = [], isLoading, refetch } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Fetch attendance for all employees
  const { data: allAttendance = [] } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'attendance'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/attendance`), {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch leads to check assigned leads
  const { data: allLeads = [] } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'leads'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/leads`), {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeeSchema>) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/employees`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add employee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "✅ Employee added" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to add employee", variant: "destructive" });
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/employees/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "✅ Employee updated" });
      setEditingEmployee(null);
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update employee", variant: "destructive" });
    },
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/employees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "Employee removed" });
    },
  });

  // Pay salary mutation
  const paySalaryMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      const response = await apiRequest("POST", `/api/employees/${employeeId}/payroll`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "✅ Salary payment recorded" });
      setPayingSalaryEmployee(null);
      payrollForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to record salary", variant: "destructive" });
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/employees/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/employees`] });
      toast({ title: "Status updated" });
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

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Attendance map by employee
  const attendanceMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    allAttendance.forEach((record: any) => {
      if (record.employeeId) {
        if (!map[record.employeeId]) {
          map[record.employeeId] = [];
        }
        map[record.employeeId].push(record);
      }
    });
    return map;
  }, [allAttendance]);

  // Leads assigned map by employee
  const leadsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    allLeads.forEach((lead: any) => {
      if (lead.assignedEmployeeId) {
        if (!map[lead.assignedEmployeeId]) {
          map[lead.assignedEmployeeId] = [];
        }
        map[lead.assignedEmployeeId].push(lead);
      }
    });
    return map;
  }, [allLeads]);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp =>
        emp.name.toLowerCase().includes(query) ||
        emp.phone.includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.role.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(emp => emp.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      result = result.filter(emp => emp.department === departmentFilter);
    }

    // Employment type filter
    if (employmentTypeFilter !== "all") {
      result = result.filter(emp => emp.employmentType === employmentTypeFilter);
    }

    // Sort
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "salary") {
      result.sort((a, b) => (b.basicSalary || 0) - (a.basicSalary || 0));
    } else if (sortBy === "joining") {
      result.sort((a, b) => new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime());
    }

    return result;
  }, [employees, searchQuery, statusFilter, departmentFilter, employmentTypeFilter, sortBy]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === "active").length;
    const inactive = employees.filter(e => e.status === "inactive").length;
    const onboarding = employees.filter(e => e.status === "onboarding").length;
    const fullTime = employees.filter(e => e.employmentType === "full-time").length;
    const partTime = employees.filter(e => e.employmentType === "part-time").length;
    const contract = employees.filter(e => e.employmentType === "contract").length;
    const totalSalary = employees.reduce((sum, e) => sum + (e.basicSalary || 0), 0);

    return { total, active, inactive, onboarding, fullTime, partTime, contract, totalSalary };
  }, [employees]);

  if (!vendorId) { return <LoadingSpinner />; }

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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (employee: Employee) => {
    setLocation(`/vendor/employees/${employee.id}`);
  };

  const onSubmit = (data: z.infer<typeof insertEmployeeSchema>) => {
    // Clean up empty strings to null for optional fields
    const cleanedData = {
      ...data,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      department: data.department || null,
      shiftStartTime: data.shiftStartTime || null,
      shiftEndTime: data.shiftEndTime || null,
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankIfscCode: data.bankIfscCode || null,
      idProofType: data.idProofType || null,
      idProofNumber: data.idProofNumber || null,
    };
    
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, updates: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
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
      "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;

    return (
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  // Status badge component
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
      <Badge className={`${c.bg} ${c.text} border-0 gap-1 font-medium text-xs`}>
        {c.icon}
        {displayStatus}
      </Badge>
    );
  };

  // Employment type badge
  const TypeBadge = ({ type }: { type: string }) => {
    const config: Record<string, { bg: string; text: string }> = {
      "full-time": { bg: "bg-blue-100", text: "text-blue-700" },
      "part-time": { bg: "bg-purple-100", text: "text-purple-700" },
      "contract": { bg: "bg-orange-100", text: "text-orange-700" },
    };
    const c = config[type] || config["full-time"];
    return (
      <Badge className={`${c.bg} ${c.text} border-0 text-xs`}>
        {type.replace("-", " ")}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-full w-full flex-col bg-gray-50/50 dark:bg-background">
      {/* Header - Fixed */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-white dark:bg-card border-b shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="h-10 w-10 shrink-0 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 hidden md:block" />
              <h1 className="text-xl md:text-2xl font-bold">Employees</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-10 w-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingEmployee(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 h-10 px-4"
                  onClick={(e) => {
                    if (!isPro) {
                      e.preventDefault();
                      handleProAction('create', () => {});
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Add Employee</span>
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed inset-0 w-full h-full max-w-full max-h-full overflow-hidden rounded-none p-0 bg-gray-50 dark:bg-background translate-x-0 translate-y-0 left-0 top-0 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-2xl sm:max-h-[90vh] sm:rounded-xl sm:h-auto">
                {/* Container */}
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Sticky Header */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-card border-b px-4 py-3 sm:px-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="flex-shrink-0 h-9 w-9"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <DialogHeader className="p-0 space-y-0 flex-1">
                        <DialogTitle className="flex items-center gap-2">
                          {editingEmployee ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                          {editingEmployee ? "Edit Employee" : "Add Employee"}
                        </DialogTitle>
                      </DialogHeader>
                    </div>
                  </div>
                  
                  {/* Form Container - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    <EmployeeForm
                      form={form}
                      onSubmit={onSubmit}
                      isPending={createMutation.isPending || updateMutation.isPending}
                      isEditing={!!editingEmployee}
                      onCancel={() => setIsAddDialogOpen(false)}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1">
        {/* Stats Dashboard - Horizontal Scroll on Mobile */}
        <div className="px-4 md:px-6 py-4 bg-white dark:bg-card border-b max-w-[1440px] mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-8 scrollbar-hide">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-medium">Active</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.active}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/20 dark:to-gray-600/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Inactive</p>
              <p className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.inactive}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-cyan-600 dark:text-cyan-400 font-medium">Onboarding</p>
              <p className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.onboarding}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 font-medium">Full-Time</p>
              <p className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.fullTime}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium">Part-Time</p>
              <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.partTime}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400 font-medium">Contract</p>
              <p className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.contract}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-rose-600 dark:text-rose-400 font-medium">Payroll</p>
              <p className="text-xl md:text-2xl font-bold text-rose-700 dark:text-rose-300">₹{(stats.totalSalary / 1000).toFixed(0)}k</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-muted/30 rounded-xl">
            <div className="flex gap-1 h-2.5 md:h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-muted">
              <div className="bg-emerald-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }} />
              <div className="bg-gray-400 transition-all" style={{ width: `${stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}%` }} />
              <div className="bg-cyan-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.onboarding / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-card border-b sticky top-[60px] md:top-[72px] z-10 space-y-3 max-w-[1440px] mx-auto">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-muted/50"
            />
          </div>

          {/* Filters Row - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="ex-employee">Ex-Employee</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-Time</SelectItem>
                <SelectItem value="part-time">Part-Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>

            {departments.length > 0 && (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[120px] md:w-[140px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="joining">Joining</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employee List */}
        <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto">
          <p className="text-xs text-muted-foreground mb-3">{filteredEmployees.length} employees</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground text-sm text-center">
                  {searchQuery ? "No employees found" : "No employees yet"}
                </p>
                <Button 
                  onClick={() => handleProAction('create', () => setIsAddDialogOpen(true))} 
                  size="sm" 
                  className="mt-4 bg-blue-600 h-10 px-5"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Employee
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={(status) => statusMutation.mutate({ id: employee.id, status })}
                  onViewDetails={handleViewDetails}
                  onPaySalary={() => {
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
                  Avatar={Avatar}
                  StatusBadge={StatusBadge}
                  TypeBadge={TypeBadge}
                  attendance={attendanceMap[employee.id] || []}
                  assignedLeads={leadsMap[employee.id] || []}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pay Salary Dialog */}
      <Dialog open={!!payingSalaryEmployee} onOpenChange={(open) => !open && setPayingSalaryEmployee(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Pay Salary - {payingSalaryEmployee?.name}
            </DialogTitle>
            <DialogDescription>
              Record salary payment for {format(new Date(), 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          <Form {...payrollForm}>
            <form onSubmit={payrollForm.handleSubmit((data) => {
              if (!isPro) {
                setBlockedAction('save');
                setShowUpgradeModal(true);
                return;
              }
              if (payingSalaryEmployee) {
                paySalaryMutation.mutate({ employeeId: payingSalaryEmployee.id, data });
              }
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
                <Button type="button" variant="outline" onClick={() => setPayingSalaryEmployee(null)}>
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

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
      />
    </div>
  );
}

// Employee Card Component
function EmployeeCard({
  employee,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
  onPaySalary,
  Avatar,
  StatusBadge,
  TypeBadge,
  attendance,
  assignedLeads,
}: {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (status: string) => void;
  onViewDetails: (employee: Employee) => void;
  onPaySalary: () => void;
  Avatar: any;
  StatusBadge: any;
  TypeBadge: any;
  attendance: any[];
  assignedLeads: any[];
}) {
  const joiningDate = employee.joiningDate ? new Date(employee.joiningDate) : new Date(employee.createdAt);
  const tenure = formatDistanceToNow(joiningDate, { addSuffix: false });

  // Get present days this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const presentDays = attendance.filter((a: any) => {
    const date = new Date(a.date || a.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear && a.status === 'present';
  }).length;

  // Build address
  const addressParts = [];
  if (employee.city) addressParts.push(employee.city);
  if (employee.state) addressParts.push(employee.state);
  const address = addressParts.join(', ');

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          <Avatar name={employee.name} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{employee.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <StatusBadge status={employee.status} />
                  <TypeBadge type={employee.employmentType} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{tenure}</span>
            </div>

            {/* Role & Department */}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4 text-muted-foreground/70" />
              <span>{employee.role}</span>
              {employee.department && (
                <>
                  <span>•</span>
                  <span>{employee.department}</span>
                </>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-3 space-y-1.5">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground/70" />
                {employee.phone}
              </p>
              {employee.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                  <Mail className="h-4 w-4 text-muted-foreground/70" />
                  <span className="truncate">{employee.email}</span>
                </p>
              )}
              {address && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground/70" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-2 mt-3">
              {(employee.basicSalary || 0) > 0 && (
                <span className="text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-400">
                  ₹{(employee.basicSalary || 0).toLocaleString()}/mo
                </span>
              )}
              {employee.shiftStartTime && employee.shiftEndTime && (
                <span className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg text-blue-700 dark:text-blue-400">
                  <Clock className="h-3 w-3" />
                  {employee.shiftStartTime} - {employee.shiftEndTime}
                </span>
              )}
              <span className="text-xs flex items-center gap-1 bg-gray-50 dark:bg-gray-700/30 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400">
                <CalendarDays className="h-3 w-3" />
                {presentDays} days present
              </span>
              {assignedLeads.length > 0 && (
                <span className="text-xs flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-400">
                  <Target className="h-3 w-3" />
                  {assignedLeads.length} leads
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Inside Card */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${employee.phone}`, '_self');
            }}
            className="flex-1 h-10 text-sm"
          >
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="ml-1.5 hidden sm:inline">Call</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://wa.me/${employee.phone.replace(/[^0-9]/g, '')}`, '_blank');
            }}
            className="flex-1 h-10 text-sm"
          >
            <FaWhatsapp className="h-4 w-4 text-green-600" />
            <span className="ml-1.5 hidden sm:inline">WhatsApp</span>
          </Button>
          {employee.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${employee.email}`, '_blank');
              }}
              className="flex-1 h-10 text-sm"
            >
              <Mail className="h-4 w-4 text-purple-600" />
              <span className="ml-1.5 hidden sm:inline">Mail</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(employee);
            }}
            className="flex-1 h-10 text-sm"
          >
            <Eye className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">View</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(employee)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPaySalary}>
                <Wallet className="h-4 w-4 mr-2 text-emerald-600" />
                Pay Salary
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange("active")}>
                <UserCheck className="h-4 w-4 mr-2 text-emerald-600" />
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("inactive")}>
                <UserX className="h-4 w-4 mr-2 text-gray-600" />
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("onboarding")}>
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Onboarding
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("ex-employee")}>
                <UserX className="h-4 w-4 mr-2 text-orange-600" />
                Ex-Employee
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(employee.id, employee.name)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Employee Form Component with Multi-step
function EmployeeForm({
  form,
  onSubmit,
  isPending,
  isEditing,
  onCancel,
}: {
  form: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
  isEditing: boolean;
  onCancel: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [shiftStartPeriod, setShiftStartPeriod] = useState<string>(form.getValues("shiftStartPeriod") || "AM");
  const [shiftEndPeriod, setShiftEndPeriod] = useState<string>(form.getValues("shiftEndPeriod") || "PM");
  
  const steps = [
    { id: "basic", title: "Basic Info", description: "Personal details" },
    { id: "job", title: "Job Details", description: "Role and schedule" },
    { id: "salary", title: "Salary", description: "Compensation details" },
    { id: "docs", title: "Documents", description: "ID proofs" },
  ];

  const validateCurrentStep = () => {
    const values = form.getValues();
    switch (currentStep) {
      case 0: // Basic
        return values.name && values.phone && values.email;
      case 1: // Job
        return values.role;
      case 2: // Salary
        return true; // Salary is optional
      case 3: // Docs
        return true; // Docs are optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = (data: any) => {
    // Add the shift periods to the data
    onSubmit({
      ...data,
      shiftStartPeriod,
      shiftEndPeriod,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 w-full">
        {/* Step Indicator - Card Style */}
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      index < currentStep 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
                        : index === currentStep 
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}
                  >
                    {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${index === currentStep ? "text-blue-600" : index < currentStep ? "text-green-600" : "text-gray-400"}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 lg:w-24 h-1 mx-1 sm:mx-3 rounded-full -mt-6 ${index < currentStep ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Card Style */}
        <div>
          <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-4 sm:p-6">
          {currentStep === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
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
                      <Textarea placeholder="Full address" {...field} value={field.value || ""} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} value={field.value || ""} />
                      </FormControl>
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
                        <Input placeholder="State" {...field} value={field.value || ""} />
                      </FormControl>
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
                        <Input placeholder="123456" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold">Job Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <FormControl>
                        <Input placeholder="Manager, Trainer..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Sales, Operations..." {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-Time</SelectItem>
                          <SelectItem value="part-time">Part-Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="ex-employee">Ex-Employee</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Shift Time with AM/PM */}
              <div className="p-4 bg-gray-50 dark:bg-muted/30 rounded-xl space-y-3">
                <p className="text-sm font-medium">Shift Timing</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel className="text-xs">Shift Start</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="shiftStartTime"
                        render={({ field }) => (
                          <FormControl>
                            <Input 
                              type="time" 
                              placeholder="09:00" 
                              {...field} 
                              value={field.value || ""} 
                              className="flex-1"
                            />
                          </FormControl>
                        )}
                      />
                      <Select value={shiftStartPeriod} onValueChange={setShiftStartPeriod}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FormLabel className="text-xs">Shift End</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="shiftEndTime"
                        render={({ field }) => (
                          <FormControl>
                            <Input 
                              type="time" 
                              placeholder="06:00" 
                              {...field} 
                              value={field.value || ""} 
                              className="flex-1"
                            />
                          </FormControl>
                        )}
                      />
                      <Select value={shiftEndPeriod} onValueChange={setShiftEndPeriod}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Days Per Month */}
              <FormField
                control={form.control}
                name="workDaysPerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Days Per Month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of work days"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Number of days employee is expected to work per month</p>
                  </FormItem>
                )}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold">Salary Details</h3>
              </div>
              <FormField
                control={form.control}
                name="basicSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Salary (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter monthly salary"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="p-4 bg-gray-50 dark:bg-muted/30 rounded-xl space-y-3">
                <p className="text-sm font-medium">Bank Details (Optional)</p>
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="HDFC Bank" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankIfscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="HDFC0001234" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">Documents</h3>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-muted/30 rounded-xl space-y-3">
                <p className="text-sm font-medium">ID Proof Details</p>
                <FormField
                  control={form.control}
                  name="idProofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">ID Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aadhar">Aadhar Card</SelectItem>
                          <SelectItem value="pan">PAN Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="driving_license">Driving License</SelectItem>
                          <SelectItem value="voter_id">Voter ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idProofNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ID number" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center py-2">Document uploads can be added from employee profile</p>
            </div>
          )}
          </div>
        </div>

        {/* Footer with Navigation - Card Style */}
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-4 sticky bottom-0">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-12 text-base font-medium">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep === 0 && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 text-base font-medium">
                Cancel
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={handleNext} 
                className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
                disabled={!validateCurrentStep()}
              >
                Save & Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isPending} 
                className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
              >
                {isPending ? "Saving..." : isEditing ? "Update Employee" : "Add Employee"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

