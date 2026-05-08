import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Bell, Calendar, Flag, Tag, Trash2, Edit, ArrowLeft, 
  MoreVertical, Search, CheckCircle2, Clock, AlertTriangle,
  ListTodo, Target, User, Users, Truck, MessageCircle, Share2,
  ChevronRight, X, Check, CalendarDays, Timer, Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import type { Task, Employee, Customer, Supplier } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorTasks() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/vendors/${vendorId}/tasks`],
    enabled: !!vendorId,
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Fetch customers for sharing
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  // Fetch suppliers for sharing
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: [`/api/vendors/${vendorId}/suppliers`],
    enabled: !!vendorId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
      toast({ title: "Task Updated", description: "Task has been updated successfully." });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
      toast({ title: "Task Deleted", description: "Task has been deleted successfully." });
    },
  });

  // Toggle task completion
  const toggleTaskComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date() : null,
      },
    });
  };

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    overdue: tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed").length,
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Separate overdue tasks
  const overdueTasks = filteredTasks.filter(
    (task) => task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed"
  );

  // Get priority config
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "urgent":
        return { color: "bg-red-100 text-red-700 border-red-200", icon: "🔴", label: "Urgent", gradient: "from-red-500 to-red-600" };
      case "high":
        return { color: "bg-orange-100 text-orange-700 border-orange-200", icon: "🟠", label: "High", gradient: "from-orange-500 to-orange-600" };
      case "medium":
        return { color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🟡", label: "Medium", gradient: "from-amber-500 to-amber-600" };
      case "low":
        return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "🔵", label: "Low", gradient: "from-blue-500 to-blue-600" };
      default:
        return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: "⚪", label: priority, gradient: "from-slate-500 to-slate-600" };
    }
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "bg-slate-100 text-slate-700", icon: Clock, label: "Pending" };
      case "in_progress":
        return { color: "bg-blue-100 text-blue-700", icon: Timer, label: "In Progress" };
      case "completed":
        return { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Completed" };
      case "cancelled":
        return { color: "bg-red-100 text-red-700", icon: X, label: "Cancelled" };
      default:
        return { color: "bg-slate-100 text-slate-700", icon: Clock, label: status };
    }
  };

  // Share task via WhatsApp
  const shareViaWhatsApp = (task: Task, phone: string, name: string) => {
    const message = `📋 *Task Assignment*\n\n` +
      `*Title:* ${task.title}\n` +
      (task.description ? `*Description:* ${task.description}\n` : '') +
      `*Priority:* ${task.priority}\n` +
      (task.dueDate ? `*Due Date:* ${format(new Date(task.dueDate), "dd MMM yyyy")}\n` : '') +
      `*Status:* ${task.status}\n\n` +
      `Assigned to: ${name}\n\n` +
      `Please complete this task on time. Thank you!`;
    
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    setShowShareDialog(false);
    toast({ title: "Shared", description: `Task shared with ${name} via WhatsApp` });
  };

  if (!vendorId) { return <LoadingSpinner />; }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div 
      ref={mainContainerRef}
      className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 overflow-y-auto"
    >
      {/* Hero Header - Fully Scrollable */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white">
        <div className="px-4 py-4 safe-area-inset-top">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Tasks</h1>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="h-10 px-4 rounded-full bg-white text-teal-700 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {/* Stats Cards - Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <ListTodo className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70">Pending</span>
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="h-4 w-4 text-blue-300" />
                <span className="text-xs text-white/70">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-blue-300">{stats.inProgress}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-xs text-white/70">Completed</span>
              </div>
              <p className="text-2xl font-bold text-emerald-300">{stats.completed}</p>
            </div>
            {stats.overdue > 0 && (
              <div className="flex-shrink-0 bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-300" />
                  <span className="text-xs text-white/70">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-red-300">{stats.overdue}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - White Card with Rounded Top */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 shadow-xl">
        {/* Search & Filters */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: "all", label: "All", count: stats.total },
              { value: "pending", label: "Pending", count: stats.pending },
              { value: "in_progress", label: "In Progress", count: stats.inProgress },
              { value: "completed", label: "Completed", count: stats.completed },
            ].map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className={`rounded-full flex-shrink-0 ${
                  statusFilter === status.value 
                    ? "bg-teal-600 hover:bg-teal-700" 
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {status.label} ({status.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && statusFilter === "all" && (
          <div className="px-4 mb-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">{overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}</h3>
                    <p className="text-sm text-red-600">Please complete these tasks ASAP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tasks List */}
        <div className="px-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Tasks ({filteredTasks.length})
            </h2>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ListTodo className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No tasks found</h3>
              <p className="text-slate-500 text-center mb-6">Create your first task to get started</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="rounded-full bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const priorityConfig = getPriorityConfig(task.priority);
                const statusConfig = getStatusConfig(task.status);
                const StatusIcon = statusConfig.icon;
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed";
                const assignedEmployee = employees.find(e => e.id === task.assignedTo);

                return (
                  <Card 
                    key={task.id} 
                    className={`border hover:shadow-lg transition-all duration-200 overflow-hidden ${
                      isOverdue ? "border-red-300 bg-red-50/50" : "border-slate-200"
                    }`}
                  >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
                        <div className="pt-1">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => toggleTaskComplete(task)}
                            className={`h-6 w-6 rounded-full ${
                              task.status === "completed" ? "bg-emerald-500 border-emerald-500" : ""
                            }`}
          />
                        </div>

          {/* Task Content */}
                        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`font-semibold ${
                              task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"
                            }`}>
                {task.title}
              </h3>

                            {/* Actions Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLocation(`/vendor/tasks/edit/${task.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTask(task);
                                  setShowShareDialog(true);
                                }}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share via WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                                  className="text-red-600"
                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
            </div>

            {/* Description */}
            {task.description && (
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
            )}

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={`${priorityConfig.color} border text-xs`}>
                              <span className="mr-1">{priorityConfig.icon}</span>
                              {priorityConfig.label}
                            </Badge>
                            <Badge className={`${statusConfig.color} text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {task.category}
                </Badge>
                            )}
              </div>

                          {/* Footer Row */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {/* Due Date */}
              {task.dueDate && (
                              <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                <Calendar className="h-3 w-3" />
                                {isOverdue ? (
                                  <span>Overdue: {format(new Date(task.dueDate), "dd MMM")}</span>
                                ) : isToday(new Date(task.dueDate)) ? (
                                  <span className="text-amber-600 font-medium">Due Today</span>
                                ) : isTomorrow(new Date(task.dueDate)) ? (
                                  <span className="text-blue-600">Due Tomorrow</span>
                                ) : (
                                  <span>Due: {format(new Date(task.dueDate), "dd MMM")}</span>
                                )}
                </div>
              )}

              {/* Reminder */}
              {task.reminderDate && !isPast(new Date(task.reminderDate)) && (
                              <div className="flex items-center gap-1 text-teal-600">
                                <Bell className="h-3 w-3" />
                                <span>{format(new Date(task.reminderDate), "dd MMM, h:mm a")}</span>
                </div>
              )}

                            {/* Assigned To */}
                            {assignedEmployee && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{assignedEmployee.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        vendorId={vendorId}
        employees={employees}
        onSuccess={() => {
          setShowCreateDialog(false);
          queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
        }}
      />

      {/* Share Task Dialog */}
      {selectedTask && (
        <ShareTaskDialog
          open={showShareDialog}
          onClose={() => {
            setShowShareDialog(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          employees={employees}
          customers={customers}
          suppliers={suppliers}
          onShare={shareViaWhatsApp}
        />
      )}
      </div>
    );
  }

// Create Task Dialog Component
function CreateTaskDialog({ 
  open,
  onClose,
  vendorId,
  employees,
  onSuccess 
}: { 
  open: boolean;
  onClose: () => void;
  vendorId: string;
  employees: Employee[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const taskData = {
        vendorId,
        title,
        description: description || null,
        priority,
        category,
        status: "pending",
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignedTo: assignedTo || null,
      };
      return await apiRequest("POST", `/api/vendors/${vendorId}/tasks`, taskData);
    },
    onSuccess: () => {
      toast({ title: "Task Created", description: "Your task has been created successfully." });
      resetForm();
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task. Please try again.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("general");
    setDueDate("");
    setAssignedTo("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
      {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-teal-50 to-emerald-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
              <DialogTitle className="text-lg font-semibold">Create Task</DialogTitle>
              <DialogDescription className="text-xs">Add a new task to your list</DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Task Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="h-12 rounded-xl"
            />
      </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              className="rounded-xl resize-none"
              rows={3}
            />
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🔵 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="follow-up">Follow Up</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Due Date (Optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {employees.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assign To (Optional)</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
      )}
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-4">
          <Button
            onClick={() => createTaskMutation.mutate()}
            disabled={!title.trim() || createTaskMutation.isPending}
            className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700"
          >
            {createTaskMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Create Task
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Share Task Dialog Component
function ShareTaskDialog({ 
  open,
  onClose,
  task,
  employees,
  customers,
  suppliers,
  onShare
}: { 
  open: boolean;
  onClose: () => void;
  task: Task;
  employees: Employee[];
  customers: Customer[];
  suppliers: Supplier[];
  onShare: (task: Task, phone: string, name: string) => void;
}) {
  const [shareType, setShareType] = useState<"employee" | "customer" | "supplier">("employee");
  const [searchQuery, setSearchQuery] = useState("");

  const getFilteredContacts = () => {
    const query = searchQuery.toLowerCase();
    switch (shareType) {
      case "employee":
        return employees.filter(e => 
          e.name.toLowerCase().includes(query) || 
          e.phone?.includes(query)
        );
      case "customer":
        return customers.filter(c => 
          c.name.toLowerCase().includes(query) || 
          c.phone?.includes(query)
        );
      case "supplier":
        return suppliers.filter(s => 
          s.name.toLowerCase().includes(query) || 
          s.phone?.includes(query)
        );
    }
  };

  const contacts = getFilteredContacts();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Share via WhatsApp
              </DialogTitle>
              <DialogDescription className="text-xs">Share task "{task.title}" with...</DialogDescription>
            </div>
          </div>
        </div>

        {/* Type Selection */}
        <div className="px-4 py-3 border-b">
          <div className="flex gap-2">
            <Button
              variant={shareType === "employee" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("employee")}
              className={`rounded-full flex-1 ${shareType === "employee" ? "bg-teal-600" : ""}`}
            >
              <Users className="h-4 w-4 mr-1" />
              Employees
            </Button>
            <Button
              variant={shareType === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("customer")}
              className={`rounded-full flex-1 ${shareType === "customer" ? "bg-teal-600" : ""}`}
            >
              <User className="h-4 w-4 mr-1" />
              Customers
            </Button>
            <Button
              variant={shareType === "supplier" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("supplier")}
              className={`rounded-full flex-1 ${shareType === "supplier" ? "bg-teal-600" : ""}`}
            >
              <Truck className="h-4 w-4 mr-1" />
              Suppliers
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder={`Search ${shareType}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 rounded-xl bg-slate-50"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">No {shareType}s found</h3>
              <p className="text-slate-500 text-sm">
                {shareType === "employee" ? "Add employees first" : 
                 shareType === "customer" ? "Add customers first" : 
                 "Add suppliers first"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact: any) => (
                <Card 
                  key={contact.id}
                  className="border cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all"
                  onClick={() => {
                    if (contact.phone) {
                      onShare(task, contact.phone, contact.name);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">{contact.name}</h4>
                        <p className="text-sm text-slate-500">{contact.phone || "No phone"}</p>
                      </div>
                      {contact.phone ? (
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">No Phone</Badge>
                      )}
                    </div>
              </CardContent>
            </Card>
              ))}
            </div>
          )}
      </div>
      </DialogContent>
    </Dialog>
  );
}
