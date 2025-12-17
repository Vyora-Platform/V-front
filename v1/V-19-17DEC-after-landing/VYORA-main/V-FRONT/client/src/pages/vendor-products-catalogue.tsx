import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Trash2, Package, Search, Plus, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorProductSchema, type VendorProduct, type MasterProduct, type InsertVendorProduct, type Category, type Subcategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";


import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorProductsCatalogue() {
  const [, setLocation] = useLocation();
  
  // Get real vendor ID from localStorage
  const { vendorId } = useAuth();
  
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
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
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-xs text-muted-foreground">Manage inventory</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="my-products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-products" data-testid="tab-my-products">My Products</TabsTrigger>
          <TabsTrigger value="suggested-products" data-testid="tab-suggested-products">Suggested (Admin)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-products">
          <MyProductsTab vendorId={vendorId} />
        </TabsContent>
        
        <TabsContent value="suggested-products">
          <SuggestedProductsTab vendorId={vendorId} />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// My Products Tab Content
function MyProductsTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const { data: vendorProducts = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVendorProduct> }) =>
      apiRequest("PATCH", `/api/vendor-products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      setEditingProduct(null);
      toast({ title: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vendor-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      toast({ title: "Product removed from inventory" });
    },
    onError: () => {
      toast({ title: "Failed to remove product", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVendorProduct) =>
      apiRequest("POST", `/api/vendors/${vendorId}/products`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      setIsCreatingProduct(false);
      toast({ title: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  // Show loading while vendor ID initializes (after ALL hooks)
  if (!vendorId) { return <LoadingSpinner />; }

  const filteredProducts = vendorProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && product.isActive) ||
                         (statusFilter === "inactive" && !product.isActive);
    return matchesSearch && matchesStatus;
  });

  const activeCount = vendorProducts.filter((p) => p.isActive).length;
  const lowStockCount = vendorProducts.filter((p) => p.stock < 10).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-total-count">{vendorProducts.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600" data-testid="text-active-count">{activeCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Active Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-orange-600" data-testid="text-low-stock-count">{lowStockCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Low Stock</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsCreatingProduct(true)} className="w-full sm:w-auto" data-testid="button-create-product">
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products in your inventory</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl">{product.icon}</span>
                      <CardTitle className="text-base sm:text-lg">{product.name}</CardTitle>
                      <Badge variant={product.isActive ? "default" : "secondary"} data-testid={`badge-status-${product.id}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {product.stock < 10 && (
                        <Badge variant="destructive" data-testid={`badge-low-stock-${product.id}`}>Low Stock</Badge>
                      )}
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingProduct(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(product.id)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">Your Price:</span>
                    <span className="ml-2 font-medium text-base sm:text-lg">₹{product.price}</span>
                    {product.discountPercentage && product.discountPercentage > 0 && (
                      <Badge variant="secondary" className="ml-2">{product.discountPercentage}% off</Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="ml-2 font-medium">{product.stock} {product.unit}</span>
                  </div>
                  {product.brand && (
                    <div>
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="ml-2">{product.brand}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Prescription:</span>
                    <span className="ml-2">{product.requiresPrescription ? "Required" : "Not Required"}</span>
                  </div>
                </div>
                {product.specifications && product.specifications.length > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Specifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.specifications.map((spec, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <EditProductForm
              product={editingProduct}
              onSubmit={(data) => updateMutation.mutate({ id: editingProduct.id, data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingProduct} onOpenChange={(open) => !open && setIsCreatingProduct(false)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <CreateProductForm
            vendorId={vendorId}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Suggested Products Tab Content
function SuggestedProductsTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);

  // Fetch suggested products filtered by vendor's category (admin-created products)
  const { data: suggestedProducts = [], isLoading } = useQuery<MasterProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/suggested-products`],
    enabled: !!vendorId,
  });

  const filteredProducts = suggestedProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const addMutation = useMutation({
    mutationFn: (data: InsertVendorProduct) =>
      apiRequest("POST", `/api/vendors/${vendorId}/products`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suggested-products`] });
      setSelectedProduct(null);
      toast({ title: "Product added to inventory" });
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Suggested Products</h2>
        <p className="text-xs text-muted-foreground mb-4">Admin-created products matching your business category. Add them to your inventory with your own pricing.</p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-sm">Loading suggested products...</p>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium mb-2">{searchQuery ? "No products found" : "No suggested products available"}</p>
            <p className="text-xs">Products matching your business category will appear here when added by admin.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl">{product.icon}</span>
                      <CardTitle className="text-base sm:text-lg">{product.name}</CardTitle>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <Button
                    onClick={() => setSelectedProduct(product)}
                    data-testid={`button-add-${product.id}`}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Inventory
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {product.brand && (
                    <div>
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="ml-2">{product.brand}</span>
                    </div>
                  )}
                  {product.basePrice !== null && (
                    <div>
                      <span className="text-muted-foreground">Base Price:</span>
                      <span className="ml-2 font-medium">₹{product.basePrice}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="ml-2">{product.unit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prescription:</span>
                    <span className="ml-2">{product.requiresPrescription ? "Required" : "Not Required"}</span>
                  </div>
                </div>
                {product.specifications && product.specifications.length > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Specifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.specifications.map((spec, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to Inventory</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <AddProductForm
              product={selectedProduct}
              vendorId={vendorId}
              onSubmit={(data) => addMutation.mutate(data)}
              isPending={addMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Product Form Component
interface EditProductFormProps {
  product: VendorProduct;
  onSubmit: (data: Partial<InsertVendorProduct>) => void;
  isPending: boolean;
}

function EditProductForm({ product, onSubmit, isPending }: EditProductFormProps) {
  const form = useForm<Partial<InsertVendorProduct>>({
    resolver: zodResolver(insertVendorProductSchema.partial()),
    defaultValues: {
      price: product.price,
      stock: product.stock,
      discountPercentage: product.discountPercentage || 0,
      isActive: product.isActive,
    },
  });

  useEffect(() => {
    form.reset({
      price: product.price,
      stock: product.stock,
      discountPercentage: product.discountPercentage || 0,
      isActive: product.isActive,
    });
  }, [product, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{product.icon}</span>
            <h4 className="font-semibold">{product.name}</h4>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{product.description}</p>
          <div className="text-xs sm:text-sm">
            <span className="text-muted-foreground">Unit:</span> {product.unit}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Selling Price (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="discountPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Percentage (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value || 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  data-testid="input-discount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4"
                  data-testid="checkbox-active"
                />
              </FormControl>
              <FormLabel className="!m-0">Product is active</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Saving..." : "Update Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Add Product Form Component
interface AddProductFormProps {
  product: MasterProduct;
  vendorId: string;
  onSubmit: (data: InsertVendorProduct) => void;
  isPending: boolean;
}

function AddProductForm({ product, vendorId, onSubmit, isPending }: AddProductFormProps) {
  const form = useForm<InsertVendorProduct>({
    resolver: zodResolver(insertVendorProductSchema),
    defaultValues: {
      vendorId: vendorId,
      masterProductId: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      icon: product.icon,
      description: product.description,
      specifications: product.specifications,
      tags: product.tags,
      price: product.basePrice || 0,
      unit: product.unit,
      images: product.images,
      stock: 0,
      requiresPrescription: product.requiresPrescription || false,
      isActive: true,
      discountPercentage: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{product.icon}</span>
            <h4 className="font-semibold">{product.name}</h4>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{product.description}</p>
          <div className="flex gap-4 text-xs sm:text-sm">
            {product.basePrice !== null && <span><span className="text-muted-foreground">Base Price:</span> ₹{product.basePrice}</span>}
            <span><span className="text-muted-foreground">Unit:</span> {product.unit}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Selling Price (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="discountPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Percentage (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value || 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  data-testid="input-discount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4"
                  data-testid="checkbox-active"
                />
              </FormControl>
              <FormLabel className="!m-0">Make product active</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Adding..." : "Add to Inventory"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Create Product Form Component
interface CreateProductFormProps {
  vendorId: string;
  onSubmit: (data: InsertVendorProduct) => void;
  isPending: boolean;
}

function CreateProductForm({ vendorId, onSubmit, isPending }: CreateProductFormProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  // Fetch vendor's existing products to get their custom categories
  const { data: vendorProducts = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  // Extract unique vendor-specific custom categories
  const vendorCustomCategories = Array.from(
    new Set(
      vendorProducts
        .filter(p => !p.categoryId && p.category) // Products without categoryId are custom
        .map(p => p.category)
    )
  ).sort();

  // Extract unique vendor-specific custom subcategories
  const vendorCustomSubcategories = Array.from(
    new Set(
      vendorProducts
        .filter(p => !p.subcategoryId && p.subcategory)
        .map(p => p.subcategory)
    )
  ).sort();

  const form = useForm<InsertVendorProduct>({
    resolver: zodResolver(insertVendorProductSchema.partial({ categoryId: true, subcategoryId: true })),
    defaultValues: {
      vendorId: vendorId,
      name: "",
      category: "",
      categoryId: undefined,
      subcategory: "",
      subcategoryId: undefined,
      brand: "",
      icon: "📦",
      description: "",
      specifications: [],
      tags: [],
      price: 0,
      unit: "piece",
      images: [],
      stock: 0,
      requiresPrescription: false,
      isActive: true,
      discountPercentage: 0,
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
  
  const filteredSubcategories = selectedCategoryId && selectedCategoryId !== "custom"
    ? subcategories.filter(sub => sub.categoryId === selectedCategoryId)
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter product name"
                    data-testid="input-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    value={isCustomCategory ? "custom" : (field.value || "")}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setIsCustomCategory(true);
                        field.onChange(undefined);
                        form.setValue("category", "");
                      } else if (value.startsWith("vendor-custom:")) {
                        // Selected an existing vendor custom category
                        setIsCustomCategory(false);
                        field.onChange(undefined);
                        const categoryName = value.replace("vendor-custom:", "");
                        form.setValue("category", categoryName);
                      } else {
                        setIsCustomCategory(false);
                        field.onChange(value);
                        const category = categories.find(c => c.id === value);
                        if (category) {
                          form.setValue("category", category.name);
                        }
                      }
                      // Reset subcategory when category changes
                      setIsCustomSubcategory(false);
                      form.setValue("subcategoryId", undefined);
                      form.setValue("subcategory", "");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category">
                          {isCustomCategory ? "✨ New Custom Category" : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Master/Global Categories */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Master Categories
                      </div>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      
                      {/* Vendor's Custom Categories */}
                      {vendorCustomCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                            Your Custom Categories
                          </div>
                          {vendorCustomCategories.map((cat) => (
                            <SelectItem key={`vendor-custom:${cat}`} value={`vendor-custom:${cat}`} className="text-primary">
                              🏷️ {cat}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Create New Custom Category */}
                      <div className="border-t mt-1 pt-1">
                        <SelectItem value="custom" className="font-semibold text-primary">
                          ✨ Create New Custom Category
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                  {!isCustomCategory && (
                    <p className="text-xs text-muted-foreground">
                      {vendorCustomCategories.length > 0 
                        ? "Select from master categories or your custom categories"
                        : "Select a category or create a new custom category"}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select
                    value={isCustomSubcategory ? "custom" : (field.value || "")}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setIsCustomSubcategory(true);
                        field.onChange(undefined);
                        form.setValue("subcategory", "");
                      } else if (value.startsWith("vendor-custom:")) {
                        // Selected an existing vendor custom subcategory
                        setIsCustomSubcategory(false);
                        field.onChange(undefined);
                        const subcategoryName = value.replace("vendor-custom:", "");
                        form.setValue("subcategory", subcategoryName);
                      } else {
                        setIsCustomSubcategory(false);
                        field.onChange(value);
                        const subcategory = subcategories.find(s => s.id === value);
                        if (subcategory) {
                          form.setValue("subcategory", subcategory.name);
                        }
                      }
                    }}
                    disabled={!selectedCategoryId && !isCustomCategory && !form.watch("category")}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-subcategory">
                        <SelectValue placeholder="Select subcategory">
                          {isCustomSubcategory ? "✨ New Custom Subcategory" : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Master Subcategories (filtered by category) */}
                      {filteredSubcategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Master Subcategories
                          </div>
                          {filteredSubcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Vendor's Custom Subcategories */}
                      {vendorCustomSubcategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                            Your Custom Subcategories
                          </div>
                          {vendorCustomSubcategories.map((sub) => (
                            <SelectItem key={`vendor-custom:${sub}`} value={`vendor-custom:${sub}`} className="text-primary">
                              🏷️ {sub}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Create New Custom Subcategory */}
                      <div className="border-t mt-1 pt-1">
                        <SelectItem value="custom" className="font-semibold text-primary">
                          ✨ Create New Custom Subcategory
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                  {!isCustomSubcategory && (
                    <p className="text-xs text-muted-foreground">
                      {vendorCustomSubcategories.length > 0 
                        ? "Select from master or your custom subcategories, or create new"
                        : "Optional: Select or create a custom subcategory"}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Custom Category Input */}
          {isCustomCategory && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your vendor-specific category (e.g., Ayurvedic Treatments)"
                      data-testid="input-custom-category"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    This category will be unique to your business and won't affect other vendors
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Custom Subcategory Input */}
          {isCustomSubcategory && (
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Subcategory Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Enter your vendor-specific subcategory (optional)"
                      data-testid="input-custom-subcategory"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Optional: Add a subcategory to further organize your products
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Enter brand name"
                      data-testid="input-brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon (Emoji) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="📦"
                      data-testid="input-icon"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter product description"
                    rows={3}
                    data-testid="input-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price (₹) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="piece, kg, liter, etc."
                      data-testid="input-unit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-stock"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-discount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Additional Options</h3>
          
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="requiresPrescription"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4"
                      data-testid="checkbox-prescription"
                    />
                  </FormControl>
                  <FormLabel className="!m-0">Requires prescription</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4"
                      data-testid="checkbox-active"
                    />
                  </FormControl>
                  <FormLabel className="!m-0">Make product active</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit">
            {isPending ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
