import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Bell,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Calendar,
  Image as ImageIcon,
  ArrowUpDown,
  IndianRupee,
  Box,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { VendorProduct, StockMovement, StockAlert } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const USER_ID = "user-1";

// Form schemas
const stockInSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  supplier: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  batchNo: z.string().optional(),
  expiryDate: z.string().optional(),
  warrantyDate: z.string().optional(),
  purchasingCost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const stockOutSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
});

const setAlertSchema = z.object({
  minStockLevel: z.coerce.number().min(0, "Minimum stock level must be at least 0"),
  maxStockLevel: z.coerce.number().min(1, "Maximum stock level must be at least 1"),
  reorderPoint: z.coerce.number().min(0, "Reorder point must be at least 0"),
  reminderDate: z.string().optional(),
  reminderNote: z.string().optional(),
});

type StockInForm = z.infer<typeof stockInSchema>;
type StockOutForm = z.infer<typeof stockOutSchema>;
type SetAlertForm = z.infer<typeof setAlertSchema>;

export default function VendorStockTurnover() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"products" | "movements" | "alerts">("products");
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [stockInSheetOpen, setStockInSheetOpen] = useState(false);
  const [stockOutSheetOpen, setStockOutSheetOpen] = useState(false);
  const [setAlertDialogOpen, setSetAlertDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "high">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "value">("name");

  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalStockValue: number;
    lowStockItems: number;
    highStockItems: number;
    outOfStockItems: number;
    bestSellingItems: number;
    leastSellingItems: number;
  }>({
    queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`],
    enabled: !!vendorId,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-movements`],
    enabled: !!vendorId,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<StockAlert[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-alerts`],
    enabled: !!vendorId,
  });

  // Stock In form
  const stockInForm = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      reason: "",
      supplier: "",
      quantity: 1,
      batchNo: "",
      expiryDate: "",
      warrantyDate: "",
      purchasingCost: 0,
      notes: "",
    },
  });

  // Stock Out form
  const stockOutForm = useForm<StockOutForm>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      reason: "",
      quantity: 1,
      notes: "",
    },
  });

  // Set Alert form
  const setAlertForm = useForm<SetAlertForm>({
    resolver: zodResolver(setAlertSchema),
    defaultValues: {
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 20,
      reminderDate: "",
      reminderNote: "",
    },
  });

  // Stock In mutation
  const stockInMutation = useMutation({
    mutationFn: async (data: StockInForm & { productId: string }) => {
      const batchData = data.batchNo ? {
        vendorProductId: data.productId,
        batchNumber: data.batchNo,
        quantity: data.quantity,
        remainingQuantity: data.quantity,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        manufacturingDate: data.warrantyDate ? new Date(data.warrantyDate) : null,
        costPrice: data.purchasingCost || 0,
        supplier: data.supplier || null,
      } : null;

      if (batchData) {
        await apiRequest("POST", "/api/stock-batches", batchData);
      }

      return await apiRequest("POST", `/api/vendors/${vendorId}/products/${data.productId}/stock-in`, {
        quantity: data.quantity,
        reason: data.reason,
        supplier: data.supplier,
        notes: data.notes,
        userId: USER_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-movements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`] });
      toast({
        title: "✅ Stock Added",
        description: `Added ${stockInForm.getValues().quantity} units successfully`,
      });
      setStockInSheetOpen(false);
      stockInForm.reset();
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
    },
  });

  // Stock Out mutation
  const stockOutMutation = useMutation({
    mutationFn: async (data: StockOutForm & { productId: string }) => {
      return await apiRequest("POST", `/api/vendors/${vendorId}/products/${data.productId}/stock-out`, {
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
        userId: USER_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-movements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`] });
      toast({
        title: "✅ Stock Removed",
        description: `Removed ${stockOutForm.getValues().quantity} units successfully`,
      });
      setStockOutSheetOpen(false);
      stockOutForm.reset();
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove stock",
        variant: "destructive",
      });
    },
  });

  // Set Alert mutation
  const setAlertMutation = useMutation({
    mutationFn: async (data: SetAlertForm & { productId: string }) => {
      return await apiRequest("POST", "/api/stock-configs", {
        vendorProductId: data.productId,
        minStockLevel: data.minStockLevel,
        maxStockLevel: data.maxStockLevel,
        reorderPoint: data.reorderPoint,
        reminderDate: data.reminderDate || null,
        reminderNote: data.reminderNote || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-alerts`] });
      toast({
        title: "✅ Reminder Set",
        description: "Stock alert has been configured",
      });
      setSetAlertDialogOpen(false);
      setAlertForm.reset();
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set reminder",
        variant: "destructive",
      });
    },
  });

  const handleStockIn = (product: VendorProduct) => {
    setSelectedProduct(product);
    stockInForm.reset();
    setStockInSheetOpen(true);
  };

  const handleStockOut = (product: VendorProduct) => {
    setSelectedProduct(product);
    stockOutForm.reset();
    setStockOutSheetOpen(true);
  };

  const handleSetAlert = (product: VendorProduct) => {
    setSelectedProduct(product);
    setAlertForm.reset();
    setSetAlertDialogOpen(true);
  };

  const onStockInSubmit = (data: StockInForm) => {
    if (selectedProduct) {
      stockInMutation.mutate({ ...data, productId: selectedProduct.id });
    }
  };

  const onStockOutSubmit = (data: StockOutForm) => {
    if (selectedProduct) {
      stockOutMutation.mutate({ ...data, productId: selectedProduct.id });
    }
  };

  const onSetAlertSubmit = (data: SetAlertForm) => {
    if (selectedProduct) {
      setAlertMutation.mutate({ ...data, productId: selectedProduct.id });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStockStatus = (product: VendorProduct) => {
    if (product.stock === 0) return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" };
    if (product.stock < 10) return { label: "Low Stock", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" };
    if (product.stock > 100) return { label: "High Stock", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" };
    return { label: "In Stock", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" };
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (stockFilter === "low") return p.stock > 0 && p.stock < 10;
      if (stockFilter === "out") return p.stock === 0;
      if (stockFilter === "high") return p.stock > 100;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock") return b.stock - a.stock;
      if (sortBy === "value") return (b.price * b.stock) - (a.price * a.stock);
      return 0;
    });

  // Group movements by date
  const groupedMovements = movements.reduce((groups, movement) => {
    const date = new Date(movement.createdAt);
    let label = format(date, 'dd MMM yyyy');
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else if (isThisWeek(date)) label = format(date, 'EEEE');
    else if (isThisMonth(date)) label = format(date, 'dd MMMM');
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(movement);
    return groups;
  }, {} as Record<string, StockMovement[]>);

  // Get product name by ID
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getProductImage = (product: VendorProduct) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="md:hidden flex-shrink-0 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Stock Turnover
              </h1>
              <p className="text-xs text-muted-foreground">Inventory & Stock Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFilterOpen(true)}
              className="h-9 w-9"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards - Khatabook Style */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Total Stock Value - Blue */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <IndianRupee className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-90">Stock Value</span>
                </div>
                {analyticsLoading ? (
                  <div className="h-7 w-24 bg-white/20 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(analytics?.totalStockValue || 0)}
                  </p>
                )}
              </div>
            </div>

            {/* Total Products - Purple */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <Box className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-90">Total Products</span>
                </div>
                {productsLoading ? (
                  <div className="h-7 w-24 bg-white/20 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">
                    {products.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                stockFilter === "low" ? "bg-orange-100 border-orange-300 dark:bg-orange-900/30" : "bg-muted/50"
              }`}
            >
              <p className={`text-lg font-bold ${stockFilter === "low" ? "text-orange-600" : "text-orange-500"}`}>
                {analytics?.lowStockItems || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Low</p>
            </button>
            <button
              onClick={() => setStockFilter(stockFilter === "out" ? "all" : "out")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                stockFilter === "out" ? "bg-red-100 border-red-300 dark:bg-red-900/30" : "bg-muted/50"
              }`}
            >
              <p className={`text-lg font-bold ${stockFilter === "out" ? "text-red-600" : "text-red-500"}`}>
                {analytics?.outOfStockItems || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Out</p>
            </button>
            <button
              onClick={() => setStockFilter(stockFilter === "high" ? "all" : "high")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                stockFilter === "high" ? "bg-green-100 border-green-300 dark:bg-green-900/30" : "bg-muted/50"
              }`}
            >
              <p className={`text-lg font-bold ${stockFilter === "high" ? "text-green-600" : "text-green-500"}`}>
                {analytics?.highStockItems || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">High</p>
            </button>
            <button
              onClick={() => setStockFilter("all")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                stockFilter === "all" ? "bg-blue-100 border-blue-300 dark:bg-blue-900/30" : "bg-muted/50"
              }`}
            >
              <p className={`text-lg font-bold ${stockFilter === "all" ? "text-blue-600" : "text-blue-500"}`}>
                {products.length}
              </p>
              <p className="text-[10px] text-muted-foreground">All</p>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="products" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium flex items-center gap-1.5"
              >
                <Package className="h-3.5 w-3.5" />
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="movements" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                History
              </TabsTrigger>
              <TabsTrigger 
                value="alerts" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium flex items-center gap-1.5"
              >
                <Bell className="h-3.5 w-3.5" />
                Alerts
                {alerts.filter(a => a.status === 'active').length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                    {alerts.filter(a => a.status === 'active').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search Bar - Only show on Products tab */}
        {activeTab === "products" && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
        )}

        {/* Sort Options - Only show on Products tab */}
        {activeTab === "products" && (
          <div className="px-4 pb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filteredProducts.length} products
            </span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-auto h-8 text-xs border-0 bg-transparent">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="stock">Stock (High to Low)</SelectItem>
                <SelectItem value="value">Value (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 py-3 pb-24">
        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                  {searchQuery || stockFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Add products to manage your inventory"
                  }
                </p>
                <Button onClick={() => setLocation("/vendor/products/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  const stockWorth = product.price * product.stock;
                  const image = getProductImage(product);

                  return (
                    <Card 
                      key={product.id} 
                      className="overflow-hidden hover:shadow-md transition-all"
                    >
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-24 h-28 md:w-28 md:h-32 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border-r">
                            {image ? (
                              <img 
                                src={image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="text-3xl mb-1">{product.icon}</span>
                                <ImageIcon className="h-3 w-3 text-muted-foreground opacity-50" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 p-3 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                                <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                              </div>
                              <Badge className={`${status.bg} ${status.color} border-0 text-[10px] px-1.5 py-0.5 font-medium flex-shrink-0`}>
                                {status.label}
                              </Badge>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                              <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                                <p className="text-muted-foreground text-[10px]">Qty</p>
                                <p className={`font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : ''}`}>
                                  {product.stock}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                                <p className="text-muted-foreground text-[10px]">Price</p>
                                <p className="font-bold">₹{product.price}</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                                <p className="text-muted-foreground text-[10px]">Worth</p>
                                <p className="font-bold text-blue-600">₹{stockWorth.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex border-t divide-x">
                          <button
                            className="flex-1 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-1.5 transition-colors"
                            onClick={() => handleSetAlert(product)}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Reminder
                          </button>
                          <button
                            className="flex-1 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center justify-center gap-1.5 transition-colors"
                            onClick={() => handleStockIn(product)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Stock In
                          </button>
                          <button
                            className="flex-1 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-1.5 transition-colors"
                            onClick={() => handleStockOut(product)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                            Stock Out
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Movements Tab - Stock History */}
        {activeTab === "movements" && (
          <>
            {movementsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No stock movements</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                  Stock in/out activities will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedMovements).map(([dateLabel, dayMovements]) => (
                  <div key={dateLabel}>
                    <div className="sticky top-0 bg-background z-10 py-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        {dateLabel}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dayMovements.map((movement) => (
                        <Card key={movement.id} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {/* Movement Type Icon */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                movement.movementType === 'in' 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {movement.movementType === 'in' ? (
                                  <TrendingUp className="h-5 w-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-600" />
                                )}
                              </div>

                              {/* Movement Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-sm truncate">
                                    {getProductName(movement.vendorProductId)}
                                  </span>
                                  <Badge 
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${
                                      movement.movementType === 'in' 
                                        ? 'text-green-600 border-green-300' 
                                        : 'text-red-600 border-red-300'
                                    }`}
                                  >
                                    {movement.movementType.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {movement.reason || 'No reason specified'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(new Date(movement.createdAt), 'hh:mm a')}
                                </p>
                              </div>

                              {/* Quantity */}
                              <div className="text-right flex-shrink-0">
                                <span className={`text-lg font-bold ${
                                  movement.movementType === 'in' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {movement.movementType === 'in' ? '+' : '-'}{Math.abs(movement.quantity)}
                                </span>
                                <p className="text-[10px] text-muted-foreground">
                                  {movement.previousStock} → {movement.newStock}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <>
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No alerts</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                  Set stock reminders on products to get notified when stock is low
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Alert Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          alert.status === 'active' 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {alert.status === 'active' ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>

                        {/* Alert Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge 
                              variant={alert.status === 'active' ? 'destructive' : 'default'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {alert.alertType?.replace('_', ' ').toUpperCase() || 'ALERT'}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium truncate">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(alert.createdAt), 'dd MMM yyyy, hh:mm a')}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <Badge 
                          variant="outline"
                          className={`flex-shrink-0 ${
                            alert.status === 'active' 
                              ? 'text-red-600 border-red-300' 
                              : 'text-green-600 border-green-300'
                          }`}
                        >
                          {alert.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stock In Sheet */}
      <Sheet open={stockInSheetOpen} onOpenChange={setStockInSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              Stock In - {selectedProduct?.name}
            </SheetTitle>
            <SheetDescription>Add stock for this product</SheetDescription>
          </SheetHeader>
          <Form {...stockInForm}>
            <form onSubmit={stockInForm.handleSubmit(onStockInSubmit)} className="space-y-4 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockInForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter quantity" 
                          {...field}
                          className="h-12 rounded-xl text-lg font-semibold text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockInForm.control}
                  name="purchasingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          className="h-12 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={stockInForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Return">Customer Return</SelectItem>
                        <SelectItem value="Transfer In">Transfer In</SelectItem>
                        <SelectItem value="Adjustment">Adjustment</SelectItem>
                        <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter supplier name" 
                        {...field}
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockInForm.control}
                  name="batchNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch No.</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Optional" 
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockInForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={stockInForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes..." 
                        {...field}
                        className="rounded-xl"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStockInSheetOpen(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={stockInMutation.isPending}
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700"
                >
                  {stockInMutation.isPending ? "Adding..." : "Add Stock"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Stock Out Sheet */}
      <Sheet open={stockOutSheetOpen} onOpenChange={setStockOutSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Minus className="h-4 w-4 text-red-600" />
              </div>
              Stock Out - {selectedProduct?.name}
            </SheetTitle>
            <SheetDescription>
              Remove stock. Current: {selectedProduct?.stock} units
            </SheetDescription>
          </SheetHeader>
          <Form {...stockOutForm}>
            <form onSubmit={stockOutForm.handleSubmit(onStockOutSubmit)} className="space-y-4 pb-6">
              <FormField
                control={stockOutForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter quantity" 
                        {...field}
                        max={selectedProduct?.stock || 0}
                        className="h-12 rounded-xl text-lg font-semibold text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockOutForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Damage">Damage/Breakage</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Lost">Lost/Theft</SelectItem>
                        <SelectItem value="Transfer Out">Transfer Out</SelectItem>
                        <SelectItem value="Sample">Sample/Giveaway</SelectItem>
                        <SelectItem value="Adjustment">Adjustment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockOutForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes..." 
                        {...field}
                        className="rounded-xl"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStockOutSheetOpen(false)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={stockOutMutation.isPending}
                  className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700"
                >
                  {stockOutMutation.isPending ? "Removing..." : "Remove Stock"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Set Reminder Dialog */}
      <Dialog open={setAlertDialogOpen} onOpenChange={setSetAlertDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              Set Reminder - {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Configure stock alert levels
            </DialogDescription>
          </DialogHeader>
          <Form {...setAlertForm}>
            <form onSubmit={setAlertForm.handleSubmit(onSetAlertSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={setAlertForm.control}
                  name="minStockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Stock Level</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10" 
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={setAlertForm.control}
                  name="reorderPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder At</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="20" 
                          {...field}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={setAlertForm.control}
                name="maxStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Stock Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        {...field}
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={setAlertForm.control}
                name="reminderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={setAlertForm.control}
                name="reminderNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Note</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="E.g., Order from XYZ supplier" 
                        {...field}
                        className="rounded-xl"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSetAlertDialogOpen(false)}
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={setAlertMutation.isPending}
                  className="flex-1 h-11 rounded-xl"
                >
                  {setAlertMutation.isPending ? "Setting..." : "Set Reminder"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Filter & Sort</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 pb-6">
            {/* Stock Status Filter */}
            <div>
              <label className="text-sm font-medium mb-3 block">Stock Status</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={stockFilter === "all" ? "default" : "outline"} 
                  size="sm" 
                  className="justify-start"
                  onClick={() => setStockFilter("all")}
                >
                  All Products
                </Button>
                <Button 
                  variant={stockFilter === "low" ? "default" : "outline"} 
                  size="sm" 
                  className="justify-start"
                  onClick={() => setStockFilter("low")}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                  Low Stock
                </Button>
                <Button 
                  variant={stockFilter === "out" ? "default" : "outline"} 
                  size="sm" 
                  className="justify-start"
                  onClick={() => setStockFilter("out")}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  Out of Stock
                </Button>
                <Button 
                  variant={stockFilter === "high" ? "default" : "outline"} 
                  size="sm" 
                  className="justify-start"
                  onClick={() => setStockFilter("high")}
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  High Stock
                </Button>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium mb-3 block">Sort By</label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={sortBy === "name" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSortBy("name")}
                >
                  Name
                </Button>
                <Button 
                  variant={sortBy === "stock" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSortBy("stock")}
                >
                  Stock
                </Button>
                <Button 
                  variant={sortBy === "value" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSortBy("value")}
                >
                  Value
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setStockFilter("all");
                  setSortBy("name");
                  setFilterOpen(false);
                }}
              >
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
