import { useState, useRef } from "react";
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
  Edit,
  Trash2,
  FileText,
  Building2,
  Receipt,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  IndianRupee,
  Zap,
  Wifi,
  Car,
  Users,
  Megaphone,
  Package,
  Wrench,
  HelpCircle,
  Wallet,
  ExternalLink,
  Upload,
  X,
  RefreshCw
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// Updated MSME-friendly categories
const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent", icon: Building2 },
  { value: "electricity", label: "Electricity", icon: Zap },
  { value: "internet_mobile", label: "Internet / Mobile", icon: Wifi },
  { value: "transportation", label: "Transportation", icon: Car },
  { value: "salaries", label: "Salaries", icon: Users },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "office_supplies", label: "Office Supplies", icon: Package },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "other", label: "Other", icon: HelpCircle },
];

const PAYMENT_MODES = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "upi", label: "UPI", icon: IndianRupee },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
  { value: "card", label: "Card", icon: CreditCard },
];

const PAID_STATUSES = [
  { value: "paid", label: "Paid", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  { value: "unpaid", label: "Unpaid", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  { value: "partially_paid", label: "Partially Paid", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
];

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; gradient: string }> = {
  rent: { icon: <Building2 className="h-6 w-6" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", gradient: "from-purple-500 to-purple-600" },
  electricity: { icon: <Zap className="h-6 w-6" />, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", gradient: "from-yellow-500 to-yellow-600" },
  internet_mobile: { icon: <Wifi className="h-6 w-6" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", gradient: "from-blue-500 to-blue-600" },
  transportation: { icon: <Car className="h-6 w-6" />, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", gradient: "from-cyan-500 to-cyan-600" },
  salaries: { icon: <Users className="h-6 w-6" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", gradient: "from-green-500 to-green-600" },
  marketing: { icon: <Megaphone className="h-6 w-6" />, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30", gradient: "from-pink-500 to-pink-600" },
  office_supplies: { icon: <Package className="h-6 w-6" />, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", gradient: "from-indigo-500 to-indigo-600" },
  maintenance: { icon: <Wrench className="h-6 w-6" />, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", gradient: "from-orange-500 to-orange-600" },
  other: { icon: <HelpCircle className="h-6 w-6" />, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30", gradient: "from-gray-500 to-gray-600" },
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
      case "unpaid":
        return { icon: <XCircle className="h-5 w-5" />, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Unpaid" };
      case "partially_paid":
        return { icon: <AlertCircle className="h-5 w-5" />, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Partially Paid" };
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
      <div className="flex flex-col items-center justify-center h-full p-6">
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
  const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category;
  const paymentLabel = PAYMENT_MODES.find(m => m.value === expense.paymentType)?.label || expense.paymentType;

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
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
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-0">
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
              className="gap-1.5 h-9 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4 max-w-[1440px] mx-auto w-full">
        {/* Hero Card */}
        <Card className={`overflow-hidden bg-gradient-to-br ${categoryConfig.gradient} rounded-xl`}>
          <CardContent className="p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
                  {categoryConfig.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold mb-1 truncate">{expense.title}</h2>
                  <p className="text-white/80">
                    {categoryLabel}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl md:text-3xl font-bold">₹{expense.amount.toLocaleString()}</p>
                <Badge className="mt-2 bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Progress for Partial Payments */}
        {expense.status === "partially_paid" && expense.paidAmount && (
          <Card className="rounded-xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Payment Progress</span>
                <span className="text-sm text-muted-foreground">
                  {((expense.paidAmount / expense.amount) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(expense.paidAmount / expense.amount) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-green-600 font-medium">Paid: ₹{expense.paidAmount.toLocaleString()}</span>
                <span className="text-red-600 font-medium">Remaining: ₹{(expense.amount - expense.paidAmount).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                <span className={statusConfig.color}>{statusConfig.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold capitalize truncate">{statusConfig.label}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold truncate">{format(new Date(expense.expenseDate), "MMM d, yyyy")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="font-semibold capitalize truncate">{paymentLabel}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                <span className={categoryConfig.color}>{React.cloneElement(categoryConfig.icon as React.ReactElement, { className: "h-5 w-5" })}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-semibold capitalize truncate">{categoryLabel}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Details Card */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paid To / Supplier */}
            {(supplierName || expense.paidTo) && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted shrink-0">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Paid To / Vendor</p>
                  <p className="font-medium truncate">{supplierName || expense.paidTo}</p>
                  {supplierName && expense.supplierId && (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs"
                      onClick={() => setLocation(`/vendor/suppliers/${expense.supplierId}`)}
                    >
                      View Supplier →
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(supplierName || expense.paidTo) && <Separator />}

            {/* Paid Amount for Partial */}
            {expense.status === "partially_paid" && expense.paidAmount && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Paid</p>
                    <p className="font-medium text-green-600">₹{expense.paidAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                    <Clock className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Remaining</p>
                    <p className="font-medium text-red-600">₹{(expense.amount - expense.paidAmount).toLocaleString()}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            {expense.notes && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{expense.notes}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Receipt/Bill */}
            {expense.receiptUrl && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Bill / Invoice</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm gap-1"
                      onClick={() => window.open(expense.receiptUrl!, "_blank")}
                    >
                      View Attached Bill
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(expense.createdAt), "PPP 'at' p")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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
    paidAmount: (expense.paidAmount || 0).toString(),
    expenseDate: format(new Date(expense.expenseDate), "yyyy-MM-dd"),
    paymentType: expense.paymentType,
    status: expense.status,
    paidTo: expense.paidTo || "",
    supplierId: expense.supplierId || "",
    notes: expense.notes || "",
    receiptUrl: expense.receiptUrl || "",
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/upload`), {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      setFormData({ ...formData, receiptUrl: url });
      toast({ title: "Bill uploaded successfully" });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: "Expense title is required", variant: "destructive" });
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
      toast({ title: "Payment mode is required", variant: "destructive" });
      return;
    }
    if (!formData.status) {
      toast({ title: "Paid status is required", variant: "destructive" });
      return;
    }
    if (formData.status === "partially_paid" && (!formData.paidAmount || parseFloat(formData.paidAmount) <= 0)) {
      toast({ title: "Paid amount is required for partial payments", variant: "destructive" });
      return;
    }
    if (formData.status === "partially_paid" && parseFloat(formData.paidAmount) >= parseFloat(formData.amount)) {
      toast({ title: "Paid amount must be less than total amount", variant: "destructive" });
      return;
    }

    const payload: any = {
      title: formData.title.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      paidAmount: formData.status === "partially_paid" ? parseFloat(formData.paidAmount) : (formData.status === "paid" ? parseFloat(formData.amount) : 0),
      expenseDate: formData.expenseDate,
      paymentType: formData.paymentType,
      status: formData.status,
      paidTo: formData.paidTo.trim() || undefined,
      supplierId: formData.supplierId || undefined,
      notes: formData.notes.trim() || undefined,
      receiptUrl: formData.receiptUrl || undefined,
    };

    updateMutation.mutate(payload);
  };

  const isFormValid = formData.title && formData.category && formData.amount && 
    formData.paymentType && formData.status &&
    (formData.status !== "partially_paid" || (formData.paidAmount && parseFloat(formData.paidAmount) < parseFloat(formData.amount)));

  return (
    <div className="flex flex-col h-full">
      <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Expense
          </DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Expense Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-medium">
              Expense Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Shop Rent, Diesel, Internet Bill"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Expense Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="edit-amount" className="text-sm font-medium">
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Payment Mode <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{mode.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Paid Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Paid Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value, paidAmount: value === "paid" ? formData.amount : formData.paidAmount })}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PAID_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      {status.value === "paid" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {status.value === "unpaid" && <XCircle className="h-4 w-4 text-red-600" />}
                      {status.value === "partially_paid" && <AlertCircle className="h-4 w-4 text-amber-600" />}
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid Amount - Only visible for Partially Paid */}
          {formData.status === "partially_paid" && (
            <div className="space-y-2">
              <Label htmlFor="edit-paidAmount" className="text-sm font-medium">
                Paid Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={parseFloat(formData.amount) - 0.01}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
              {formData.amount && formData.paidAmount && (
                <p className="text-xs text-muted-foreground">
                  Remaining: ₹{(parseFloat(formData.amount) - parseFloat(formData.paidAmount)).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="edit-expenseDate" className="text-sm font-medium">
              Expense Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-expenseDate"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Vendor / Paid To */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Vendor / Paid To (Optional)</Label>
            <Select
              value={supplierSelection}
              onValueChange={handleSupplierChange}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select vendor or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">— Not specified —</span>
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

            {supplierSelection === "other" && (
              <Input
                value={formData.paidTo}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                placeholder="Enter vendor/person name"
                className="h-11 rounded-xl"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>

          {/* Upload Bill / Invoice */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Upload Bill / Invoice (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            {formData.receiptUrl ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400 flex-1">Bill uploaded</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(formData.receiptUrl, "_blank")}
                  className="h-8 text-blue-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, receiptUrl: "" })}
                  className="h-8 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Bill / Invoice
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Actions - Sticky Footer */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
            ❌ Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateMutation.isPending || !isFormValid}
            className="flex-1 h-11 rounded-xl"
          >
            {updateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : "Update Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}
