import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  User, 
  Search, 
  Save,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  EyeOff
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

// Admin modules list
const ADMIN_MODULES = [
  { id: "dashboard", name: "Dashboard", url: "/admin/dashboard" },
  { id: "vendors", name: "Vendors", url: "/admin/vendors" },
  { id: "leads", name: "Leads", url: "/admin/leads" },
  { id: "customers", name: "Customers", url: "/admin/customers" },
  { id: "orders", name: "Orders", url: "/admin/orders" },
  { id: "master-data", name: "Master Data", url: "/admin/master-data" },
  { id: "master-services", name: "Master Services", url: "/admin/catalogue" },
  { id: "master-products", name: "Master Products", url: "/admin/products" },
  { id: "greeting-templates", name: "Greeting Templates", url: "/admin/greeting-templates" },
  { id: "settings", name: "Settings", url: "/admin/settings" },
];

type UserWithPermissions = UserType & {
  modulePermissions?: string[];
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Employee creation form state
  const [employeeForm, setEmployeeForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    department: "",
    role: "",
    modulePermissions: [] as string[],
  });

  // Fetch all users with role='employee'
  const { data: employees = [], isLoading } = useQuery<UserWithPermissions[]>({
    queryKey: ["/api/admin/employees"],
    queryFn: async () => {
      const response = await fetch("/api/admin/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: typeof employeeForm) => {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          department: data.department,
          role: data.role,
          modulePermissions: data.modulePermissions,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to create employee (${response.status})`;
        console.error("API error response:", errorData);
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Employee created successfully" });
      setCreateDialogOpen(false);
      resetEmployeeForm();
    },
    onError: (error: Error) => {
      console.error("Create employee error:", error);
      const errorMessage = error.message || "Failed to create employee. Please check the console for details.";
      toast({
        title: "Failed to create employee",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modulePermissions: permissions }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update permissions");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Permissions updated successfully" });
      setSelectedUser(null);
      setSelectedModules([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter employees by search
  const filteredEmployees = employees.filter((emp) =>
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.username.toLowerCase().includes(search.toLowerCase())
  );

  // Handle user selection
  const handleSelectUser = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedModules(user.modulePermissions || []);
  };

  // Toggle module permission
  const toggleModule = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter((id) => id !== moduleId));
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  // Save permissions
  const handleSavePermissions = () => {
    if (!selectedUser) return;
    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: selectedModules,
    });
  };

  // Reset employee form
  const resetEmployeeForm = () => {
    setEmployeeForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      department: "",
      role: "",
      modulePermissions: [],
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Handle create employee
  const handleCreateEmployee = () => {
    // Validation
    if (!employeeForm.username || !employeeForm.email || !employeeForm.password) {
      toast({
        title: "Validation Error",
        description: "Username, email, and password are required",
        variant: "destructive",
      });
      return;
    }

    if (employeeForm.password !== employeeForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (employeeForm.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    createEmployeeMutation.mutate(employeeForm);
  };

  // Toggle module in create form
  const toggleCreateModule = (moduleId: string) => {
    if (employeeForm.modulePermissions.includes(moduleId)) {
      setEmployeeForm({
        ...employeeForm,
        modulePermissions: employeeForm.modulePermissions.filter((id) => id !== moduleId),
      });
    } else {
      setEmployeeForm({
        ...employeeForm,
        modulePermissions: [...employeeForm.modulePermissions, moduleId],
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage role-based access control for your employees
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Employee
        </Button>
      </div>

      {/* Role-Based Access Control Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Role-Based Access Control</CardTitle>
          </div>
          <CardDescription>
            Assign module permissions to employees. Employees can only access modules they have been granted permission to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Employee List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Employee List */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading employees...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {search ? "No employees found" : "No employees available"}
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedUser?.id === employee.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSelectUser(employee)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{(employee as any).name || employee.username}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          {(employee as any).phone && (
                            <p className="text-xs text-muted-foreground mt-1">{(employee as any).phone}</p>
                          )}
                          {((employee as any).department || (employee as any).jobRole) && (
                            <div className="flex gap-2 mt-1">
                              {(employee as any).department && (
                                <Badge variant="outline" className="text-xs">
                                  {(employee as any).department}
                                </Badge>
                              )}
                              {(employee as any).jobRole && (
                                <Badge variant="outline" className="text-xs">
                                  {(employee as any).jobRole}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {employee.modulePermissions && employee.modulePermissions.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {employee.modulePermissions.length} module{employee.modulePermissions.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {selectedUser?.id === employee.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Module Permissions */}
            <div className="space-y-4">
              {selectedUser ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-1">Assign Permissions</h3>
                    <p className="text-sm text-muted-foreground">
                      Select modules that <span className="font-medium">{selectedUser.username}</span> can access
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3 max-h-[500px] overflow-y-auto">
                    {ADMIN_MODULES.map((module) => {
                      const isSelected = selectedModules.includes(module.id);
                      return (
                        <div
                          key={module.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleModule(module.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleModule(module.id)}
                            id={`module-${module.id}`}
                          />
                          <Label
                            htmlFor={`module-${module.id}`}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {module.name}
                          </Label>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={handleSavePermissions}
                      disabled={updatePermissionsMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updatePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedModules([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground">
                  <User className="h-12 w-12 mb-4 opacity-50" />
                  <p className="font-medium mb-1">No employee selected</p>
                  <p className="text-sm">Select an employee from the list to assign module permissions</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee account with login credentials and module permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    placeholder="e.g., Sales, Support, Operations"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Job Role</Label>
                  <Input
                    id="role"
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    placeholder="e.g., Manager, Executive, Analyst"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Login Credentials */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Login Credentials</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={employeeForm.username}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                    placeholder="johndoe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={employeeForm.confirmPassword}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Module Permissions */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Module Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Select modules that this employee can access
                </p>
              </div>
              <div className="border rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {ADMIN_MODULES.map((module) => {
                  const isSelected = employeeForm.modulePermissions.includes(module.id);
                  return (
                    <div
                      key={module.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleCreateModule(module.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCreateModule(module.id)}
                        id={`create-module-${module.id}`}
                      />
                      <Label
                        htmlFor={`create-module-${module.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {module.name}
                      </Label>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetEmployeeForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEmployee}
              disabled={createEmployeeMutation.isPending}
            >
              {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

