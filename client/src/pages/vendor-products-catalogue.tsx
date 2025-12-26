import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Trash2, Package, Search, Plus, ArrowLeft, Eye, ImageIcon, Power, MoreVertical, X, ChevronRight, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { VendorProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { LoadingSpinner } from "@/components/AuthGuard";
import { Lock } from "lucide-react";

// Get short abbreviation for units
const getUnitAbbreviation = (unit: string): string => {
  const abbrevMap: Record<string, string> = {
    'kilogram': 'kg', 'Kilogram': 'kg', 'kg': 'kg',
    'gram': 'g', 'Gram': 'g', 'g': 'g',
    'piece': 'pc', 'Piece': 'pc', 'pieces': 'pcs', 'Pieces': 'pcs', 'pc': 'pc', 'pcs': 'pcs',
    'liter': 'L', 'Liter': 'L', 'litre': 'L', 'Litre': 'L', 'L': 'L',
    'milliliter': 'ml', 'Milliliter': 'ml', 'ml': 'ml',
    'meter': 'm', 'Meter': 'm', 'm': 'm',
    'dozen': 'dz', 'Dozen': 'dz',
    'box': 'box', 'Box': 'box',
    'pack': 'pack', 'Pack': 'pack',
    'packet': 'pkt', 'Packet': 'pkt',
    'bottle': 'btl', 'Bottle': 'btl',
    'can': 'can', 'Can': 'can',
    'unit': 'unit', 'Unit': 'unit',
  };
  return abbrevMap[unit] || unit?.toLowerCase() || 'unit';
};

export default function VendorProductsCatalogue() {
  const [, setLocation] = useLocation();
  const { vendorId } = useAuth();
  const { toast } = useToast();
  
  // Pro subscription check
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<'create' | 'update' | 'delete'>('create');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<VendorProduct | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products - sorted by newest first (createdAt DESC)
  const { data: vendorProducts = [], isLoading } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  // Sort products by newest first
  const sortedProducts = useMemo(() => {
    return [...vendorProducts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [vendorProducts]);

  // Get unique filter options that have at least 1 product
  const filterOptions = useMemo(() => {
    const categories: Record<string, number> = {};
    const subcategories: Record<string, number> = {};
    const brands: Record<string, number> = {};

    vendorProducts.forEach(p => {
      if (p.category) {
        categories[p.category] = (categories[p.category] || 0) + 1;
      }
      if (p.subcategory) {
        subcategories[p.subcategory] = (subcategories[p.subcategory] || 0) + 1;
      }
      if (p.brand) {
        brands[p.brand] = (brands[p.brand] || 0) + 1;
      }
    });

    return {
      categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
      subcategories: Object.entries(subcategories).sort((a, b) => b[1] - a[1]),
      brands: Object.entries(brands).sort((a, b) => b[1] - a[1]),
    };
  }, [vendorProducts]);

  // Toggle active/inactive status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/vendor-products/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      toast({ 
        title: variables.isActive ? "Product activated" : "Product deactivated",
        description: variables.isActive 
          ? "Product is now visible to customers" 
          : "Product is now hidden from customers"
      });
    },
    onError: () => {
      toast({ title: "Failed to update product status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vendor-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      setDeleteConfirmProduct(null);
      toast({ title: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  // Show loading while vendor ID initializes
  if (!vendorId || isLoading) { 
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Filter products
  const filteredProducts = sortedProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && product.isActive) ||
                         (statusFilter === "inactive" && !product.isActive);
    const matchesStock = stockFilter === "all" ||
                        (stockFilter === "in_stock" && product.stock >= 10) ||
                        (stockFilter === "low_stock" && product.stock > 0 && product.stock < 10) ||
                        (stockFilter === "out_of_stock" && product.stock === 0);
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesSubcategory = subcategoryFilter === "all" || product.subcategory === subcategoryFilter;
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    
    return matchesSearch && matchesStatus && matchesStock && matchesCategory && matchesSubcategory && matchesBrand;
  });

  const activeCount = vendorProducts.filter((p) => p.isActive).length;
  const lowStockCount = vendorProducts.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = vendorProducts.filter((p) => p.stock === 0).length;

  const activeFiltersCount = [
    statusFilter !== "all",
    stockFilter !== "all", 
    categoryFilter !== "all",
    subcategoryFilter !== "all",
    brandFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter("all");
    setStockFilter("all");
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setBrandFilter("all");
    setSearchQuery("");
  };

  // Filter Sheet Content
  const FilterContent = () => (
    <div className="space-y-6 py-4">
      {/* Category Filter */}
      {filterOptions.categories.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filterOptions.categories.map(([cat, count]) => (
                <SelectItem key={cat} value={cat}>
                  {cat} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subcategory Filter */}
      {filterOptions.subcategories.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Subcategory</label>
          <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {filterOptions.subcategories.map(([sub, count]) => (
                <SelectItem key={sub} value={sub}>
                  {sub} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand Filter */}
      {filterOptions.brands.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand</label>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {filterOptions.brands.map(([brand, count]) => (
                <SelectItem key={brand} value={brand}>
                  {brand} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active ({activeCount})</SelectItem>
            <SelectItem value="inactive">Inactive ({vendorProducts.length - activeCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stock Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Stock Status</label>
        <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="All Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock ({lowStockCount})</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock ({outOfStockCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearAllFilters} className="w-full h-12">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header - Full width, native app feel */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Products</h1>
            <p className="text-xs text-muted-foreground">
              {vendorProducts.length} total · {activeCount} active
            </p>
          </div>
          <Button 
            onClick={() => {
              const actionCheck = canPerformAction('create');
              if (!actionCheck.allowed) {
                setBlockedAction('create');
                setShowUpgradeModal(true);
                return;
              }
              setLocation("/vendor/products/new");
            }} 
            size="icon"
            className="h-10 w-10 rounded-full bg-primary shadow-lg md:hidden"
          >
            <Plus className="h-5 w-5" />
            {!isPro && <Lock className="h-3 w-3 absolute bottom-0 right-0" />}
          </Button>
          <Button 
            onClick={() => {
              const actionCheck = canPerformAction('create');
              if (!actionCheck.allowed) {
                setBlockedAction('create');
                setShowUpgradeModal(true);
                return;
              }
              setLocation("/vendor/products/new");
            }} 
            className="hidden md:flex h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
            {!isPro && <Lock className="h-3.5 w-3.5 ml-1.5 opacity-60" />}
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-lg"
            />
          </div>
          
          {/* Mobile Filter Sheet */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 md:hidden relative">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterContent />
            </SheetContent>
          </Sheet>

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2">
            {filterOptions.categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filterOptions.categories.map(([cat, count]) => (
                    <SelectItem key={cat} value={cat}>{cat} ({count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterOptions.subcategories.length > 0 && (
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {filterOptions.subcategories.map(([sub, count]) => (
                    <SelectItem key={sub} value={sub}>{sub} ({count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterOptions.brands.length > 0 && (
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {filterOptions.brands.map(([brand, count]) => (
                    <SelectItem key={brand} value={brand}>{brand} ({count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categoryFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {categoryFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter("all")} />
              </Badge>
            )}
            {subcategoryFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {subcategoryFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSubcategoryFilter("all")} />
              </Badge>
            )}
            {brandFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {brandFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setBrandFilter("all")} />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {statusFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
              </Badge>
            )}
            {stockFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {stockFilter.replace("_", " ")}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStockFilter("all")} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs shrink-0">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Product List - Full screen, no cards wrapper */}
      <div className="flex-1 pb-20 md:pb-6">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {vendorProducts.length === 0 
                ? "Start adding products to your inventory"
                : "Try adjusting your filters or search query"}
            </p>
            <Button onClick={() => setLocation("/vendor/products/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {/* Results Count */}
            <div className="px-4 py-3 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredProducts.length}</span> products
              </p>
            </div>

            {/* Product Cards - Bigger cards, one per row on desktop */}
            {filteredProducts.map((product) => {
              const productImage = product.images && product.images.length > 0 
                ? product.images[0] 
                : null;
              const sellingPrice = (product as any).sellingPrice || product.price;
              const mrp = (product as any).mrp;
              const discount = mrp && mrp > sellingPrice 
                ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                : 0;
              
              return (
                <div 
                  key={product.id}
                  className="bg-background hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/vendor/products/${product.id}`)}
                >
                  <div className="p-4 flex gap-4">
                    {/* Product Image - Larger on mobile */}
                    <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 bg-muted rounded-xl overflow-hidden">
                      {productImage ? (
                        <img 
                          src={productImage} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <span className="text-3xl mb-1">{product.icon || '📦'}</span>
                          <ImageIcon className="w-5 h-5 opacity-30" />
                        </div>
                      )}
                      
                      {/* Stock Badge */}
                      {product.stock === 0 && (
                        <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      {product.stock > 0 && product.stock < 10 && (
                        <Badge className="absolute top-2 left-2 bg-orange-500 text-xs">
                          Low Stock
                        </Badge>
                      )}
                      
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-xs">
                          {discount}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    {/* Product Details - One info per line */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Product Name */}
                      <h3 className="font-semibold text-base line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      
                      {/* Category */}
                      <div className="text-sm text-muted-foreground mb-1">
                        {product.category}
                        {product.subcategory && ` › ${product.subcategory}`}
                      </div>
                      
                      {/* Brand */}
                      {product.brand && (
                        <div className="text-sm text-muted-foreground mb-1">
                          Brand: <span className="font-medium text-foreground">{product.brand}</span>
                        </div>
                      )}
                      
                      {/* Stock */}
                      <div className="text-sm text-muted-foreground mb-2">
                        Stock: <span className={`font-medium ${
                          product.stock === 0 ? 'text-red-600' : 
                          product.stock < 10 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {product.stock} {getUnitAbbreviation(product.unit)}
                        </span>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-xl font-bold text-primary">
                          ₹{sellingPrice}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{getUnitAbbreviation(product.unit)}
                        </span>
                        {mrp && mrp > sellingPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{mrp}
                          </span>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="mt-2">
                        <Badge 
                          variant={product.isActive ? "default" : "secondary"} 
                          className={`text-xs ${product.isActive ? 'bg-green-600' : ''}`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex items-center">
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Action Buttons - At the bottom of card */}
                  <div className="px-4 pb-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const actionCheck = canPerformAction('update');
                        if (!actionCheck.allowed) {
                          setBlockedAction('update');
                          setShowUpgradeModal(true);
                          return;
                        }
                        setLocation(`/vendor/products/edit/${product.id}`);
                      }}
                      className="flex-1 h-10"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                      {!isPro && <Lock className="w-3 h-3 ml-1 opacity-60" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/vendor/products/${product.id}`)}
                      className="flex-1 h-10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            const actionCheck = canPerformAction('update');
                            if (!actionCheck.allowed) {
                              setBlockedAction('update');
                              setShowUpgradeModal(true);
                              return;
                            }
                            toggleStatusMutation.mutate({ id: product.id, isActive: !product.isActive });
                          }}
                        >
                          <Power className="w-4 h-4 mr-2" />
                          {product.isActive ? "Deactivate" : "Activate"}
                          {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            const actionCheck = canPerformAction('delete');
                            if (!actionCheck.allowed) {
                              setBlockedAction('delete');
                              setShowUpgradeModal(true);
                              return;
                            }
                            setDeleteConfirmProduct(product);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                          {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmProduct} onOpenChange={(open) => !open && setDeleteConfirmProduct(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmProduct && deleteMutation.mutate(deleteConfirmProduct.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pro Subscription Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.location.href = '/vendor/account';
        }}
      />
    </div>
  );
}
