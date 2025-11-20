import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  FileText,
  Building2,
  Repeat,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const EXPENSE_CATEGORIES = [
  "purchase",
  "rent",
  "salary",
  "utility",
  "maintenance",
  "marketing",
  "transport",
  "office_supplies",
  "insurance",
  "tax",
  "loan_payment",
  "professional_fees",
  "software",
  "other",
];

const PAYMENT_TYPES = ["cash", "upi", "card", "bank_transfer", "cheque", "wallet"];
const EXPENSE_STATUSES = ["paid", "pending", "cancelled"];
const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

export default function VendorExpenses() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [isRecurringFilter, setIsRecurringFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  // Fetch expenses with filters
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: [
      "/api/vendors",
      vendorId,
      "expenses",
      categoryFilter,
      paymentTypeFilter,
      statusFilter,
      supplierFilter,
      departmentFilter,
      isRecurringFilter,
      startDateFilter,
      endDateFilter,
      searchQuery,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (paymentTypeFilter && paymentTypeFilter !== "all") params.append("paymentType", paymentTypeFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (supplierFilter && supplierFilter !== "all") params.append("supplierId", supplierFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      if (isRecurringFilter && isRecurringFilter !== "all") params.append("isRecurring", isRecurringFilter);
      if (startDateFilter) params.append("startDate", startDateFilter);
      if (endDateFilter) params.append("endDate", endDateFilter);

      const response = await fetch(
        `/api/vendors/${vendorId}/expenses?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/vendors", vendorId, "suppliers"],
    enabled: !!vendorId,
  });

  // Fetch recurring expenses
  const { data: recurringExpenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/vendors", vendorId, "expenses/recurring/all"],
    enabled: !!vendorId,
    queryFn: async () => {
      const response = await fetch(
        `/api/vendors/${vendorId}/expenses/recurring/all`
      );
      if (!response.ok) throw new Error("Failed to fetch recurring expenses");
      return response.json();
    },
  });

  // Fetch upcoming recurring expenses
  const { data: upcomingRecurring = [] } = useQuery<Expense[]>({
    queryKey: ["/api/vendors", vendorId, "expenses/recurring/upcoming"],
    queryFn: async () => {
      const response = await fetch(
        `/api/vendors/${vendorId}/expenses/recurring/upcoming?daysAhead=30`
      );
      if (!response.ok)
        throw new Error("Failed to fetch upcoming recurring expenses");
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses/${id}`), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "suppliers"] });
      toast({ title: "Expense deleted successfully" });
      setDeleteExpenseId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  // Calculate summary stats
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses
    .filter((e) => e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b - a
  )[0];

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setPaymentTypeFilter("");
    setStatusFilter("");
    setSupplierFilter("");
    setDepartmentFilter("");
    setIsRecurringFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter ||
    paymentTypeFilter ||
    statusFilter ||
    supplierFilter ||
    departmentFilter ||
    isRecurringFilter ||
    startDateFilter ||
    endDateFilter;


  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

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
            <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">Expenses</h1>
            <p className="text-xs text-muted-foreground">Track business expenses</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-expense">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <ExpenseDialog
              expense={null}
              suppliers={suppliers}
              vendorId={vendorId}
              onClose={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold" data-testid="text-total-expenses">
              ₹{totalExpenses.toLocaleString()}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Paid</p>
            <p className="text-lg font-bold text-green-600">
              ₹{paidExpenses.toLocaleString()}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-bold text-orange-600">
              ₹{pendingExpenses.toLocaleString()}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Top Category</p>
            <p className="text-lg font-bold">
              {topCategory ? `₹${topCategory[1].toLocaleString()}` : "₹0"}
            </p>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-expenses">
              All Expenses
            </TabsTrigger>
            <TabsTrigger value="recurring" data-testid="tab-recurring">
              Recurring ({recurringExpenses.length})
            </TabsTrigger>
          </TabsList>

          {/* All Expenses Tab */}
          <TabsContent value="all" className="space-y-4">
            {/* Search and Filters */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Search & Filters
                </h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div>
                {/* Filters - Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                  <div className="relative min-w-[250px] flex-1 snap-start">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses by title, category, paid to..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace("_", " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                    <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-payment-filter">
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payments</SelectItem>
                      {PAYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] flex-shrink-0 snap-start" data-testid="select-status-filter">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {EXPENSE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-supplier-filter">
                      <SelectValue placeholder="Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Department"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-[140px] flex-shrink-0 snap-start"
                    data-testid="input-department-filter"
                  />

                  <Select value={isRecurringFilter} onValueChange={setIsRecurringFilter}>
                    <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-recurring-filter">
                      <SelectValue placeholder="Recurring" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All expenses</SelectItem>
                      <SelectItem value="true">Recurring only</SelectItem>
                      <SelectItem value="false">One-time only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-[160px] flex-shrink-0 snap-start"
                    data-testid="input-start-date-filter"
                  />

                  <Input
                    type="date"
                    placeholder="End Date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-[160px] flex-shrink-0 snap-start"
                    data-testid="input-end-date-filter"
                  />
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  Expenses ({expenses.length})
                  {isLoading && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading...
                    </span>
                  )}
                </h2>
              </div>
              <div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[150px]">Title</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[120px]">Paid To</TableHead>
                        <TableHead className="min-w-[100px]">Amount</TableHead>
                        <TableHead className="min-w-[100px]">Payment</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No expenses found
                          </p>
                          {hasActiveFilters && (
                            <Button
                              variant="ghost"
                              onClick={clearFilters}
                              className="mt-2"
                            >
                              Clear filters
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => {
                        const supplier = suppliers.find(
                          (s) => s.id === expense.supplierId
                        );
                        return (
                          <TableRow
                            key={expense.id}
                            data-testid={`row-expense-${expense.id}`}
                          >
                            <TableCell>
                              {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {expense.title}
                            </TableCell>
                            <TableCell className="capitalize">
                              {expense.category.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              {supplier ? (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-muted-foreground" />
                                  {supplier.businessName}
                                </div>
                              ) : (
                                expense.paidTo || "-"
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₹{expense.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="capitalize">
                              {expense.paymentType.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  expense.status === "paid"
                                    ? "default"
                                    : expense.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                                data-testid={`badge-status-${expense.id}`}
                              >
                                {expense.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {expense.isRecurring && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 w-fit"
                                >
                                  <Repeat className="w-3 h-3" />
                                  {expense.recurringFrequency}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingExpense(expense)}
                                      data-testid={`button-edit-${expense.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <ExpenseDialog
                                      expense={expense}
                                      suppliers={suppliers}
                                      vendorId={vendorId}
                                      onClose={() => setEditingExpense(null)}
                                    />
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteExpenseId(expense.id)}
                                  data-testid={`button-delete-${expense.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Recurring Expenses Tab */}
          <TabsContent value="recurring" className="space-y-4">
            {/* Upcoming Recurring */}
            {upcomingRecurring.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Upcoming Recurring Expenses (Next 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingRecurring.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`card-upcoming-${expense.id}`}
                      >
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Due:{" "}
                            {expense.nextDueDate &&
                              format(new Date(expense.nextDueDate), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{expense.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {expense.recurringFrequency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Recurring Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>All Recurring Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Title</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[100px]">Amount</TableHead>
                        <TableHead className="min-w-[100px]">Frequency</TableHead>
                        <TableHead className="min-w-[120px]">Next Due</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Repeat className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No recurring expenses
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recurringExpenses.map((expense) => (
                        <TableRow
                          key={expense.id}
                          data-testid={`row-recurring-${expense.id}`}
                        >
                          <TableCell className="font-medium">
                            {expense.title}
                          </TableCell>
                          <TableCell className="capitalize">
                            {expense.category.replace("_", " ")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{expense.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {expense.recurringFrequency}
                          </TableCell>
                          <TableCell>
                            {expense.nextDueDate
                              ? format(new Date(expense.nextDueDate), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                expense.status === "paid" ? "default" : "secondary"
                              }
                            >
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingExpense(expense)}
                                    data-testid={`button-edit-recurring-${expense.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <ExpenseDialog
                                    expense={expense}
                                    suppliers={suppliers}
                                    vendorId={vendorId}
                                    onClose={() => setEditingExpense(null)}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteExpenseId(expense.id)}
                                data-testid={`button-delete-recurring-${expense.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteExpenseId}
        onOpenChange={() => setDeleteExpenseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteExpenseId && deleteMutation.mutate(deleteExpenseId)}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Expense Add/Edit Dialog Component
interface ExpenseDialogProps {
  expense: Expense | null;
  suppliers: Supplier[];
  vendorId: string;
  onClose: () => void;
}

function ExpenseDialog({ expense, suppliers, vendorId, onClose }: ExpenseDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: expense?.title || "",
    category: expense?.category || "",
    amount: expense?.amount?.toString() || "",
    expenseDate: expense?.expenseDate
      ? format(new Date(expense.expenseDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    paymentType: expense?.paymentType || "",
    status: expense?.status || "pending",
    paidTo: expense?.paidTo || "",
    supplierId: expense?.supplierId || "",
    description: expense?.description || "",
    notes: expense?.notes || "",
    department: expense?.department || "",
    projectId: expense?.projectId || "",
    isRecurring: expense?.isRecurring || false,
    recurringFrequency: expense?.recurringFrequency || "",
    nextDueDate: expense?.nextDueDate
      ? format(new Date(expense.nextDueDate), "yyyy-MM-dd")
      : "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = expense
        ? `/api/vendors/${vendorId}/expenses/${expense.id}`
        : `/api/vendors/${vendorId}/expenses`;
      const method = expense ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "suppliers"] });
      toast({
        title: expense ? "Expense updated" : "Expense created",
        description: "Successfully saved expense",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      title: formData.title,
      category: formData.category,
      amount: parseFloat(formData.amount),
      expenseDate: new Date(formData.expenseDate),
      paymentType: formData.paymentType,
      status: formData.status,
      paidTo: formData.paidTo || undefined,
      supplierId: formData.supplierId || undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
      department: formData.department || undefined,
      projectId: formData.projectId || undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring
        ? formData.recurringFrequency
        : undefined,
      nextDueDate:
        formData.isRecurring && formData.nextDueDate
          ? new Date(formData.nextDueDate)
          : undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle data-testid="text-dialog-title">
          {expense ? "Edit Expense" : "Add New Expense"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Office Rent - January"
              required
              data-testid="input-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              required
            >
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0.00"
              required
              data-testid="input-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseDate">Date *</Label>
            <Input
              id="expenseDate"
              type="date"
              value={formData.expenseDate}
              onChange={(e) =>
                setFormData({ ...formData, expenseDate: e.target.value })
              }
              required
              data-testid="input-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type *</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) =>
                setFormData({ ...formData, paymentType: value })
              }
              required
            >
              <SelectTrigger id="paymentType" data-testid="select-payment-type">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
              required
            >
              <SelectTrigger id="status" data-testid="select-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier (Optional)</Label>
            <Select
              value={formData.supplierId || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, supplierId: value === "none" ? "" : value, paidTo: "" })
              }
            >
              <SelectTrigger id="supplier" data-testid="select-supplier">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Paid To (if no supplier selected) */}
        {!formData.supplierId && (
          <div className="space-y-2">
            <Label htmlFor="paidTo">Paid To</Label>
            <Input
              id="paidTo"
              value={formData.paidTo}
              onChange={(e) =>
                setFormData({ ...formData, paidTo: e.target.value })
              }
              placeholder="Person/company name"
              data-testid="input-paid-to"
            />
          </div>
        )}

        {/* Description & Notes */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of the expense"
            rows={2}
            data-testid="input-description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Private notes for internal use"
            rows={2}
            data-testid="input-notes"
          />
        </div>

        {/* Tags & Categorization */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder="e.g., Sales, Operations, HR"
              data-testid="input-department"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              placeholder="e.g., PRJ-001"
              data-testid="input-project-id"
            />
          </div>
        </div>

        {/* Recurring Options */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isRecurring: checked as boolean })
              }
              data-testid="checkbox-recurring"
            />
            <Label htmlFor="isRecurring" className="cursor-pointer">
              This is a recurring expense
            </Label>
          </div>

          {formData.isRecurring && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={formData.recurringFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recurringFrequency: value })
                  }
                  required={formData.isRecurring}
                >
                  <SelectTrigger id="frequency" data-testid="select-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, nextDueDate: e.target.value })
                  }
                  data-testid="input-next-due-date"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            data-testid="button-submit"
          >
            {createMutation.isPending
              ? "Saving..."
              : expense
              ? "Update Expense"
              : "Create Expense"}
          </Button>
        </div>
      </form>
    </>
  );
}
