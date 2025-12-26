import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Package, 
  Power,
  MoreVertical,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { ProductDetailPage } from "@/components/ProductDetailPage";
import type { VendorProduct } from "@shared/schema";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function VendorProductDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/products/:id");
  const productId = params?.id;
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch product
  const { data: product, isLoading, error } = useQuery<VendorProduct>({
    queryKey: ["/api/vendor-products", productId],
    enabled: !!productId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vendor-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      toast({ title: "Product deleted successfully" });
      setLocation("/vendor/products-catalogue");
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/vendor-products/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-products", productId] });
      toast({ title: product?.isActive ? "Product deactivated" : "Product activated" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  // Handle share
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied to clipboard" });
    }
  };

  // Standard e-commerce back navigation
  const handleBack = () => {
    // Check if we can go back in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to catalogue page
      setLocation("/vendor/products-catalogue");
    }
  };

  if (!vendorId || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-xl">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/vendor/products-catalogue")} className="h-11">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalogue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform product data for ProductDetailPage - EXACT same structure as mini-website
  const transformedProduct = {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory || undefined,
    brand: product.brand || undefined,
    description: product.description,
    specifications: product.specifications || [],
    mrp: (product as any).mrp || null,
    price: product.price,
    sellingPrice: (product as any).sellingPrice || null,
    unit: product.unit,
    stock: product.stock,
    images: product.images || [],
    imageKeys: product.imageKeys || [],
    variants: (product as any).variants || undefined,
    icon: product.icon || undefined,
    requiresPrescription: product.requiresPrescription || false,
    isActive: product.isActive,
    // Warranty & Guarantee
    hasWarranty: (product as any).hasWarranty || false,
    warrantyDuration: (product as any).warrantyDuration || undefined,
    warrantyUnit: (product as any).warrantyUnit || undefined,
    hasGuarantee: (product as any).hasGuarantee || false,
    guaranteeDuration: (product as any).guaranteeDuration || undefined,
    guaranteeUnit: (product as any).guaranteeUnit || undefined,
    // Tags
    tags: (product as any).tags || [],
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      {/* Mobile Header with Back Navigation */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0 mx-3">
            <h1 className="text-base font-semibold truncate">{product.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10">
              <Share2 className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation(`/vendor/products/edit/${productId}`)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => toggleActiveMutation.mutate({ id: product.id, isActive: !product.isActive })}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {product.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block sticky top-0 z-30 bg-background border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="h-10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Catalogue
          </Button>
          <div className="flex items-center gap-3">
            <Badge 
              variant={product.isActive ? "default" : "secondary"}
              className={product.isActive ? "bg-green-600" : ""}
            >
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleActiveMutation.mutate({ id: product.id, isActive: !product.isActive })}
              className="h-10"
              disabled={toggleActiveMutation.isPending}
            >
              <Power className="h-4 w-4 mr-2" />
              {product.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation(`/vendor/products/edit/${productId}`)}
              className="h-10"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="h-10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Product Detail - Using reusable component (IDENTICAL to mini-website) */}
      <ProductDetailPage
        product={transformedProduct}
        primaryColor="#2563eb" // Primary blue color for vendor view
        showAddToCart={false}
        showQuantitySelector={false}
        showStock={true}
        mode="page"
      />

      {/* Mobile Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden z-40">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setLocation(`/vendor/products/edit/${productId}`)}
            className="flex-1 h-12"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={product.isActive ? "outline" : "default"}
            onClick={() => toggleActiveMutation.mutate({ id: product.id, isActive: !product.isActive })}
            className="flex-1 h-12"
            disabled={toggleActiveMutation.isPending}
          >
            <Power className="h-4 w-4 mr-2" />
            {product.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="h-12 w-12"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(product.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
