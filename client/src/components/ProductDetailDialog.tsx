import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductDetailPage } from "@/components/ProductDetailPage";
import type { MasterProduct, VendorProduct } from "@shared/schema";
import { X } from "lucide-react";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MasterProduct | VendorProduct | null;
  primaryColor?: string;
  showAddToCart?: boolean;
  onAddToCart?: (quantity: number, selectedVariants?: Record<string, string>) => void;
  onRequestQuote?: (quantity: number, selectedVariants?: Record<string, string>) => void;
}

export default function ProductDetailDialog({ 
  open, 
  onOpenChange, 
  product,
  primaryColor = "#4F46E5",
  showAddToCart = false,
  onAddToCart,
  onRequestQuote,
}: ProductDetailDialogProps) {

  if (!product) return null;

  const isVendorProduct = 'vendorId' in product;
  const productData = product as any;

  // Transform product data for ProductDetailPage
  const transformedProduct = {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory || undefined,
    brand: product.brand || undefined,
    description: product.description,
    specifications: productData.specifications || [],
    mrp: productData.mrp || null,
    price: isVendorProduct ? productData.price : productData.basePrice,
    sellingPrice: productData.sellingPrice || null,
    basePrice: productData.basePrice || null,
    unit: product.unit,
    stock: isVendorProduct ? productData.stock : undefined,
    images: productData.images || [],
    imageKeys: productData.imageKeys || [],
    variants: productData.variants || undefined,
    icon: product.icon || undefined,
    requiresPrescription: product.requiresPrescription || false,
    isActive: isVendorProduct ? productData.isActive : true,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <ProductDetailPage
          product={transformedProduct}
          primaryColor={primaryColor}
          showAddToCart={showAddToCart}
          showQuantitySelector={showAddToCart}
          showStock={isVendorProduct}
          onAddToCart={onAddToCart}
          onRequestQuote={onRequestQuote}
          mode="dialog"
        />
      </DialogContent>
    </Dialog>
  );
}
