import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Package, Search, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorProductSchema, type MasterProduct, type VendorProduct, type InsertVendorProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// SECURITY NOTE: This is a temporary placeholder until auth is implemented.
// Currently all vendor pages use "vendor-1" for demonstration purposes.
// When auth is implemented, this will be replaced with:
// const { vendorId } = useAuth(); or similar context
// TODO: Replace with actual vendor ID from authenticated user context
export default function VendorProductsBrowse() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);

  const { data: masterProducts = [] } = useQuery<MasterProduct[]>({
    queryKey: ["/api/vendor/master-products"],
  });

  const { data: vendorProducts = [] } = useQuery<VendorProduct[]>({
    queryKey: ["/api/vendors", vendorId, "products"],
    enabled: !!vendorId,
  });

  const vendorProductIds = new Set(vendorProducts.map((p) => p.masterProductId));

  const filteredProducts = masterProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const notInInventory = !vendorProductIds.has(product.id);
    return matchesSearch && notInInventory && product.status === 'published';
  });

  const adoptMutation = useMutation({
    mutationFn: (data: { masterProductId: string; customizations: Partial<InsertVendorProduct> }) =>
      apiRequest("POST", "/api/vendor/master-products/adopt", {
        vendorId: vendorId,
        masterProductId: data.masterProductId,
        customizations: data.customizations,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/master-products"] });
      setSelectedProduct(null);
      toast({ title: "Product added to inventory" });
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    },
  });

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6" />
              Browse Products
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add products to your inventory
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto p-4">

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground mt-4">
              {searchQuery ? "No products found" : "All products have been added to your inventory"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                data-testid={`product-card-${product.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {product.icon && <span className="text-2xl">{product.icon}</span>}
                      <h3 className="font-semibold text-foreground truncate" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      <span className="px-2 py-1 bg-secondary rounded">
                        {product.category}
                      </span>
                      {product.subcategory && (
                        <span className="px-2 py-1 bg-secondary rounded">
                          {product.subcategory}
                        </span>
                      )}
                      {product.basePrice && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                          ₹{product.basePrice}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-secondary rounded">
                        v{product.version}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                      data-testid={`button-add-${product.id}`}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Inventory
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Inventory</DialogTitle>
            <DialogDescription>
              Customize the product details for your inventory
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <AddProductForm
              product={selectedProduct}
              onSubmit={(data) => addMutation.mutate(data)}
              isPending={addMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AddProductFormProps {
  product: MasterProduct;
  onSubmit: (data: InsertVendorProduct) => void;
  isPending: boolean;
}

function AddProductForm({ product, onSubmit, isPending }: AddProductFormProps) {
  const form = useForm<Partial<InsertVendorProduct>>({
    defaultValues: {
      price: product.basePrice || 0,
      stock: 0,
      discountPercentage: 0,
      isActive: true,
    },
  });

  const handleSubmit = (data: Partial<InsertVendorProduct>) => {
    onSubmit({
      masterProductId: product.id,
      customizations: data,
    } as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{product.icon}</span>
            <h4 className="font-semibold">{product.name}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <div className="flex gap-4 text-sm">
            {product.basePrice !== null && <span><span className="text-muted-foreground">Base Price:</span> ₹{product.basePrice}</span>}
            <span><span className="text-muted-foreground">Unit:</span> {product.unit}</span>
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
