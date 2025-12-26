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
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

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
    queryKey: [`/api/vendors/${vendorId}/customers`],
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
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div 
      ref={mainContainerRef}
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Header - Clean Design Like Other Modules */}
      <div className="bg-background border-b sticky top-0 z-20">
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="shrink-0 h-10 w-10 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Tasks</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Manage your tasks</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="gap-1.5 h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Stats Cards - Horizontal Scroll */}
        <div className="px-4 md:px-6 pb-4 overflow-x-auto scrollbar-hide max-w-[1440px] mx-auto">
          <div className="flex gap-3 md:grid md:grid-cols-5">
            <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 min-h-[var(--card-min-h)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <ListTodo className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 border-slate-200 dark:border-slate-800 min-h-[var(--card-min-h)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-500/20">
                  <Clock className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-400">{stats.pending}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 min-h-[var(--card-min-h)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20">
                  <Timer className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                  <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.inProgress}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 min-h-[var(--card-min-h)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completed</p>
                  <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
                </div>
              </div>
            </Card>
            {stats.overdue > 0 && (
              <Card className="p-4 rounded-xl min-w-[120px] shrink-0 md:min-w-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800 min-h-[var(--card-min-h)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                    <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-400">{stats.overdue}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-background max-w-[1440px] mx-auto w-full">
        {/* Search & Filters */}
        <div className="px-4 md:px-6 py-3 md:py-4 bg-background border-b">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-muted/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-10 shrink-0 rounded-lg text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({stats.total})</SelectItem>
                <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                <SelectItem value="in_progress">In Progress ({stats.inProgress})</SelectItem>
                <SelectItem value="completed">Completed ({stats.completed})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && statusFilter === "all" && (
          <div className="px-4 md:px-6 pt-4">
            <Card className="bg-destructive/10 border-destructive/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive">{overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}</h3>
                    <p className="text-sm text-muted-foreground">Please complete these tasks ASAP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tasks List */}
        <div className="flex-1 px-4 md:px-6 py-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ListTodo className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                {statusFilter !== 'all' || searchQuery 
                  ? "Try adjusting your search or filters"
                  : "Create your first task to get started"}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              )}
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
                    className={`overflow-hidden hover:shadow-md transition-all cursor-pointer ${
                      isOverdue ? "border-destructive/50 bg-destructive/5" : ""
                    }`}
                    onClick={() => setLocation(`/vendor/tasks/${task.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={task.status === "completed"}
                            onCheckedChange={() => toggleTaskComplete(task)}
                            className="h-5 w-5 rounded-full"
                          />
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-semibold ${
                              task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                            }`}>
                              {task.title}
                            </h3>

                            {/* Actions Menu */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setLocation(`/vendor/tasks/${task.id}`)}>
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
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
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 mb-2 line-clamp-2">{task.description}</p>
                          )}

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={`${priorityConfig.color} border text-[10px] px-1.5 py-0 h-5`}>
                              <span className="mr-1">{priorityConfig.icon}</span>
                              {priorityConfig.label}
                            </Badge>
                            <Badge className={`${statusConfig.color} text-[10px] px-1.5 py-0 h-5`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                <Tag className="h-3 w-3 mr-1" />
                                {task.category}
                              </Badge>
                            )}
                          </div>

                          {/* Footer Row */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                            {/* Due Date */}
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
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
                              <div className="flex items-center gap-1 text-primary">
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
  const [assignedTo, setAssignedTo] = useState("unassigned");

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
        assignedTo: assignedTo === "unassigned" ? null : assignedTo,
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
    setAssignedTo("unassigned");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/50">
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
                  <SelectItem value="unassigned">Unassigned</SelectItem>
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
        <div className="border-t bg-background p-4">
          <Button
            onClick={() => createTaskMutation.mutate()}
            disabled={!title.trim() || createTaskMutation.isPending}
            className="w-full h-12 rounded-xl"
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
              className="rounded-full flex-1"
            >
              <Users className="h-4 w-4 mr-1" />
              Employees
            </Button>
            <Button
              variant={shareType === "customer" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("customer")}
              className="rounded-full flex-1"
            >
              <User className="h-4 w-4 mr-1" />
              Customers
            </Button>
            <Button
              variant={shareType === "supplier" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareType("supplier")}
              className="rounded-full flex-1"
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
