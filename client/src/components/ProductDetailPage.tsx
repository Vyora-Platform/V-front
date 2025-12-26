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
  Shield,
  Star,
  Minus,
  Plus,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Zap,
  BadgeCheck,
  CircleCheck,
  Gift,
  Percent
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

// Get short abbreviation for units
const getUnitAbbrev = (unit: string): string => {
  const abbrevMap: Record<string, string> = {
    'kilogram': 'kg',
    'Kilogram': 'kg',
    'kg': 'kg',
    'gram': 'g',
    'Gram': 'g',
    'g': 'g',
    'piece': 'pc',
    'Piece': 'pc',
    'pieces': 'pcs',
    'Pieces': 'pcs',
    'pc': 'pc',
    'pcs': 'pcs',
    'liter': 'L',
    'Liter': 'L',
    'litre': 'L',
    'Litre': 'L',
    'L': 'L',
    'milliliter': 'ml',
    'Milliliter': 'ml',
    'ml': 'ml',
    'meter': 'm',
    'Meter': 'm',
    'm': 'm',
    'dozen': 'dz',
    'Dozen': 'dz',
    'box': 'box',
    'Box': 'box',
    'pack': 'pack',
    'Pack': 'pack',
    'packet': 'pkt',
    'Packet': 'pkt',
    'bottle': 'btl',
    'Bottle': 'btl',
    'can': 'can',
    'Can': 'can',
    'unit': 'unit',
    'Unit': 'unit',
  };
  return abbrevMap[unit] || unit?.toLowerCase() || 'unit';
};

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
    // Warranty & Guarantee fields
    hasWarranty?: boolean;
    warrantyDuration?: number;
    warrantyUnit?: string;
    hasGuarantee?: boolean;
    guaranteeDuration?: number;
    guaranteeUnit?: string;
    // Tags for better product discovery
    tags?: string[];
  };
  primaryColor?: string;
  showAddToCart?: boolean;
  showQuantitySelector?: boolean;
  showStock?: boolean;
  onAddToCart?: (quantity: number, selectedVariants?: Record<string, string>) => void;
  onRequestQuote?: (quantity: number, selectedVariants?: Record<string, string>) => void;
  onClose?: () => void;
  onBack?: () => void;
  mode?: 'page' | 'dialog';
}

export function ProductDetailPage({
  product,
  primaryColor = "#2874f0",
  showAddToCart = true,
  showQuantitySelector = true,
  showStock = true,
  onAddToCart,
  onRequestQuote,
  onClose,
  onBack,
  mode = 'page'
}: ProductDetailPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

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

  const getSavings = () => {
    const mrp = getMrp();
    const selling = getPrice();
    if (mrp > selling) {
      return mrp - selling;
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

  // Render variant selector - Flipkart style
  const renderVariants = () => {
    if (!product.variants) return null;

    const variantConfig: { key: keyof ProductVariants; label: string }[] = [
      { key: 'size', label: 'Size' },
      { key: 'color', label: 'Color' },
      { key: 'material', label: 'Material' },
      { key: 'style', label: 'Style' },
      { key: 'packSize', label: 'Pack Size' },
    ];

    return (
      <div className="space-y-5">
        {variantConfig.map(({ key, label }) => {
          const options = product.variants?.[key];
          if (!options || options.length === 0) return null;

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
                {selectedVariants[key] && (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    : {selectedVariants[key]}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleVariantSelect(key, option)}
                    className={`relative px-5 py-2.5 rounded-sm text-sm font-medium transition-all border-2 ${
                      selectedVariants[key] === option
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {option}
                    {selectedVariants[key] === option && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
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
    <div className={`bg-gray-100 dark:bg-gray-950 ${mode === 'page' ? 'min-h-screen' : ''}`}>
      {/* Main Content Container */}
      <div className="max-w-[1400px] mx-auto">
        {/* Product Main Section */}
        <div className="bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex flex-col lg:flex-row">
            
            {/* Left Column - Sticky Image Gallery (Flipkart Style) */}
            <div className="lg:w-[40%] xl:w-[35%] lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
              <div className="p-4 lg:p-6 h-full flex flex-col">
                {/* Main Image with Thumbnails Layout */}
                <div className="flex gap-4 flex-1">
                  {/* Vertical Thumbnails - Desktop Only */}
                  {images.length > 1 && (
                    <div 
                      ref={thumbnailRef}
                      className="hidden lg:flex flex-col gap-2 overflow-y-auto max-h-[500px] scrollbar-hide"
                    >
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          onMouseEnter={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                            selectedImageIndex === index
                              ? 'border-blue-500 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
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

                  {/* Main Image Container */}
                  <div 
                    ref={imageContainerRef}
                    className="flex-1 relative"
                  >
                    <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                      {hasImages ? (
                        <>
                          <img
                            src={images[selectedImageIndex]}
                            alt={product.name}
                            className="w-full h-full object-contain p-4 cursor-zoom-in transition-transform duration-300"
                            onClick={() => setIsZoomed(true)}
                          />
                          
                          {/* Mobile Navigation Arrows */}
                          {images.length > 1 && (
                            <div className="lg:hidden">
                              <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
                              >
                                <ChevronLeft className="w-5 h-5 text-gray-700" />
                              </button>
                              <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
                              >
                                <ChevronRight className="w-5 h-5 text-gray-700" />
                              </button>
                            </div>
                          )}
                          
                          {/* Image Counter - Mobile */}
                          {images.length > 1 && (
                            <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                              {selectedImageIndex + 1} / {images.length}
                            </div>
                          )}
                          
                          {/* Zoom Hint - Desktop */}
                          <div className="hidden lg:flex absolute bottom-3 right-3 items-center gap-1 px-2 py-1 rounded bg-black/50 text-white text-xs">
                            <ZoomIn className="w-3 h-3" />
                            Click to zoom
                          </div>

                          {/* Wishlist Button */}
                          <button
                            onClick={() => setIsWishlisted(!isWishlisted)}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                          </button>

                          {/* Discount Badge */}
                          {getDiscount() > 0 && (
                            <div className="absolute top-3 left-3 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                              {getDiscount()}% OFF
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                          <div className="text-center">
                            {product.icon ? (
                              <span className="text-8xl block mb-4">{product.icon}</span>
                            ) : (
                              <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
                            )}
                            <p className="text-gray-400 text-sm">No image available</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile Horizontal Thumbnails */}
                    {images.length > 1 && (
                      <div className="lg:hidden flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-all ${
                              selectedImageIndex === index
                                ? 'border-blue-500'
                                : 'border-gray-200 hover:border-blue-300'
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
                </div>

                {/* Action Buttons - Desktop */}
                {(showAddToCart || onRequestQuote) && (
                  <div className="hidden lg:flex gap-3 mt-6">
                    {showAddToCart && onAddToCart && (
                      <Button
                        size="lg"
                        className="flex-1 h-14 text-base font-semibold rounded-sm bg-[#ff9f00] hover:bg-[#e89100] text-white shadow-lg"
                        onClick={() => onAddToCart(quantity, selectedVariants)}
                        disabled={product.stock === 0}
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        ADD TO CART
                      </Button>
                    )}
                    {onRequestQuote && (
                      <Button
                        size="lg"
                        className="flex-1 h-14 text-base font-semibold rounded-sm bg-[#fb641b] hover:bg-[#e85a17] text-white shadow-lg"
                        onClick={() => onRequestQuote(quantity, selectedVariants)}
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        REQUEST QUOTE
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Product Details (Flipkart Style) */}
            <div className="lg:w-[60%] xl:w-[65%] lg:border-l border-gray-100 dark:border-gray-800">
              <div className="p-4 lg:p-8 space-y-6">
                
                {/* Breadcrumb / Category Path */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {product.category && (
                    <>
                      <span className="hover:text-blue-600 cursor-pointer">{product.category}</span>
                      {product.subcategory && (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          <span className="hover:text-blue-600 cursor-pointer">{product.subcategory}</span>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Product Title */}
                <div>
                  <h1 className="text-xl lg:text-2xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                    {product.name}
                  </h1>
                  
                  </div>

                {/* Rating Section */}
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">
                    4.2 <Star className="w-3 h-3 fill-current" />
                  </div>
                  <span className="text-sm text-gray-500">
                    1,234 Ratings & 567 Reviews
                  </span>
                </div>

                {/* Special Price Tag */}
                {getDiscount() > 0 && (
                  <div className="inline-block">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                      Special Price
                    </span>
                  </div>
                )}

                {/* Pricing Section - Flipkart Style */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{getPrice().toLocaleString()}
                    </span>
                    {product.unit && (
                      <span className="text-base text-gray-500">
                        per {getUnitAbbrev(product.unit)}
                      </span>
                    )}
                    {getMrp() > getPrice() && (
                      <>
                        <span className="text-lg text-gray-400 line-through">
                          ₹{getMrp().toLocaleString()}
                        </span>
                        <span className="text-lg font-semibold text-green-600">
                          {getDiscount()}% off
                        </span>
                      </>
                    )}
                  </div>
                  {getSavings() > 0 && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      You save ₹{getSavings().toLocaleString()} on this order
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Inclusive of all taxes</p>
                </div>

                {/* Stock Status */}
                {showStock && product.stock !== undefined && (
                  <div className="flex items-center gap-3">
                    {product.stock > 0 ? (
                      <div className="flex items-center gap-2">
                        <CircleCheck className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-semibold">In Stock</span>
                        {product.stock <= 10 && (
                          <span className="text-orange-500 text-sm font-medium bg-orange-50 px-2 py-0.5 rounded">
                            Hurry, only {product.stock} left!
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <X className="w-5 h-5 text-red-500" />
                        <span className="text-red-500 font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Variants */}
                {product.variants && Object.keys(product.variants).some(k => (product.variants as any)[k]?.length > 0) && (
                  <div className="pt-2">
                    {renderVariants()}
                  </div>
                )}

                {/* Quantity Selector */}
                {showQuantitySelector && product.stock !== 0 && product.stock !== undefined && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Quantity</span>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-14 text-center font-semibold text-lg border-x border-gray-300 dark:border-gray-600">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={product.stock !== undefined && quantity >= product.stock}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Services Section - Flipkart Style */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Vyora Verified</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                      <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                      <BadgeCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Quality Assured</span>
                  </div>
                </div>

                {/* Prescription Warning */}
                {product.requiresPrescription && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      This product requires a valid prescription. Please upload your prescription during checkout.
                    </p>
                  </div>
                )}

                {/* Warranty & Guarantee Cards */}
                {(product.hasWarranty || product.hasGuarantee) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.hasWarranty && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                            {product.warrantyDuration} {product.warrantyUnit} Warranty
                          </h3>
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            Manufacturer warranty
                          </p>
                        </div>
                      </div>
                    )}
                    {product.hasGuarantee && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm">
                            {product.guaranteeDuration} {product.guaranteeUnit} Guarantee
                          </h3>
                          <p className="text-xs text-green-600 dark:text-green-300">
                            Seller guarantee
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
          
        {/* Product Highlights Section */}
        {product.specifications && product.specifications.length > 0 && (
          <>
            <div className="bg-white dark:bg-gray-900 shadow-sm p-4 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Highlights
              </h2>
              <div className="grid gap-3 max-w-3xl">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CircleCheck className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Product Description Section */}
        <div className="bg-white dark:bg-gray-900 shadow-sm p-4 lg:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Description
          </h2>
          <div className="max-w-4xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
              {product.description || "No description available for this product."}
            </p>
          </div>
        </div>
        
        {/* Specifications Table - Flipkart Style */}
        <div className="bg-white dark:bg-gray-900 shadow-sm p-4 lg:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Specifications
          </h2>
          <div className="max-w-4xl">
            <div className="space-y-6">
              {/* General Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  General
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {product.brand && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 w-1/3">Brand</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{product.brand}</td>
                        </tr>
                      )}
                      {product.category && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">Category</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{product.category}</td>
                        </tr>
                      )}
                      {product.subcategory && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">Type</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{product.subcategory}</td>
                        </tr>
                      )}
                      {product.unit && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">Unit</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium capitalize">{product.unit}</td>
                        </tr>
                      )}
                      {product.stock !== undefined && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">In The Box</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                            1 x {product.name}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warranty Section */}
              {(product.hasWarranty || product.hasGuarantee) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Warranty
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {product.hasWarranty && (
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 w-1/3">Warranty Period</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{product.warrantyDuration} {product.warrantyUnit}</td>
                          </tr>
                        )}
                        {product.hasGuarantee && (
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">Guarantee</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{product.guaranteeDuration} {product.guaranteeUnit}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags Section */}
        {product.tags && product.tags.length > 0 && (
          <div className="bg-white dark:bg-gray-900 shadow-sm p-4 lg:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Related Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
        )}
        
        {/* Bottom Padding for Mobile Fixed Buttons */}
        <div className="h-24 lg:hidden"></div>
      </div>

      {/* Mobile Fixed Bottom Buttons */}
      {(showAddToCart || onRequestQuote) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2 z-50 shadow-lg">
          {showAddToCart && onAddToCart && (
            <Button
              size="lg"
              className="flex-1 h-12 text-sm font-bold rounded-sm bg-[#ff9f00] hover:bg-[#e89100] text-white"
              onClick={() => onAddToCart(quantity, selectedVariants)}
              disabled={product.stock === 0}
            >
              ADD TO CART
            </Button>
          )}
          {onRequestQuote && (
            <Button
              size="lg"
              className="flex-1 h-12 text-sm font-bold rounded-sm bg-[#fb641b] hover:bg-[#e85a17] text-white"
              onClick={() => onRequestQuote(quantity, selectedVariants)}
            >
              GET QUOTE
            </Button>
          )}
        </div>
      )}

      {/* Zoom Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/98">
          <DialogTitle className="sr-only">Zoomed Image</DialogTitle>
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-8">
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
                
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          
          {/* Thumbnail strip in zoom view */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-black/50 rounded-lg backdrop-blur-sm">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-14 h-14 rounded overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-white'
                      : 'border-transparent opacity-50 hover:opacity-100'
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
