import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  Share2, 
  Heart,
  Check,
  Package,
  Truck,
  Shield,
  Star,
  Minus,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// Type for product variants
interface ProductVariants {
  size?: string[];
  color?: string[];
  material?: string[];
  style?: string[];
  packSize?: string[];
}

// Props for the ProductDetailPage component
export interface ProductDetailPageProps {
  product: {
    id: string;
    name: string;
    category?: string;
    subcategory?: string;
    brand?: string;
    description: string;
    specifications?: string[];
    mrp?: number | null;
    price?: number;
    sellingPrice?: number | null;
    basePrice?: number | null;
    unit?: string;
    stock?: number;
    images?: string[];
    imageKeys?: string[];
    variants?: ProductVariants;
    icon?: string;
    requiresPrescription?: boolean;
    isActive?: boolean;
  };
  primaryColor?: string;
  showAddToCart?: boolean;
  showQuantitySelector?: boolean;
  showStock?: boolean;
  onAddToCart?: (quantity: number, selectedVariants?: Record<string, string>) => void;
  onRequestQuote?: (quantity: number, selectedVariants?: Record<string, string>) => void;
  onClose?: () => void;
  mode?: 'page' | 'dialog';
}

export function ProductDetailPage({
  product,
  primaryColor = "#4F46E5",
  showAddToCart = true,
  showQuantitySelector = true,
  showStock = true,
  onAddToCart,
  onRequestQuote,
  onClose,
  mode = 'page'
}: ProductDetailPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Get all images from both images and imageKeys arrays
  const getAllImages = (): string[] => {
    const imgs: string[] = [];
    
    if (product.images && product.images.length > 0) {
      imgs.push(...product.images.filter(img => img && img.trim()));
    }
    
    // If imageKeys exist and images don't have enough, construct public URLs
    if (product.imageKeys && product.imageKeys.length > 0) {
      const supabaseUrl = "https://abizuwqnqkbicrhorcig.supabase.co";
      const bucket = "public-assets";
      product.imageKeys.forEach(key => {
        if (key && key.trim()) {
          const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`;
          if (!imgs.includes(url)) {
            imgs.push(url);
          }
        }
      });
    }
    
    return imgs;
  };

  const images = getAllImages();
  const hasImages = images.length > 0;

  // Get price display values
  const getPrice = () => {
    return product.sellingPrice ?? product.price ?? product.basePrice ?? 0;
  };

  const getMrp = () => {
    return product.mrp ?? 0;
  };

  const getDiscount = () => {
    const mrp = getMrp();
    const selling = getPrice();
    if (mrp > selling && selling > 0) {
      return Math.round(((mrp - selling) / mrp) * 100);
    }
    return 0;
  };

  // Handle image navigation
  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomed) {
        if (e.key === 'Escape') setIsZoomed(false);
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, images.length]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailRef.current) {
      const thumbnails = thumbnailRef.current.children;
      if (thumbnails[selectedImageIndex]) {
        (thumbnails[selectedImageIndex] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedImageIndex]);

  // Handle variant selection
  const handleVariantSelect = (variantType: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantType]: value }));
  };

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(product.stock ?? 999, quantity + delta));
    setQuantity(newQty);
  };

  // Render variant selector
  const renderVariants = () => {
    if (!product.variants) return null;

    const variantConfig: { key: keyof ProductVariants; label: string; icon?: string }[] = [
      { key: 'size', label: 'Size' },
      { key: 'color', label: 'Color' },
      { key: 'material', label: 'Material' },
      { key: 'style', label: 'Style' },
      { key: 'packSize', label: 'Pack Size' },
    ];

    return (
      <div className="space-y-4">
        {variantConfig.map(({ key, label }) => {
          const options = product.variants?.[key];
          if (!options || options.length === 0) return null;

          return (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}: <span className="text-primary font-semibold">{selectedVariants[key] || 'Select'}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleVariantSelect(key, option)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedVariants[key] === option
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const content = (
    <div className={`bg-white dark:bg-gray-900 ${mode === 'page' ? 'min-h-screen' : ''}`}>
      {/* Mobile-optimized full-screen view */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
          
          {/* Left Column - Images */}
          <div className="relative">
            {/* Main Image Container */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 lg:rounded-xl overflow-hidden">
              {hasImages ? (
                <>
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105"
                    onClick={() => setIsZoomed(true)}
                  />
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                  
                  {/* Zoom Icon */}
                  <button
                    onClick={() => setIsZoomed(true)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    {product.icon ? (
                      <span className="text-8xl">{product.icon}</span>
                    ) : (
                      <Package className="w-24 h-24 text-gray-300" />
                    )}
                    <p className="text-gray-400 mt-4">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Strip - Horizontal Scroll */}
            {images.length > 1 && (
              <div 
                ref={thumbnailRef}
                className="flex gap-2 p-4 overflow-x-auto scrollbar-hide lg:justify-center"
              >
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="p-4 lg:p-6 lg:py-8 space-y-6">
            {/* Category & Brand Badges */}
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {product.category}
                </Badge>
              )}
              {product.subcategory && (
                <Badge variant="outline" className="text-xs">
                  {product.subcategory}
                </Badge>
              )}
              {product.brand && (
                <Badge 
                  className="text-xs font-semibold"
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                >
                  {product.brand}
                </Badge>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating Placeholder (for future) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">(Coming Soon)</span>
            </div>

            <Separator />

            {/* Pricing Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span 
                  className="text-3xl lg:text-4xl font-bold"
                  style={{ color: primaryColor }}
                >
                  ₹{getPrice().toLocaleString()}
                </span>
                {getMrp() > getPrice() && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ₹{getMrp().toLocaleString()}
                    </span>
                    <Badge variant="destructive" className="text-sm font-bold">
                      {getDiscount()}% OFF
                    </Badge>
                  </>
                )}
              </div>
              {product.unit && (
                <p className="text-sm text-gray-500">
                  Price per {product.unit}
                </p>
              )}
              <p className="text-xs text-gray-400">Inclusive of all taxes</p>
            </div>

            {/* Stock Status */}
            {showStock && product.stock !== undefined && (
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      In Stock
                      {product.stock <= 10 && (
                        <span className="text-orange-500 ml-2">
                          (Only {product.stock} left)
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
            )}

            <Separator />

            {/* Variants */}
            {product.variants && Object.keys(product.variants).some(k => (product.variants as any)[k]?.length > 0) && (
              <>
                {renderVariants()}
                <Separator />
              </>
            )}

            {/* Quantity Selector */}
            {showQuantitySelector && product.stock !== 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-6 py-2 font-semibold text-lg border-x">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={product.stock !== undefined && quantity >= product.stock}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {product.stock !== undefined && (
                    <span className="text-sm text-gray-500">
                      Max: {product.stock}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {showAddToCart && onAddToCart && (
                <Button
                  size="lg"
                  className="flex-1 h-14 text-lg font-semibold"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => onAddToCart(quantity, selectedVariants)}
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </Button>
              )}
              {onRequestQuote && (
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 h-14 text-lg font-semibold"
                  onClick={() => onRequestQuote(quantity, selectedVariants)}
                >
                  Request Quote
                </Button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <Heart className="w-4 h-4" />
                Wishlist
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>

            <Separator />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">Fast Delivery</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">Secure Payment</p>
              </div>
              <div className="text-center">
                <Package className="w-6 h-6 mx-auto text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">Quality Assured</p>
              </div>
            </div>

            {/* Prescription Warning */}
            {product.requiresPrescription && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚠️ This product requires a valid prescription. Please upload your prescription during checkout.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Section Separator - Amazon Style */}
        <div className="h-3 bg-gray-100 dark:bg-gray-800 w-full"></div>
          
        {/* Product Highlights Section */}
          {product.specifications && product.specifications.length > 0 && (
          <>
            <div className="p-4 lg:p-6 bg-white dark:bg-gray-900">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" style={{ color: primaryColor }} />
                Product Highlights
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <ul className="space-y-3">
                {product.specifications.map((spec, index) => (
                  <li key={index} className="flex items-start gap-3">
                      <div 
                        className="w-1.5 h-1.5 mt-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: primaryColor }} 
                    />
                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
            </div>
            
            {/* Section Separator */}
            <div className="h-3 bg-gray-100 dark:bg-gray-800 w-full"></div>
          </>
          )}

        {/* Product Description Section */}
        <div className="p-4 lg:p-6 bg-white dark:bg-gray-900">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: primaryColor }} />
              Product Description
            </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
                {product.description || "No description available for this product."}
              </p>
          </div>
        </div>

        {/* Section Separator */}
        <div className="h-3 bg-gray-100 dark:bg-gray-800 w-full"></div>
        
        {/* Product Details Section - Like Meesho */}
        <div className="p-4 lg:p-6 bg-white dark:bg-gray-900">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: primaryColor }} />
            Product Details
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {product.brand && (
                <div className="flex px-4 py-3">
                  <span className="w-32 text-gray-500 text-sm">Brand</span>
                  <span className="flex-1 text-gray-900 dark:text-white text-sm font-medium">{product.brand}</span>
                </div>
              )}
              {product.category && (
                <div className="flex px-4 py-3">
                  <span className="w-32 text-gray-500 text-sm">Category</span>
                  <span className="flex-1 text-gray-900 dark:text-white text-sm font-medium">{product.category}</span>
                </div>
              )}
              {product.subcategory && (
                <div className="flex px-4 py-3">
                  <span className="w-32 text-gray-500 text-sm">Type</span>
                  <span className="flex-1 text-gray-900 dark:text-white text-sm font-medium">{product.subcategory}</span>
                </div>
              )}
              {product.unit && (
                <div className="flex px-4 py-3">
                  <span className="w-32 text-gray-500 text-sm">Unit</span>
                  <span className="flex-1 text-gray-900 dark:text-white text-sm font-medium">{product.unit}</span>
                </div>
              )}
              {product.stock !== undefined && (
                <div className="flex px-4 py-3">
                  <span className="w-32 text-gray-500 text-sm">Availability</span>
                  <span className={`flex-1 text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Separator */}
        <div className="h-3 bg-gray-100 dark:bg-gray-800 w-full"></div>
        
        {/* Delivery & Returns Section */}
        <div className="p-4 lg:p-6 bg-white dark:bg-gray-900 pb-20 lg:pb-6">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" style={{ color: primaryColor }} />
            Delivery & Returns
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Fast Delivery</p>
                <p className="text-xs text-gray-500">Get it delivered to your doorstep</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Secure Payment</p>
                <p className="text-xs text-gray-500">100% secure payment methods</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Quality Assured</p>
                <p className="text-xs text-gray-500">All products are quality checked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95">
          <DialogTitle className="sr-only">Zoomed Image</DialogTitle>
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            {hasImages && (
              <>
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <ChevronRight className="w-8 h-8 text-white" />
                    </button>
                  </>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail strip in zoom view */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-white'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return content;
}

export default ProductDetailPage;




