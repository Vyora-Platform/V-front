import { useState, useMemo, useRef } from "react";
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
  Eye,
  Download,
  FileSpreadsheet,
  Upload,
  X,
  Zap,
  Wifi,
  Car,
  Users,
  Megaphone,
  Package,
  Wrench,
  HelpCircle,
  IndianRupee,
  RefreshCw,
  MoreHorizontal
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
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

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
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  rent: { icon: <Building2 className="h-4 w-4" />, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  electricity: { icon: <Zap className="h-4 w-4" />, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  internet_mobile: { icon: <Wifi className="h-4 w-4" />, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  transportation: { icon: <Car className="h-4 w-4" />, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  salaries: { icon: <Users className="h-4 w-4" />, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  marketing: { icon: <Megaphone className="h-4 w-4" />, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  office_supplies: { icon: <Package className="h-4 w-4" />, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  maintenance: { icon: <Wrench className="h-4 w-4" />, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  other: { icon: <HelpCircle className="h-4 w-4" />, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
};

export default function VendorExpenses() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "dashboard" | "vendors" | "reports">("list");
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: [`/api/vendors/${vendorId}/expenses`],
    enabled: !!vendorId,
  });

  // Fetch suppliers for dropdown and vendor tracking
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: [`/api/vendors/${vendorId}/suppliers`],
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

    if (paymentModeFilter !== "all") {
      result = result.filter(e => e.paymentType === paymentModeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter(e => e.status === statusFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateRangeFilter === "today") {
      result = result.filter(e => isWithinInterval(new Date(e.expenseDate), { start: startOfDay(now), end: endOfDay(now) }));
    } else if (dateRangeFilter === "week") {
      result = result.filter(e => isWithinInterval(new Date(e.expenseDate), { start: startOfWeek(now), end: endOfWeek(now) }));
    } else if (dateRangeFilter === "month") {
      result = result.filter(e => isWithinInterval(new Date(e.expenseDate), { start: startOfMonth(now), end: endOfMonth(now) }));
    } else if (dateRangeFilter === "custom" && startDateFilter && endDateFilter) {
      result = result.filter(e => isWithinInterval(new Date(e.expenseDate), { start: new Date(startDateFilter), end: new Date(endDateFilter) }));
    }

    return result.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses, searchQuery, categoryFilter, paymentModeFilter, statusFilter, dateRangeFilter, startDateFilter, endDateFilter]);

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

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const paidTotal = expenses.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
    const unpaidTotal = expenses.filter(e => e.status === "unpaid").reduce((sum, e) => sum + e.amount, 0);
    const partiallyPaidTotal = expenses.filter(e => e.status === "partially_paid").reduce((sum, e) => sum + e.amount, 0);
    const partiallyPaidPaidAmount = expenses.filter(e => e.status === "partially_paid").reduce((sum, e) => sum + (e.paidAmount || 0), 0);

    const paidCount = expenses.filter(e => e.status === "paid").length;
    const unpaidCount = expenses.filter(e => e.status === "unpaid").length;
    const partiallyPaidCount = expenses.filter(e => e.status === "partially_paid").length;

    // Calculate month-over-month change
    const monthChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
      : "0";

    // Category breakdown for this month
    const categoryBreakdown = thisMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthExpenses = expenses.filter(e =>
        isWithinInterval(new Date(e.expenseDate), { start: monthStart, end: monthEnd })
      );
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      monthlyTrend.push({
        month: format(monthStart, "MMM"),
        amount: total,
      });
    }

    // Payment mode breakdown
    const paymentBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.paymentType] = (acc[expense.paymentType] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Vendor-wise breakdown
    const vendorBreakdown: Record<string, { total: number; paid: number; pending: number; lastPayment: Date | null }> = {};
    expenses.forEach(expense => {
      const vendorKey = expense.supplierId || expense.paidTo || "Unknown";
      if (!vendorBreakdown[vendorKey]) {
        vendorBreakdown[vendorKey] = { total: 0, paid: 0, pending: 0, lastPayment: null };
      }
      vendorBreakdown[vendorKey].total += expense.amount;
      if (expense.status === "paid") {
        vendorBreakdown[vendorKey].paid += expense.amount;
      } else if (expense.status === "partially_paid") {
        vendorBreakdown[vendorKey].paid += expense.paidAmount || 0;
        vendorBreakdown[vendorKey].pending += expense.amount - (expense.paidAmount || 0);
      } else {
        vendorBreakdown[vendorKey].pending += expense.amount;
      }
      const expDate = new Date(expense.expenseDate);
      if (!vendorBreakdown[vendorKey].lastPayment || expDate > vendorBreakdown[vendorKey].lastPayment) {
        vendorBreakdown[vendorKey].lastPayment = expDate;
      }
    });

    return {
      thisMonthTotal,
      lastMonthTotal,
      monthChange: parseFloat(monthChange),
      paidTotal,
      unpaidTotal,
      partiallyPaidTotal,
      partiallyPaidPaidAmount,
      paidCount,
      unpaidCount,
      partiallyPaidCount,
      categoryBreakdown,
      sortedCategories,
      monthlyTrend,
      paymentBreakdown,
      vendorBreakdown,
      expenseCount: expenses.length,
    };
  }, [expenses]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPaymentModeFilter("all");
    setStatusFilter("all");
    setDateRangeFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || paymentModeFilter !== "all" ||
    statusFilter !== "all" || dateRangeFilter !== "all";

  // Get supplier name helper
  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.businessName || null;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = PAID_STATUSES.find(s => s.value === status) || PAID_STATUSES[0];
    return (
      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-[10px] px-1.5 py-0 h-5`}>
        {statusConfig.label}
      </Badge>
    );
  };

  // Get category config
  const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  };

  // Export functions
  const exportToCSV = () => {
    const result = canPerformAction('export');
    if (!result.allowed) {
      setBlockedAction('export');
      setShowUpgradeModal(true);
      return;
    }
    
    const headers = ["Date", "Title", "Category", "Vendor", "Amount", "Paid Status", "Paid Amount", "Payment Mode", "Notes"];
    const rows = filteredExpenses.map(e => [
      format(new Date(e.expenseDate), "yyyy-MM-dd"),
      e.title,
      e.category,
      getSupplierName(e.supplierId) || e.paidTo || "",
      e.amount.toString(),
      e.status,
      (e.paidAmount || 0).toString(),
      e.paymentType,
      e.notes || ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export successful", description: "Expenses exported to CSV" });
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
              <h1 className="text-xl md:text-2xl font-bold">Expense Management</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Track & control business expenses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-9 hidden sm:flex">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel/CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="gap-1.5 h-10 px-4"
                  onClick={(e) => {
                    if (!isPro) {
                      e.preventDefault();
                      handleProAction('create', () => {});
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Expense</span>
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-0">
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
      </div>

      {/* Stats Cards - Summary Dashboard */}
      <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">💰 This Month</p>
                <p className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-400 truncate">
                  ₹{stats.thisMonthTotal.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.monthChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-[10px] ${stats.monthChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(stats.monthChange)}% vs last month
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-xl shrink-0">
                <IndianRupee className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">✅ Paid</p>
                <p className="text-lg md:text-xl font-bold text-green-700 dark:text-green-400 truncate">
                  ₹{stats.paidTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{stats.paidCount} expenses</p>
              </div>
              <div className="p-2 bg-green-200/50 dark:bg-green-800/50 rounded-xl shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">⏳ Unpaid</p>
                <p className="text-lg md:text-xl font-bold text-red-700 dark:text-red-400 truncate">
                  ₹{stats.unpaidTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{stats.unpaidCount} pending</p>
              </div>
              <div className="p-2 bg-red-200/50 dark:bg-red-800/50 rounded-xl shrink-0">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">⚠️ Partial</p>
                <p className="text-lg md:text-xl font-bold text-amber-700 dark:text-amber-400 truncate">
                  ₹{stats.partiallyPaidTotal.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">₹{stats.partiallyPaidPaidAmount.toLocaleString()} paid</p>
              </div>
              <div className="p-2 bg-amber-200/50 dark:bg-amber-800/50 rounded-xl shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 md:px-6 pb-4 flex flex-col max-w-[1440px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex h-auto p-1 w-max min-w-full md:w-full md:grid md:grid-cols-4 mb-4">
              <TabsTrigger value="list" className="gap-1.5 text-sm py-2.5 px-4">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Expense</span> List
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1.5 text-sm py-2.5 px-4">
                <PieChart className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-1.5 text-sm py-2.5 px-4">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Vendor</span> Tracking
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1.5 text-sm py-2.5 px-4">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Expense List Tab */}
          <TabsContent value="list" className="flex-1 flex flex-col space-y-4 mt-0">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl bg-muted/50 h-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-10 w-10 shrink-0 rounded-lg ${hasActiveFilters ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-primary' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-lg sm:hidden"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4" />
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {PAID_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
                      <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue placeholder="Payment Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modes</SelectItem>
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {dateRangeFilter === "custom" && (
                      <div className="col-span-2 md:col-span-1 flex gap-2">
                        <Input
                          type="date"
                          placeholder="From"
                          value={startDateFilter}
                          onChange={(e) => setStartDateFilter(e.target.value)}
                          className="h-10 text-sm"
                        />
                        <Input
                          type="date"
                          placeholder="To"
                          value={endDateFilter}
                          onChange={(e) => setEndDateFilter(e.target.value)}
                          className="h-10 text-sm"
                        />
                      </div>
                    )}
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
                  <Card className="p-8 text-center rounded-xl">
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
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Card className="rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Expense Title</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Category</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Vendor</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Payment</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredExpenses.map((expense) => {
                                const categoryConfig = getCategoryConfig(expense.category);
                                const supplierName = getSupplierName(expense.supplierId);
                                const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category;
                                const paymentLabel = PAYMENT_MODES.find(m => m.value === expense.paymentType)?.label || expense.paymentType;

                                return (
                                  <tr key={expense.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setLocation(`/vendor/expenses/${expense.id}`)}>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                      {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                                    </td>
                                    <td className="py-3 px-4">
                                      <p className="font-medium text-foreground truncate max-w-[200px]">{expense.title}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${categoryConfig.bgColor}`}>
                                          <span className={categoryConfig.color}>{categoryConfig.icon}</span>
                                        </div>
                                        <span className="text-sm">{categoryLabel}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-[150px]">
                                      {supplierName || expense.paidTo || "—"}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <p className="font-semibold text-foreground">₹{expense.amount.toLocaleString()}</p>
                                      {expense.status === "partially_paid" && expense.paidAmount && (
                                        <p className="text-xs text-green-600">Paid: ₹{expense.paidAmount.toLocaleString()}</p>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      {getStatusBadge(expense.status)}
                                    </td>
                                    <td className="py-3 px-4 text-center text-sm text-muted-foreground capitalize">
                                      {paymentLabel}
                                    </td>
                                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => setLocation(`/vendor/expenses/${expense.id}`)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={() => handleProAction('delete', () => setDeleteExpenseId(expense.id))}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          {!isPro && <Lock className="w-2.5 h-2.5 absolute top-0 right-0" />}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-2">
                      {filteredExpenses.map((expense) => {
                        const categoryConfig = getCategoryConfig(expense.category);
                        const supplierName = getSupplierName(expense.supplierId);

                        return (
                          <Card
                            key={expense.id}
                            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow rounded-xl"
                            onClick={() => setLocation(`/vendor/expenses/${expense.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-xl ${categoryConfig.bgColor} shrink-0`}>
                                  <span className={categoryConfig.color}>
                                    {categoryConfig.icon}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="font-semibold text-foreground truncate">{expense.title}</h3>
                                    {getStatusBadge(expense.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category} • {format(new Date(expense.expenseDate), "MMM d, yyyy")}
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
                                  {expense.status === "partially_paid" && expense.paidAmount && (
                                    <p className="text-xs text-green-600">Paid: ₹{expense.paidAmount.toLocaleString()}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground capitalize mt-1">
                                    {PAYMENT_MODES.find(m => m.value === expense.paymentType)?.label || expense.paymentType}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="flex-1 overflow-auto space-y-4 mt-0">
            {/* Category Breakdown - Pie Chart Style */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Expenses by Category (This Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.sortedCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expense data for this month
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.sortedCategories.map(([category, amount]) => {
                      const config = getCategoryConfig(category);
                      const percentage = stats.thisMonthTotal > 0 ? ((amount / stats.thisMonthTotal) * 100).toFixed(1) : "0";
                      const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                                <span className={config.color}>{config.icon}</span>
                              </div>
                              <span className="text-sm font-medium">{categoryLabel}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold">₹{amount.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground ml-2">({percentage}%)</span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${config.bgColor} rounded-full transition-all duration-500`}
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

            {/* Monthly Trend - Bar Chart Style */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Monthly Expense Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2 h-40">
                  {stats.monthlyTrend.map((data, index) => {
                    const maxAmount = Math.max(...stats.monthlyTrend.map(d => d.amount), 1);
                    const heightPercentage = (data.amount / maxAmount) * 100;
                    const isCurrentMonth = index === stats.monthlyTrend.length - 1;
                    return (
                      <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground mb-1">
                          ₹{(data.amount / 1000).toFixed(0)}k
                        </span>
                        <div className="w-full max-w-[40px] relative" style={{ height: "100px" }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                              isCurrentMonth ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                            style={{ height: `${Math.max(heightPercentage, 4)}%` }}
                          />
                        </div>
                        <span className={`text-xs ${isCurrentMonth ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(stats.paymentBreakdown).map(([method, amount]) => {
                    const modeConfig = PAYMENT_MODES.find(m => m.value === method);
                    const Icon = modeConfig?.icon || Wallet;
                    return (
                      <div key={method} className="p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground capitalize">
                            {modeConfig?.label || method.replace("_", " ")}
                          </span>
                        </div>
                        <p className="font-bold">₹{amount.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Monthly Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                    <p className="text-xl font-bold">₹{stats.lastMonthTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-xl text-center">
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

          {/* Vendor Tracking Tab */}
          <TabsContent value="vendors" className="flex-1 overflow-auto space-y-4 mt-0">
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Vendor-wise Expense Tracking
                </CardTitle>
                <CardDescription>Track payments to each vendor/supplier</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.vendorBreakdown).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vendor data available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.vendorBreakdown)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([vendorKey, data]) => {
                        const supplierInfo = suppliers.find(s => s.id === vendorKey);
                        const vendorName = supplierInfo?.businessName || vendorKey;
                        return (
                          <Card key={vendorKey} className="p-4 rounded-xl">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-semibold truncate">{vendorName}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Last payment: {data.lastPayment ? format(data.lastPayment, "MMM d, yyyy") : "—"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold">₹{data.total.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-green-600 font-semibold">₹{data.paid.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Paid</p>
                              </div>
                              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-red-600 font-semibold">₹{data.pending.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="flex-1 overflow-auto space-y-4 mt-0">
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Expense Reports
                </CardTitle>
                <CardDescription>Generate and export expense reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Reports */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card 
                    className="p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setDateRangeFilter("today");
                      setActiveTab("list");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Daily Report</h4>
                        <p className="text-xs text-muted-foreground">Today's expenses</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </div>
                  </Card>

                  <Card 
                    className="p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setDateRangeFilter("month");
                      setActiveTab("list");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Monthly Report</h4>
                        <p className="text-xs text-muted-foreground">This month's expenses</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </div>
                  </Card>

                  <Card 
                    className="p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setActiveTab("dashboard");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <PieChart className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Category Report</h4>
                        <p className="text-xs text-muted-foreground">Expenses by category</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </div>
                  </Card>

                  <Card 
                    className="p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setActiveTab("vendors");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                        <Building2 className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Vendor Report</h4>
                        <p className="text-xs text-muted-foreground">Expenses by vendor</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </div>
                  </Card>
                </div>

                {/* Export Options */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Export Options</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start gap-2 h-12" onClick={exportToCSV}>
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium">Export to Excel</p>
                        <p className="text-xs text-muted-foreground">Download as CSV file</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-12" disabled>
                      <FileText className="h-5 w-5 text-red-600" />
                      <div className="text-left">
                        <p className="font-medium">Export to PDF</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-primary">{stats.expenseCount}</p>
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-primary">{Object.keys(stats.vendorBreakdown).length}</p>
                    <p className="text-xs text-muted-foreground">Vendors/Payees</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">₹{(stats.paidTotal + stats.partiallyPaidPaidAmount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">₹{(stats.unpaidTotal + stats.partiallyPaidTotal - stats.partiallyPaidPaidAmount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Pending</p>
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

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
      />
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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
    paidAmount: expense?.paidAmount?.toString() || "",
    expenseDate: expense?.expenseDate
      ? format(new Date(expense.expenseDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    paymentType: expense?.paymentType || "",
    status: expense?.status || "paid",
    paidTo: expense?.paidTo || "",
    supplierId: expense?.supplierId || "",
    notes: expense?.notes || "",
    receiptUrl: expense?.receiptUrl || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = expense
        ? `/api/vendors/${vendorId}/expenses/${expense.id}`
        : `/api/vendors/${vendorId}/expenses`;
      const method = expense ? "PATCH" : "POST";

      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save expense");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/expenses`] });
      toast({
        title: expense ? "Expense updated" : "Expense added",
        description: "Successfully saved expense",
      });
      onClose();
    },
    onError: (error: Error) => {
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

    createMutation.mutate(payload);
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
            <Receipt className="h-5 w-5 text-primary" />
            {expense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Expense Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Expense Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
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
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
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
              <Label htmlFor="paidAmount" className="text-sm font-medium">
                Paid Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="paidAmount"
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
            <Label htmlFor="expenseDate" className="text-sm font-medium">
              Expense Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expenseDate"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Vendor / Paid To (Optional) */}
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

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
              className="resize-none rounded-xl"
            />
          </div>

          {/* Upload Bill / Invoice (Optional) */}
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
                <span className="text-sm text-green-700 dark:text-green-400 flex-1">Bill uploaded successfully</span>
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
            disabled={createMutation.isPending || !isFormValid}
            className="flex-1 h-11 rounded-xl"
          >
            {createMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>➕ {expense ? "Update" : "Save"} Expense</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
