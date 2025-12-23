import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Calendar, Clock, User, Tag, Bell, Edit, Trash2,
  CheckCircle2, Timer, AlertTriangle, X, Share2, MessageCircle,
  Flag, RefreshCw, Paperclip, ChevronRight
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import type { Task, Employee } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorTaskDetail() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const taskId = params.id;
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch task
  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId,
  });

  // Fetch employees for assignment display
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
      toast({ title: "Task Updated", description: "Task has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
      toast({ title: "Task Deleted", description: "Task has been deleted successfully." });
      setLocation("/vendor/tasks");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    },
  });

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

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    if (!task) return;
    const message = `📋 *Task Details*\n\n` +
      `*Title:* ${task.title}\n` +
      (task.description ? `*Description:* ${task.description}\n` : '') +
      `*Priority:* ${task.priority}\n` +
      `*Status:* ${task.status}\n` +
      (task.dueDate ? `*Due Date:* ${format(new Date(task.dueDate), "dd MMM yyyy")}\n` : '') +
      `\nShared via Vyora`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  if (!vendorId) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/tasks")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Task Details</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
              <p className="text-muted-foreground mb-4">The task you're looking for doesn't exist or has been deleted.</p>
              <Button onClick={() => setLocation("/vendor/tasks")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed";
  const assignedEmployee = employees.find(e => e.id === task.assignedTo);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-y-auto">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/tasks")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Task Details</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">View and manage task</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={shareViaWhatsApp}
              className="h-9 w-9"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation(`/vendor/tasks/edit/${task.id}`)}
              className="h-9 w-9"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="flex-1 p-4 space-y-4 pb-20">
        {/* Title & Status Card */}
        <Card className={isOverdue ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className={`text-xl font-bold ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task.title}
              </h2>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={`${priorityConfig.color} border text-xs px-2 py-0.5`}>
                <span className="mr-1">{priorityConfig.icon}</span>
                {priorityConfig.label}
              </Badge>
              <Badge className={`${statusConfig.color} text-xs px-2 py-0.5`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {task.category && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  <Tag className="h-3 w-3 mr-1" />
                  {task.category}
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>

            {/* Quick Status Change */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={task.status}
                onValueChange={(value) => {
                  const updates: Partial<Task> = { status: value };
                  if (value === "completed") {
                    updates.completedAt = new Date();
                  }
                  updateTaskMutation.mutate(updates);
                }}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {task.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Due Date */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOverdue ? "bg-red-100" : "bg-blue-100"}`}>
                  <Calendar className={`h-5 w-5 ${isOverdue ? "text-red-600" : "text-blue-600"}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  {task.dueDate ? (
                    <p className={`font-medium ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                      {isToday(new Date(task.dueDate)) ? "Today" :
                       isTomorrow(new Date(task.dueDate)) ? "Tomorrow" :
                       format(new Date(task.dueDate), "dd MMM yyyy")}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Not set</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminder */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reminder</p>
                  {task.reminderDate ? (
                    <p className="font-medium text-foreground">
                      {format(new Date(task.reminderDate), "dd MMM, h:mm a")}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Not set</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned To */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  {assignedEmployee ? (
                    <p className="font-medium text-foreground">{assignedEmployee.name}</p>
                  ) : (
                    <p className="text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recurring</p>
                  <p className="font-medium text-foreground">
                    {task.isRecurring ? (task.recurringPattern || "Yes") : "No"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {task.attachments.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">{url}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(task.createdAt), "dd MMM yyyy, h:mm a")}</p>
              </div>
              {task.completedAt && (
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-medium text-green-600">{format(new Date(task.completedAt), "dd MMM yyyy, h:mm a")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

