import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, Calendar, Flag, Tag, Trash2, Edit, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import type { Task } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorTasks() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/vendors/${vendorId}/tasks`],
    enabled: !!vendorId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
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

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
    return true;
  });

  // Separate tasks with reminders
  const tasksWithReminders = filteredTasks.filter(
    (task) => task.reminderDate && !isPast(new Date(task.reminderDate)) && task.status !== "completed"
  );

  // Separate overdue tasks
  const overdueTasks = filteredTasks.filter(
    (task) => task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed"
  );

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get due date indicator
  const getDueDateIndicator = (dueDate: Date | null | string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    
    if (isPast(date)) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    }
    if (isToday(date)) {
      return <Badge variant="default" className="text-xs">Due Today</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge variant="secondary" className="text-xs">Due Tomorrow</Badge>;
    }
    return <span className="text-xs text-muted-foreground">{format(date, "MMM dd")}</span>;
  };

  // Render task card
  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            data-testid={`checkbox-task-${task.id}`}
            checked={task.status === "completed"}
            onCheckedChange={() => toggleTaskComplete(task)}
            className="mt-1"
          />

          {/* Task Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3
                className={`font-semibold ${
                  task.status === "completed" ? "line-through text-muted-foreground" : ""
                }`}
                data-testid={`text-task-title-${task.id}`}
              >
                {task.title}
              </h3>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setLocation(`/vendor/tasks/edit/${task.id}`)}
                  data-testid={`button-edit-task-${task.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Priority */}
              <div className="flex items-center gap-1">
                <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                  {task.priority}
                </Badge>
              </div>

              {/* Category */}
              {task.category && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span className="text-muted-foreground">{task.category}</span>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getDueDateIndicator(task.dueDate)}
                </div>
              )}

              {/* Reminder */}
              {task.reminderDate && !isPast(new Date(task.reminderDate)) && (
                <div className="flex items-center gap-1">
                  <Bell className="w-3 h-3 text-primary" />
                  <span className="text-primary">
                    {format(new Date(task.reminderDate), "MMM dd, h:mm a")}
                  </span>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="container mx-auto p-6">
        <p>Loading tasks...</p>
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
            <h1 className="text-xl font-bold" data-testid="heading-tasks">Tasks</h1>
            <p className="text-xs text-muted-foreground">Manage tasks</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setLocation("/vendor/tasks/create")} data-testid="button-create-task">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Filters */}
        <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger data-testid="select-priority-filter">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="follow-up">Follow Up</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders Section */}
      {tasksWithReminders.length > 0 && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksWithReminders.map(renderTaskCard)}
          </CardContent>
        </Card>
      )}

      {/* Overdue Tasks Section */}
      {overdueTasks.length > 0 && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Calendar className="w-5 h-5" />
              Overdue Tasks ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.map(renderTaskCard)}
          </CardContent>
        </Card>
      )}

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-tasks">
            All Tasks ({filteredTasks.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-tasks">
            Pending ({filteredTasks.filter((t) => t.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-tasks">
            Completed ({filteredTasks.filter((t) => t.status === "completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No tasks found. Create your first task!</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map(renderTaskCard)
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {filteredTasks.filter((t) => t.status === "pending").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No pending tasks!</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.filter((t) => t.status === "pending").map(renderTaskCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {filteredTasks.filter((t) => t.status === "completed").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No completed tasks yet.</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.filter((t) => t.status === "completed").map(renderTaskCard)
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
