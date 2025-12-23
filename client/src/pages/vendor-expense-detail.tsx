import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import type { Expense, Supplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  FileText,
  Building2,
  Repeat,
  Receipt,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Briefcase,
  Tag,
  MessageSquare,
  Hash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const EXPENSE_CATEGORIES = [
  "purchase", "rent", "salary", "utility", "maintenance", "marketing",
  "transport", "office_supplies", "insurance", "tax", "loan_payment",
  "professional_fees", "software", "other",
];

const PAYMENT_TYPES = ["cash", "upi", "card", "bank_transfer", "cheque", "wallet"];
const EXPENSE_STATUSES = ["paid", "pending", "cancelled"];
const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; gradient: string }> = {
  purchase: { icon: <Receipt className="h-6 w-6" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", gradient: "from-blue-500 to-blue-600" },
  rent: { icon: <Building2 className="h-6 w-6" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", gradient: "from-purple-500 to-purple-600" },
  salary: { icon: <DollarSign className="h-6 w-6" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", gradient: "from-green-500 to-green-600" },
  utility: { icon: <DollarSign className="h-6 w-6" />, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", gradient: "from-amber-500 to-amber-600" },
  maintenance: { icon: <FileText className="h-6 w-6" />, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", gradient: "from-orange-500 to-orange-600" },
  marketing: { icon: <FileText className="h-6 w-6" />, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30", gradient: "from-pink-500 to-pink-600" },
  transport: { icon: <FileText className="h-6 w-6" />, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", gradient: "from-cyan-500 to-cyan-600" },
  office_supplies: { icon: <FileText className="h-6 w-6" />, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", gradient: "from-indigo-500 to-indigo-600" },
  insurance: { icon: <CheckCircle className="h-6 w-6" />, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30", gradient: "from-teal-500 to-teal-600" },
  tax: { icon: <Receipt className="h-6 w-6" />, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", gradient: "from-red-500 to-red-600" },
  loan_payment: { icon: <CreditCard className="h-6 w-6" />, color: "text-rose-600", bgColor: "bg-rose-100 dark:bg-rose-900/30", gradient: "from-rose-500 to-rose-600" },
  professional_fees: { icon: <Building2 className="h-6 w-6" />, color: "text-violet-600", bgColor: "bg-violet-100 dark:bg-violet-900/30", gradient: "from-violet-500 to-violet-600" },
  software: { icon: <FileText className="h-6 w-6" />, color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30", gradient: "from-sky-500 to-sky-600" },
  other: { icon: <FileText className="h-6 w-6" />, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30", gradient: "from-gray-500 to-gray-600" },
};

export default function VendorExpenseDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/expenses/:id");
  const expenseId = params?.id;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch expense
  const { data: expense, isLoading, error } = useQuery<Expense>({
    queryKey: [`/api/vendors/${vendorId}/expenses/${expenseId}`],
    enabled: !!vendorId && !!expenseId,
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses/${expenseId}`));
      if (!response.ok) throw new Error("Failed to fetch expense");
      return response.json();
    },
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: [`/api/vendors/${vendorId}/suppliers`],
    enabled: !!vendorId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses/${expenseId}`), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses`] });
      toast({ title: "Expense deleted successfully" });
      setLocation("/vendor/expenses");
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  // Get supplier name
  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.businessName || null;
  };

  // Get category config
  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return { icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", label: "Paid" };
      case "pending":
        return { icon: <Clock className="h-5 w-5" />, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Pending" };
      case "cancelled":
        return { icon: <XCircle className="h-5 w-5" />, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Cancelled" };
      default:
        return { icon: <AlertCircle className="h-5 w-5" />, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30", label: status };
    }
  };

  if (!vendorId) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Expense not found</p>
        <Button variant="outline" onClick={() => setLocation("/vendor/expenses")} className="mt-4">
          Back to Expenses
        </Button>
      </div>
    );
  }

  const categoryConfig = getCategoryConfig(expense.category);
  const statusConfig = getStatusConfig(expense.status);
  const supplierName = getSupplierName(expense.supplierId);

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/expenses")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Expense Details</h1>
              <p className="text-xs text-muted-foreground">View expense information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <ExpenseEditDialog
                  expense={expense}
                  suppliers={suppliers}
                  vendorId={vendorId}
                  onClose={() => setIsEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Hero Card */}
        <Card className={`overflow-hidden bg-gradient-to-br ${categoryConfig.gradient}`}>
          <CardContent className="p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  {categoryConfig.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{expense.title}</h2>
                  <p className="text-white/80 capitalize">
                    {expense.category.replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">₹{expense.amount.toLocaleString()}</p>
                <Badge className="mt-2 bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                <span className={statusConfig.color}>{statusConfig.icon}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{expense.status}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold">{format(new Date(expense.expenseDate), "MMM d, yyyy")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="font-semibold capitalize">{expense.paymentType.replace("_", " ")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                {expense.isRecurring ? <Repeat className="h-5 w-5 text-orange-600" /> : <Receipt className="h-5 w-5 text-orange-600" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">
                  {expense.isRecurring ? expense.recurringFrequency : "One-time"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paid To / Supplier */}
            {(supplierName || expense.paidTo) && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid To</p>
                  <p className="font-medium">{supplierName || expense.paidTo}</p>
                  {supplierName && expense.supplierId && (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => setLocation(`/vendor/suppliers/${expense.supplierId}`)}
                    >
                      View Supplier
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            {expense.description && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="font-medium">{expense.description}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            {expense.notes && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Internal Notes</p>
                    <p className="font-medium">{expense.notes}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Department */}
            {expense.department && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{expense.department}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Project ID */}
            {expense.projectId && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Project ID</p>
                    <p className="font-medium">{expense.projectId}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(expense.createdAt), "PPP 'at' p")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recurring Info Card */}
        {expense.isRecurring && (
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Repeat className="h-4 w-4" />
                Recurring Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="font-semibold capitalize">{expense.recurringFrequency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Due Date</p>
                  <p className="font-semibold">
                    {expense.nextDueDate ? format(new Date(expense.nextDueDate), "MMM d, yyyy") : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Edit Dialog Component
interface ExpenseEditDialogProps {
  expense: Expense;
  suppliers: Supplier[];
  vendorId: string;
  onClose: () => void;
}

function ExpenseEditDialog({ expense, suppliers, vendorId, onClose }: ExpenseEditDialogProps) {
  const { toast } = useToast();
  const [supplierSelection, setSupplierSelection] = useState<"none" | "other" | string>(
    expense.supplierId 
      ? expense.supplierId 
      : expense.paidTo 
        ? "other" 
        : "none"
  );
  const [formData, setFormData] = useState({
    title: expense.title,
    category: expense.category,
    amount: expense.amount.toString(),
    expenseDate: format(new Date(expense.expenseDate), "yyyy-MM-dd"),
    paymentType: expense.paymentType,
    status: expense.status,
    paidTo: expense.paidTo || "",
    supplierId: expense.supplierId || "",
    description: expense.description || "",
    notes: expense.notes || "",
    department: expense.department || "",
    projectId: expense.projectId || "",
    isRecurring: expense.isRecurring || false,
    recurringFrequency: expense.recurringFrequency || "",
    nextDueDate: expense.nextDueDate ? format(new Date(expense.nextDueDate), "yyyy-MM-dd") : "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses/${expense.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update expense");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses/${expense.id}`] });
      toast({ title: "Expense updated successfully" });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to update expense", variant: "destructive" });
    },
  });

  const handleSupplierChange = (value: string) => {
    setSupplierSelection(value);
    if (value === "none") {
      setFormData({ ...formData, supplierId: "", paidTo: "" });
    } else if (value === "other") {
      setFormData({ ...formData, supplierId: "" });
    } else {
      const supplier = suppliers.find(s => s.id === value);
      setFormData({ 
        ...formData, 
        supplierId: value, 
        paidTo: supplier?.businessName || "" 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.category) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: "Valid amount is required", variant: "destructive" });
      return;
    }
    if (!formData.paymentType) {
      toast({ title: "Payment type is required", variant: "destructive" });
      return;
    }
    if (!formData.status) {
      toast({ title: "Status is required", variant: "destructive" });
      return;
    }
    if (formData.isRecurring && !formData.recurringFrequency) {
      toast({ title: "Recurring frequency is required", variant: "destructive" });
      return;
    }

    const payload: any = {
      title: formData.title.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      expenseDate: formData.expenseDate,
      paymentType: formData.paymentType,
      status: formData.status,
      paidTo: formData.paidTo.trim() || undefined,
      supplierId: formData.supplierId || undefined,
      description: formData.description.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      department: formData.department.trim() || undefined,
      projectId: formData.projectId.trim() || undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      nextDueDate: formData.isRecurring && formData.nextDueDate ? formData.nextDueDate : undefined,
    };

    updateMutation.mutate(payload);
  };

  const isFormValid = formData.title && formData.category && formData.amount && 
    formData.paymentType && formData.status && 
    (!formData.isRecurring || formData.recurringFrequency);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-primary" />
          Edit Expense
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="edit-title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Office Rent - January"
            className="h-11"
          />
        </div>

        {/* Amount & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-amount" className="text-sm font-medium">
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="pl-9 h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expenseDate" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-expenseDate"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              className="h-11"
            />
          </div>
        </div>

        {/* Category & Payment Type Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="capitalize">{cat.replace("_", " ")}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Payment Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select payment" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="capitalize">{type.replace("_", " ")}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    {status === "paid" && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                    {status === "pending" && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                    {status === "cancelled" && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                    <span className="capitalize">{status}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Supplier Selection */}
        <Card className="p-4 bg-muted/30">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Paid To</Label>
            <Select
              value={supplierSelection}
              onValueChange={handleSupplierChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select supplier or other" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">— Not specified —</span>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-600" />
                    <span>Others (Enter manually)</span>
                  </div>
                </SelectItem>
                {suppliers.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                      Your Suppliers
                    </div>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span>{supplier.businessName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Show manual input when "Others" is selected */}
            {supplierSelection === "other" && (
              <div className="mt-3">
                <Label htmlFor="edit-paidTo" className="text-sm">
                  Enter Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-paidTo"
                  value={formData.paidTo}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                  placeholder="Person or company name"
                  className="h-10 mt-1.5"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the expense"
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Department & Project Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-department" className="text-sm font-medium">Department</Label>
            <Input
              id="edit-department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Sales, HR"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-projectId" className="text-sm font-medium">Project ID</Label>
            <Input
              id="edit-projectId"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              placeholder="e.g., PRJ-001"
              className="h-10"
            />
          </div>
        </div>

        {/* Internal Notes */}
        <div className="space-y-2">
          <Label htmlFor="edit-notes" className="text-sm font-medium">Internal Notes</Label>
          <Textarea
            id="edit-notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Private notes for internal use"
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Recurring Options */}
        <Card className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked as boolean })
                }
              />
              <div>
                <Label htmlFor="edit-isRecurring" className="cursor-pointer font-medium">
                  Recurring Expense
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable for expenses that repeat regularly
                </p>
              </div>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-purple-200 dark:border-purple-800">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Frequency <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.recurringFrequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurringFrequency: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          <span className="capitalize">{freq}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-nextDueDate" className="text-sm font-medium">Next Due Date</Label>
                  <Input
                    id="edit-nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, nextDueDate: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateMutation.isPending || !isFormValid}
            className="min-w-[120px]"
          >
            {updateMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : "Update Expense"}
          </Button>
        </div>
      </form>
    </>
  );
}

