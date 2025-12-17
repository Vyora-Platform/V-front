import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X } from "lucide-react";
import type { Task, Employee } from "@shared/schema";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorTasksEdit() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const taskId = params.id;
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("daily");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  // Fetch task
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/vendors/${vendorId}/tasks`],
    enabled: !!vendorId,
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/vendors/${vendorId}/employees`],
    enabled: !!vendorId,
  });

  const task = tasks.find((t) => t.id === taskId);

  // Initialize form when task is loaded
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setCategory(task.category || "general");
      setStatus(task.status);
      setTags(task.tags || []);
      setAssignedTo(task.assignedTo || null);
      setIsRecurring(task.isRecurring);
      setRecurringPattern(task.recurringPattern || "daily");
      setVerificationRequired(task.verificationRequired);
      setAttachments(task.attachments || []);
      
      if (task.dueDate) {
        const dueDateObj = new Date(task.dueDate);
        setDueDate(format(dueDateObj, "yyyy-MM-dd'T'HH:mm"));
      }
      
      if (task.reminderDate) {
        const reminderDateObj = new Date(task.reminderDate);
        setReminderDate(format(reminderDateObj, "yyyy-MM-dd'T'HH:mm"));
      }
    }
  }, [task]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/tasks`] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setLocation("/vendor/tasks");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    const updates: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      category,
      status,
      dueDate: dueDate || null,
      reminderDate: reminderDate || null,
      tags,
      assignedTo: assignedTo || null,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      verificationRequired,
      attachments,
    };

    updateTaskMutation.mutate(updates);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addAttachment = () => {
    if (attachmentUrl.trim() && !attachments.includes(attachmentUrl.trim())) {
      setAttachments([...attachments, attachmentUrl.trim()]);
      setAttachmentUrl("");
    }
  };

  const removeAttachment = (urlToRemove: string) => {
    setAttachments(attachments.filter((url) => url !== urlToRemove));
  };

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="container mx-auto p-6">
        <p>Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Task not found</p>
            <Button onClick={() => setLocation("/vendor/tasks")} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 pb-16 md:pb-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vendor/tasks")}
          className="md:hidden flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-edit-task">
            Edit Task
          </h1>
          <p className="text-muted-foreground">Update task details and settings</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
                data-testid="input-task-title"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={4}
                data-testid="input-task-description"
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority" data-testid="select-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="follow-up">Follow Up</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="customer-service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date and Reminder Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-due-date"
                />
              </div>

              <div>
                <Label htmlFor="reminderDate">Reminder Date</Label>
                <Input
                  id="reminderDate"
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  data-testid="input-reminder-date"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  data-testid="input-new-tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  data-testid="button-add-tag"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Tag List */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                      data-testid={`tag-${idx}`}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                        data-testid={`button-remove-tag-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Employee Assignment */}
            <div>
              <Label htmlFor="assignedTo">Assign to Employee (Optional)</Label>
              <Select value={assignedTo || "unassigned"} onValueChange={(value) => setAssignedTo(value === "unassigned" ? null : value)}>
                <SelectTrigger id="assignedTo" data-testid="select-assigned-to">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring Task */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isRecurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  data-testid="checkbox-is-recurring"
                />
                <Label htmlFor="isRecurring" className="cursor-pointer">
                  Recurring Task
                </Label>
              </div>
              
              {isRecurring && (
                <div className="ml-6">
                  <Label htmlFor="recurringPattern">Recurrence Pattern</Label>
                  <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                    <SelectTrigger id="recurringPattern" data-testid="select-recurring-pattern">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Verification Required */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="verificationRequired"
                checked={verificationRequired}
                onCheckedChange={(checked) => setVerificationRequired(checked as boolean)}
                data-testid="checkbox-verification-required"
              />
              <Label htmlFor="verificationRequired" className="cursor-pointer">
                Verification Required
              </Label>
            </div>

            {/* Attachments */}
            <div>
              <Label htmlFor="attachments">Attachments (URLs)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="attachments"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="Enter attachment URL"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttachment();
                    }
                  }}
                  data-testid="input-attachment-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAttachment}
                  data-testid="button-add-attachment"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 bg-secondary px-3 py-2 rounded-md text-sm"
                      data-testid={`attachment-${idx}`}
                    >
                      <span className="truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(url)}
                        className="hover:text-destructive flex-shrink-0"
                        data-testid={`button-remove-attachment-${idx}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/vendor/tasks")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTaskMutation.isPending}
                data-testid="button-update-task"
              >
                {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
