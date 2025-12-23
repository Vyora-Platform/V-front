import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import type { Expense, Supplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Edit,
  Trash2,
  FileText,
  Building2,
  Repeat,
  ArrowLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  Wallet,
  PieChart,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Eye
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
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

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

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  purchase: { icon: <Receipt className="h-4 w-4" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  rent: { icon: <Building2 className="h-4 w-4" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  salary: { icon: <Wallet className="h-4 w-4" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  utility: { icon: <DollarSign className="h-4 w-4" />, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  maintenance: { icon: <FileText className="h-4 w-4" />, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  marketing: { icon: <TrendingUp className="h-4 w-4" />, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  transport: { icon: <ArrowUpRight className="h-4 w-4" />, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  office_supplies: { icon: <FileText className="h-4 w-4" />, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  insurance: { icon: <CheckCircle className="h-4 w-4" />, color: "text-teal-600", bgColor: "bg-teal-100 dark:bg-teal-900/30" },
  tax: { icon: <Receipt className="h-4 w-4" />, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  loan_payment: { icon: <CreditCard className="h-4 w-4" />, color: "text-rose-600", bgColor: "bg-rose-100 dark:bg-rose-900/30" },
  professional_fees: { icon: <Building2 className="h-4 w-4" />, color: "text-violet-600", bgColor: "bg-violet-100 dark:bg-violet-900/30" },
  software: { icon: <FileText className="h-4 w-4" />, color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30" },
  other: { icon: <FileText className="h-4 w-4" />, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
};

export default function VendorExpenses() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [isRecurringFilter, setIsRecurringFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "recurring" | "analytics">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: [`/api/vendors/${vendorId}/expenses`],
    enabled: !!vendorId,
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: [`/api/vendors/${vendorId}/suppliers`],
    enabled: !!vendorId,
  });

  // Fetch recurring expenses
  const { data: recurringExpenses = [] } = useQuery<Expense[]>({
    queryKey: [`/api/vendors/${vendorId}/expenses/recurring/all`],
    enabled: !!vendorId,
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses/recurring/all`));
      if (!response.ok) throw new Error("Failed to fetch recurring expenses");
      return response.json();
    },
  });

  // Fetch upcoming recurring expenses
  const { data: upcomingRecurring = [] } = useQuery<Expense[]>({
    queryKey: [`/api/vendors/${vendorId}/expenses/recurring/upcoming`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/expenses/recurring/upcoming?daysAhead=30`));
      if (!response.ok) throw new Error("Failed to fetch upcoming recurring expenses");
      return response.json();
    },
    enabled: !!vendorId,
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
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses`] });
      toast({ title: "Expense deleted successfully" });
      setDeleteExpenseId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(e => e.category === categoryFilter);
    }

    if (paymentTypeFilter !== "all") {
      result = result.filter(e => e.paymentType === paymentTypeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter(e => e.status === statusFilter);
    }

    if (supplierFilter !== "all") {
      result = result.filter(e => e.supplierId === supplierFilter);
    }

    if (isRecurringFilter !== "all") {
      result = result.filter(e => e.isRecurring === (isRecurringFilter === "true"));
    }

    if (startDateFilter) {
      result = result.filter(e => new Date(e.expenseDate) >= new Date(startDateFilter));
    }

    if (endDateFilter) {
      result = result.filter(e => new Date(e.expenseDate) <= new Date(endDateFilter));
    }

    return result.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses, searchQuery, categoryFilter, paymentTypeFilter, statusFilter, supplierFilter, isRecurringFilter, startDateFilter, endDateFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpenses = expenses.filter(e =>
      isWithinInterval(new Date(e.expenseDate), { start: thisMonthStart, end: thisMonthEnd })
    );

    const lastMonthExpenses = expenses.filter(e =>
      isWithinInterval(new Date(e.expenseDate), { start: lastMonthStart, end: lastMonthEnd })
    );

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const paidTotal = expenses.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
    const pendingTotal = expenses.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
    const pendingCount = expenses.filter(e => e.status === "pending").length;

    // Calculate month-over-month change
    const monthChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
      : "0";

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topCategory = sortedCategories[0];

    // Payment type breakdown
    const paymentBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.paymentType] = (acc[expense.paymentType] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      thisMonthTotal,
      lastMonthTotal,
      monthChange: parseFloat(monthChange),
      paidTotal,
      pendingTotal,
      pendingCount,
      categoryBreakdown,
      sortedCategories,
      topCategory,
      paymentBreakdown,
      expenseCount: expenses.length,
      recurringCount: recurringExpenses.length,
      upcomingCount: upcomingRecurring.length
    };
  }, [expenses, recurringExpenses, upcomingRecurring]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPaymentTypeFilter("all");
    setStatusFilter("all");
    setSupplierFilter("all");
    setIsRecurringFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || paymentTypeFilter !== "all" ||
    statusFilter !== "all" || supplierFilter !== "all" || isRecurringFilter !== "all" ||
    startDateFilter || endDateFilter;

  // Get supplier name helper
  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.businessName || null;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-5">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-5">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-5">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 h-5">{status}</Badge>;
    }
  };

  // Get category config
  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  };

  if (!vendorId) return <LoadingSpinner />;

  return (
    <div className="flex flex-col min-h-full w-full bg-background">
      {/* Header */}
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
              <h1 className="text-xl md:text-2xl font-bold">Expenses</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Track & manage business expenses</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-10 px-4">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
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
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Expenses</p>
                <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">
                  ₹{stats.totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{stats.expenseCount} records</p>
              </div>
              <div className="p-2.5 bg-blue-200/50 dark:bg-blue-800/50 rounded-xl">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">This Month</p>
                <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">
                  ₹{stats.thisMonthTotal.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {stats.monthChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-[10px] ${stats.monthChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(stats.monthChange)}%
                  </span>
                </div>
              </div>
              <div className="p-2 bg-green-200/50 dark:bg-green-800/50 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
                <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400">
                  ₹{stats.pendingTotal.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{stats.pendingCount} unpaid</p>
              </div>
              <div className="p-2.5 bg-amber-200/50 dark:bg-amber-800/50 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Recurring</p>
                <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {stats.recurringCount}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{stats.upcomingCount} upcoming</p>
              </div>
              <div className="p-2.5 bg-purple-200/50 dark:bg-purple-800/50 rounded-xl">
                <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border-rose-200 dark:border-rose-800 col-span-2 sm:col-span-1 min-h-[var(--card-min-h)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Top Category</p>
                <p className="text-base font-bold text-rose-700 dark:text-rose-400 capitalize">
                  {stats.topCategory ? stats.topCategory[0].replace("_", " ") : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.topCategory ? `₹${stats.topCategory[1].toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="p-2.5 bg-rose-200/50 dark:bg-rose-800/50 rounded-xl">
                <PieChart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 md:px-6 pb-4 flex flex-col max-w-[1440px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex h-auto p-1 w-max min-w-full md:w-full md:grid md:grid-cols-3 mb-4">
              <TabsTrigger value="all" className="gap-1.5 text-sm py-2.5 px-4">
                <Receipt className="h-4 w-4" />
                All Expenses
              </TabsTrigger>
              <TabsTrigger value="recurring" className="gap-1.5 text-sm py-2.5 px-4">
                <Repeat className="h-4 w-4" />
                Recurring
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-sm py-2.5 px-4">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* All Expenses Tab */}
          <TabsContent value="all" className="flex-1 flex flex-col space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl bg-muted/50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-lg"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-primary' : ''}`} />
                </Button>
              </div>

              {/* Expandable Filters */}
              {showFilters && (
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Filters</h3>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-4 md:gap-3">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-10 text-sm shrink-0 w-[130px] md:w-full rounded-lg">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace("_", " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10 text-sm shrink-0 w-[110px] md:w-full rounded-lg">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {EXPENSE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        {PAYMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace("_", " ").toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={isRecurringFilter} onValueChange={setIsRecurringFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="true">Recurring</SelectItem>
                        <SelectItem value="false">One-time</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="date"
                      placeholder="From"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="h-9"
                    />

                    <Input
                      type="date"
                      placeholder="To"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* Expense List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2 pb-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No expenses found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? "Try adjusting your filters" : "Add your first expense to get started"}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    )}
                  </Card>
                ) : (
                  filteredExpenses.map((expense) => {
                    const categoryConfig = getCategoryConfig(expense.category);
                    const supplierName = getSupplierName(expense.supplierId);

                    return (
                      <Card
                        key={expense.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setLocation(`/vendor/expenses/${expense.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl ${categoryConfig.bgColor}`}>
                              <span className={categoryConfig.color}>
                                {categoryConfig.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-foreground truncate">{expense.title}</h3>
                                {getStatusBadge(expense.status)}
                                {expense.isRecurring && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
                                    <Repeat className="h-2.5 w-2.5" />
                                    {expense.recurringFrequency}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {expense.category.replace("_", " ")} • {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                              </p>
                              {(supplierName || expense.paidTo) && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {supplierName || expense.paidTo}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-foreground">₹{expense.amount.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground capitalize">{expense.paymentType.replace("_", " ")}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Recurring Tab */}
          <TabsContent value="recurring" className="flex-1 overflow-auto space-y-4">
            {/* Upcoming */}
            {upcomingRecurring.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Upcoming (Next 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingRecurring.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {expense.nextDueDate && format(new Date(expense.nextDueDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{expense.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground capitalize">{expense.recurringFrequency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Recurring */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  All Recurring Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recurringExpenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Repeat className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recurring expenses set up</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recurringExpenses.map((expense) => {
                      const categoryConfig = getCategoryConfig(expense.category);
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                          onClick={() => setLocation(`/vendor/expenses/${expense.id}`)}
                        >
                          <div className={`p-2 rounded-lg ${categoryConfig.bgColor}`}>
                            <span className={categoryConfig.color}>{categoryConfig.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{expense.title}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {expense.recurringFrequency} • Next: {expense.nextDueDate ? format(new Date(expense.nextDueDate), "MMM d") : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{expense.amount.toLocaleString()}</p>
                            {getStatusBadge(expense.status)}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-auto space-y-4">
            {/* Category Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.sortedCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expense data available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.sortedCategories.map(([category, amount]) => {
                      const config = getCategoryConfig(category);
                      const percentage = ((amount / stats.totalExpenses) * 100).toFixed(1);
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${config.bgColor}`}>
                                <span className={config.color}>{config.icon}</span>
                              </div>
                              <span className="text-sm font-medium capitalize">{category.replace("_", " ")}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold">₹{amount.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground ml-2">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${config.bgColor} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground capitalize mb-1">
                        {method.replace("_", " ")}
                      </p>
                      <p className="font-bold">₹{amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Monthly Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                    <p className="text-xl font-bold">₹{stats.lastMonthTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">This Month</p>
                    <p className="text-xl font-bold text-primary">₹{stats.thisMonthTotal.toLocaleString()}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {stats.monthChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                      <span className={`text-xs ${stats.monthChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stats.monthChange >= 0 ? '+' : ''}{stats.monthChange}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
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
              onClick={() => deleteExpenseId && deleteMutation.mutate(deleteExpenseId)}
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
  const [supplierSelection, setSupplierSelection] = useState<"none" | "other" | string>(
    expense?.supplierId 
      ? expense.supplierId 
      : expense?.paidTo 
        ? "other" 
        : "none"
  );
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

      console.log("📤 Sending expense data:", JSON.stringify(data, null, 2));

      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Expense creation failed:", errorData);
        throw new Error(errorData.error || "Failed to save expense");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Expense saved successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses/recurring/all`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses/recurring/upcoming`] });
      toast({
        title: expense ? "Expense updated" : "Expense created",
        description: "Successfully saved expense",
      });
      onClose();
    },
    onError: (error: Error) => {
      console.error("❌ Expense mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save expense",
        variant: "destructive",
      });
    },
  });

  const handleSupplierChange = (value: string) => {
    setSupplierSelection(value);
    if (value === "none") {
      setFormData({ ...formData, supplierId: "", paidTo: "" });
    } else if (value === "other") {
      setFormData({ ...formData, supplierId: "" });
    } else {
      // Selected a supplier
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

    createMutation.mutate(payload);
  };

  const isFormValid = formData.title && formData.category && formData.amount && 
    formData.paymentType && formData.status && 
    (!formData.isRecurring || formData.recurringFrequency);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          {expense ? "Edit Expense" : "Add New Expense"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Office Rent - January"
            className="h-11"
          />
        </div>

        {/* Amount & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
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
            <Label htmlFor="expenseDate" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expenseDate"
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
                <Label htmlFor="paidTo" className="text-sm">
                  Enter Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="paidTo"
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
          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
          <Textarea
            id="description"
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
            <Label htmlFor="department" className="text-sm font-medium">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Sales, HR"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="text-sm font-medium">Project ID</Label>
            <Input
              id="projectId"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              placeholder="e.g., PRJ-001"
              className="h-10"
            />
          </div>
        </div>

        {/* Internal Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">Internal Notes</Label>
          <Textarea
            id="notes"
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
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked as boolean })
                }
              />
              <div>
                <Label htmlFor="isRecurring" className="cursor-pointer font-medium">
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
                  <Label htmlFor="nextDueDate" className="text-sm font-medium">Next Due Date</Label>
                  <Input
                    id="nextDueDate"
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
            disabled={createMutation.isPending || !isFormValid}
            className="min-w-[120px]"
          >
            {createMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : expense ? "Update Expense" : "Create Expense"}
          </Button>
        </div>
      </form>
    </>
  );
}
