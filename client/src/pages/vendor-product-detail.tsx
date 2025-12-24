import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  Copy,
  Check,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
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

export default function VendorProductDetail() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/products/:id");
  const productId = params?.id;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setLocation("/vendor/products");
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

  const handleCopyId = () => {
    if (productId) {
      navigator.clipboard.writeText(productId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Product ID copied to clipboard" });
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
            <Button onClick={() => setLocation("/vendor/products")} className="h-[var(--cta-h)]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6 overflow-y-auto max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/products")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg md:text-xl font-bold truncate max-w-[200px] md:max-w-none">{product.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                ID: {productId?.slice(0, 8)}...
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopyId}>
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/vendor/products/edit/${productId}`)}
              className="h-9"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-9"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <Card className="rounded-xl overflow-hidden">
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              idx === currentImageIndex ? 'bg-primary' : 'bg-white/50'
                            }`}
                            onClick={() => setCurrentImageIndex(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <span className="text-6xl mb-4">{product.icon}</span>
                  <Package className="w-12 h-12 opacity-30" />
                  <span className="text-sm mt-2">No images available</span>
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="p-4 border-t">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                        idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Product Info */}
          <div className="space-y-4">
            {/* Status and Category */}
            <Card className="rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{product.category}</Badge>
                {product.subcategory && <Badge variant="outline">{product.subcategory}</Badge>}
                {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
                {product.requiresPrescription && <Badge variant="destructive">Rx Required</Badge>}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-9 text-sm"
                onClick={() => toggleActiveMutation.mutate({ id: product.id, isActive: !product.isActive })}
                disabled={toggleActiveMutation.isPending}
              >
                {product.isActive ? "Deactivate Product" : "Activate Product"}
              </Button>
            </Card>

            {/* Pricing */}
            <Card className="rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Pricing</h3>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">₹{product.sellingPrice || product.price}</span>
                  {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
                    <span className="text-lg text-muted-foreground line-through">₹{product.mrp}</span>
                  )}
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <Badge className="bg-green-500">{product.discountPercentage}% OFF</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">per {product.unit}</p>
              </div>
            </Card>

            {/* Stock Info */}
            <Card className="rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Inventory</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{product.stock}</span>
                <span className="text-muted-foreground">{product.unit} available</span>
              </div>
              {product.stock === 0 && (
                <Badge variant="destructive" className="mt-2">Out of Stock</Badge>
              )}
              {product.stock > 0 && product.stock < 10 && (
                <Badge className="mt-2 bg-orange-500">Low Stock Alert</Badge>
              )}
            </Card>

            {/* Description */}
            <Card className="rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Description</h3>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </Card>

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <Card className="rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Specifications</h3>
                <div className="flex flex-wrap gap-2">
                  {product.specifications.map((spec, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Variants */}
            {product.variants && Object.keys(product.variants).some(k => (product.variants as any)?.[k]?.length > 0) && (
              <Card className="rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Variants</h3>
                <div className="space-y-3">
                  {Object.entries(product.variants).map(([key, values]) => (
                    values && (values as string[]).length > 0 && (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground capitalize mb-1">{key}</p>
                        <div className="flex flex-wrap gap-2">
                          {(values as string[]).map((value, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </Card>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <Card className="rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
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
            <AlertDialogCancel className="h-[var(--input-h)]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-[var(--input-h)] bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

