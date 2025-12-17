import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Tag,
  Package,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import type { MasterProduct, VendorProduct } from "@shared/schema";
import { useState, useEffect } from "react";

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MasterProduct | VendorProduct | null;
}

export default function ProductDetailDialog({ open, onOpenChange, product }: ProductDetailDialogProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageZoomed, setImageZoomed] = useState(false);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(0);
    setImageZoomed(false);
  }, [product?.id]);

  if (!product) return null;

  const isVendorProduct = 'vendorId' in product;
  const productData = product as any;

  // Get images array
  const images = productData.images || [];
  const hasImages = images.length > 0;

  // Get display image with proper fallback handling
  const displayImage = hasImages && selectedImage < images.length 
    ? images[selectedImage] 
    : null;

  // Get pricing
  const price = isVendorProduct ? productData.price : productData.basePrice;
  const hasDiscount = isVendorProduct && productData.discountPercentage > 0;
  const discountedPrice = hasDiscount 
    ? Math.round(price * (1 - productData.discountPercentage / 100))
    : null;

  // Navigate images
  const nextImage = () => {
    if (hasImages && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const prevImage = () => {
    if (selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 gap-0">
        <div className="flex flex-col lg:flex-row h-full max-h-[95vh] overflow-hidden">
          {/* Left Column - Product Images (Amazon-style) */}
          <div className="lg:w-1/2 flex flex-col bg-white border-r p-6 overflow-y-auto">
            {/* Main Image */}
            <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4 group">
              {displayImage ? (
                <>
                <img
                  src={displayImage}
                  alt={product.name}
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      imageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setImageZoomed(!imageZoomed)}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                  {/* Image Navigation Arrows */}
                  {hasImages && images.length > 1 && (
                    <>
                      {selectedImage > 0 && (
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Previous image"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                      )}
                      {selectedImage < images.length - 1 && (
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Next image"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : null}
              <div 
                className={`${displayImage ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gray-100 absolute inset-0`}
              >
                <div className="text-center">
                  <ImageIcon className="h-24 w-24 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No image available</p>
                </div>
              </div>
            </div>
            
            {/* Image Thumbnails (Horizontal) */}
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === idx 
                        ? 'border-orange-500 ring-2 ring-orange-200' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details (Amazon-style) */}
          <div className="lg:w-1/2 flex flex-col overflow-y-auto p-6 bg-white">
            <div className="space-y-4">
              {/* Product Title */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="text-lg text-blue-600 hover:text-blue-800 cursor-pointer mb-2">
                    Visit the {product.brand} Store
                  </p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                    (0 ratings)
                  </span>
                </div>
                <Separator className="my-4" />
                </div>
                
              {/* Price Section */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  {hasDiscount ? (
                    <>
                      <span className="text-3xl font-bold text-red-600">
                        ₹{discountedPrice?.toLocaleString()}
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{price?.toLocaleString()}
                      </span>
                      <Badge variant="destructive" className="text-sm font-semibold">
                        {productData.discountPercentage}% OFF
                      </Badge>
                    </>
                  ) : price ? (
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{price.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xl text-gray-500">Price not set</span>
                  )}
                </div>
                {price && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">M.R.P.:</span> ₹{price.toLocaleString()} ({product.unit})
                  </p>
                )}
                {hasDiscount && (
                  <p className="text-sm text-green-700 font-semibold">
                    You Save: ₹{(price - (discountedPrice || 0)).toLocaleString()} ({productData.discountPercentage}%)
                  </p>
                )}
              </div>

              {/* Key Features */}
              {productData.specifications && productData.specifications.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">About this item</h3>
                  <ul className="space-y-2">
                    {productData.specifications.slice(0, 5).map((spec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-gray-700">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stock & Availability */}
                {isVendorProduct && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-700">
                      In Stock
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {productData.stock} units available
                  </p>
                </div>
              )}

              {/* Prescription Warning */}
              {product.requiresPrescription && (
                <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Prescription Required</p>
                      <p className="text-sm text-red-800">
                        This product requires a valid prescription from a licensed healthcare provider.
                      </p>
                    </div>
                  </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="border-t pt-4 space-y-3">
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-lg rounded-lg"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-6 text-lg rounded-lg"
                  size="lg"
                >
                  Buy Now
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="border-t pt-4 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>Secure Payment</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex">
                  <span className="font-semibold w-32">Brand:</span>
                  <span className="text-gray-700">{product.brand || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Category:</span>
                  <span className="text-gray-700">{product.category}</span>
                </div>
                {product.subcategory && (
                  <div className="flex">
                    <span className="font-semibold w-32">Subcategory:</span>
                    <span className="text-gray-700">{product.subcategory}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-semibold w-32">Unit:</span>
                  <span className="text-gray-700">{product.unit}</span>
                </div>
                {!isVendorProduct && (
                  <div className="flex">
                    <span className="font-semibold w-32">Status:</span>
                    <Badge 
                      variant={product.status === 'published' ? "default" : "secondary"}
                      className={product.status === 'published' ? "bg-green-600" : ""}
                    >
                      {product.status}
                  </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Description & Details */}
        <div className="border-t bg-gray-50 p-6 overflow-y-auto max-h-[40vh]">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Product Description */}
          <div>
              <h2 className="text-xl font-semibold mb-3">Product Description</h2>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description || "No description provided"}
            </p>
              </div>
          </div>

            {/* Full Specifications */}
          {productData.specifications && productData.specifications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Product Specifications</h2>
                <Card className="bg-white">
                  <div className="divide-y">
                    {productData.specifications.map((spec: string, idx: number) => (
                      <div key={idx} className="p-3 hover:bg-gray-50">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-gray-700">{spec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
                <h2 className="text-xl font-semibold mb-3">Product Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                    {tag}
                  </Badge>
                ))}
              </div>
                </div>
              )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
