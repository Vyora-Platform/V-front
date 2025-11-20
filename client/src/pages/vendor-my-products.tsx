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
import { Edit2, Trash2, Package, Search, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorProductSchema, type VendorProduct, type InsertVendorProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorMyProducts() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);

  const { data: vendorProducts = [] } = useQuery<VendorProduct[]>({
    queryKey: ["/api/vendors", vendorId, "products"],
    enabled: !!vendorId,
  });

  const filteredProducts = vendorProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && product.isActive) ||
                         (statusFilter === "inactive" && !product.isActive);
    return matchesSearch && matchesStatus;
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVendorProduct> }) =>
      apiRequest("PATCH", `/api/vendor-products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "products"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "products"] });
      toast({ title: "Product removed from inventory" });
    },
    onError: () => {
      toast({ title: "Failed to remove product", variant: "destructive" });
    },
  });

  const activeCount = vendorProducts.filter((p) => p.isActive).length;
  const lowStockCount = vendorProducts.filter((p) => p.stock < 10).length;

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-16 md:pb-6 space-y-6">
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
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground">Manage your product inventory and pricing</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold" data-testid="text-total-count">{vendorProducts.length}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-count">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Active Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600" data-testid="text-low-stock-count">{lowStockCount}</div>
            <div className="text-sm text-muted-foreground">Low Stock</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
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
          <SelectTrigger className="w-48" data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
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
                      <CardTitle>{product.name}</CardTitle>
                      <Badge variant={product.isActive ? "default" : "secondary"} data-testid={`badge-status-${product.id}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {product.stock < 10 && (
                        <Badge variant="destructive" data-testid={`badge-low-stock-${product.id}`}>Low Stock</Badge>
                      )}
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Your Price:</span>
                    <span className="ml-2 font-medium text-lg">₹{product.price}</span>
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
                    <p className="text-sm text-muted-foreground mb-2">Specifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.specifications.map((spec, i) => (
                        <Badge key={i} variant="outline">{spec}</Badge>
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
        <DialogContent>
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
    </div>
  );
}

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
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <div className="text-sm">
            <span className="text-muted-foreground">Unit:</span> {product.unit}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
