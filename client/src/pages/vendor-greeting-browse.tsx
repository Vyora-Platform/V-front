import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Download, Share2, ArrowLeft, Loader2, X, Check,
  Sparkles, Gift, Calendar, Tag, TrendingUp, Star, Megaphone,
  PartyPopper, Heart, ShoppingBag, Bell, Sun, Moon, Camera, Phone, MapPin,
  Building, Briefcase, Store, Coffee, Dumbbell, Scissors, Stethoscope, 
  BookOpen, Utensils, Car, PawPrint, GraduationCap, Home, Shirt, Gem, Plane,
  Bookmark, Image as ImageIcon, ChevronLeft, ChevronRight, Package, Wrench, Ticket
} from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram, SiTelegram } from "react-icons/si";
import type { GreetingTemplate, Category } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LoadingSpinner } from "@/components/AuthGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { cn } from "@/lib/utils";

// Category Icons Map
const categoryIcons: Record<string, any> = {
  "Sparkles": Sparkles, "Gift": Gift, "Calendar": Calendar, "Tag": Tag,
  "TrendingUp": TrendingUp, "Star": Star, "Megaphone": Megaphone,
  "PartyPopper": PartyPopper, "Heart": Heart, "ShoppingBag": ShoppingBag,
  "Bell": Bell, "Sun": Sun, "Moon": Moon, "Camera": Camera,
  "Building": Building, "Briefcase": Briefcase, "Store": Store,
  "Coffee": Coffee, "Dumbbell": Dumbbell, "Scissors": Scissors,
  "Stethoscope": Stethoscope, "BookOpen": BookOpen, "Utensils": Utensils,
  "Car": Car, "PawPrint": PawPrint, "GraduationCap": GraduationCap,
  "Home": Home, "Shirt": Shirt, "Gem": Gem, "Plane": Plane
};

// Default Categories
const defaultCategories = [
  { id: "good_morning", name: "Good Morning", icon: "Sun", color: "#F59E0B" },
  { id: "festivals", name: "Festivals", icon: "PartyPopper", color: "#EF4444" },
  { id: "quotes", name: "Hindi Quotes", icon: "BookOpen", color: "#8B5CF6" },
  { id: "freedom_fighters", name: "Freedom Fighters", icon: "Star", color: "#10B981" },
  { id: "personalities", name: "Great Personalities", icon: "GraduationCap", color: "#3B82F6" },
  { id: "atmanirbhar", name: "Atmanirbhar Bharat", icon: "Heart", color: "#EC4899" },
  { id: "historical", name: "Historical Places", icon: "Building", color: "#F97316" },
  { id: "sports", name: "Sports Quotes", icon: "Dumbbell", color: "#06B6D4" },
  { id: "offers", name: "Offers & Discounts", icon: "Tag", color: "#10B981" },
  { id: "marketing", name: "Marketing", icon: "Megaphone", color: "#8B5CF6" },
  { id: "announcements", name: "Announcements", icon: "Bell", color: "#F97316" },
  { id: "greetings", name: "Greetings", icon: "Heart", color: "#EC4899" },
];

interface VendorBranding {
  businessName: string;
  logo: string;
  phone: string;
  address: string;
}

// Clean Image Component - No branding overlay on image
function CleanImage({ 
  src, 
  className = "" 
}: { 
  src: string; 
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

// Branding Card Component - Shows below image as attached card
function BrandingCard({ branding }: { branding: VendorBranding | null }) {
  if (!branding) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-3 rounded-b-2xl -mt-1">
      <div className="flex items-center gap-3">
        {/* Logo */}
        {branding.logo && (
          <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg shrink-0">
            <img src={branding.logo} alt="" className="w-full h-full rounded-lg object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* Business Name */}
          <p className="text-sm font-bold leading-tight truncate">
            {branding.businessName}
          </p>
          {/* Phone */}
          {branding.phone && (
            <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {branding.phone}
            </p>
          )}
          {/* Address */}
          {branding.address && (
            <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" /> {branding.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Image with Attached Branding Card
function ImageWithBrandingCard({ 
  src, 
  branding, 
  className = "" 
}: { 
  src: string; 
  branding: VendorBranding | null;
  className?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      <CleanImage src={src} className={className} />
      <BrandingCard branding={branding} />
    </div>
  );
}

// Product/Service/Coupon Selection Card
function CatalogueItemCard({ item, type, isSelected, onSelect }: { 
  item: any; 
  type: 'product' | 'service' | 'coupon';
  isSelected: boolean;
  onSelect: () => void;
}) {
  const getIcon = () => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'service': return <Wrench className="w-4 h-4" />;
      case 'coupon': return <Ticket className="w-4 h-4" />;
    }
  };

  const getImage = () => {
    if (type === 'product') return item.images?.[0] || item.image;
    if (type === 'service') return item.image || item.images?.[0];
    return null;
  };

  const getPrice = () => {
    if (type === 'product') return `₹${item.price || item.sellingPrice || 0}`;
    if (type === 'service') return item.price ? `₹${item.price}` : '';
    if (type === 'coupon') return `${item.discountValue || item.discount || item.discountPercentage}% OFF`;
    return '';
  };

  const getName = () => {
    if (type === 'coupon') return item.code || item.name;
    return item.name || item.title;
  };

  return (
    <div 
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
        isSelected 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-200 bg-white hover:border-blue-300"
      )}
    >
      {/* Image or Icon */}
      <div className={cn(
        "w-14 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
        getImage() ? "" : "bg-gray-100"
      )}>
        {getImage() ? (
          <img src={getImage()} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400">{getIcon()}</div>
        )}
      </div>
      
      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{getName()}</p>
        {getPrice() && (
          <p className={cn(
            "text-sm font-bold",
            type === 'coupon' ? "text-green-600" : "text-blue-600"
          )}>
            {getPrice()}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
        )}
      </div>
      
      {/* Selection Indicator */}
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
        isSelected ? "bg-blue-500 text-white" : "border-2 border-gray-300"
      )}>
        {isSelected && <Check className="w-4 h-4" />}
      </div>
    </div>
  );
}

// Enhanced Share Modal with branding card below image
function ShareModal({ template, isOpen, onClose, branding, products, services, coupons }: any) {
  const { toast } = useToast();
  const { isFree } = useSubscription();
  const [customText, setCustomText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'coupons'>('products');

  // Set default tab based on available data
  useEffect(() => {
    if (products?.length > 0) setActiveTab('products');
    else if (services?.length > 0) setActiveTab('services');
    else if (coupons?.length > 0) setActiveTab('coupons');
  }, [products, services, coupons]);

  if (!template) return null;
  
  const handleProAction = (action: () => void) => {
    if (isFree) {
      setShowUpgradeModal(true);
      return;
    }
    action();
  };

  const buildShareText = () => {
    let text = customText || template.title;
    if (selectedProduct) {
      text += `\n\n🏷️ ${selectedProduct.name}`;
      if (selectedProduct.price || selectedProduct.sellingPrice) {
        text += ` - ₹${selectedProduct.price || selectedProduct.sellingPrice}`;
      }
      if (selectedProduct.description) text += `\n${selectedProduct.description.substring(0, 100)}`;
    }
    if (selectedService) {
      text += `\n\n⚙️ ${selectedService.name}`;
      if (selectedService.price) text += ` - ₹${selectedService.price}`;
      if (selectedService.description) text += `\n${selectedService.description.substring(0, 100)}`;
    }
    if (selectedCoupon) {
      text += `\n\n🎁 Use code: ${selectedCoupon.code || selectedCoupon.name}`;
      text += ` - Get ${selectedCoupon.discountValue || selectedCoupon.discount || selectedCoupon.discountPercentage}% OFF`;
    }
    if (branding) {
      text += `\n\n📍 ${branding.businessName}`;
      if (branding.phone) text += `\n📞 ${branding.phone}`;
      if (branding.address) text += `\n🏠 ${branding.address}`;
    }
    return text;
  };

  // Generate image with branding card attached below
  const generateBrandedImage = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas not supported');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        // Calculate dimensions - add space for branding card at bottom
        const brandingCardHeight = branding ? 100 : 0;
        canvas.width = img.width;
        canvas.height = img.height + brandingCardHeight;
        
        // Draw the clean image
        ctx.drawImage(img, 0, 0);
        
        // Draw branding card below the image
        if (branding) {
          const cardY = img.height;
          
          // Draw gradient background for branding card
          const gradient = ctx.createLinearGradient(0, cardY, canvas.width, cardY);
          gradient.addColorStop(0, '#2563eb');
          gradient.addColorStop(0.5, '#1d4ed8');
          gradient.addColorStop(1, '#1e40af');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, cardY, canvas.width, brandingCardHeight);
          
          let textX = 20;
          const textY = cardY + 25;
          
          // Draw logo with white background
          if (branding.logo) {
            try {
              const logoImg = new Image();
              logoImg.crossOrigin = 'anonymous';
              await new Promise<void>((res, rej) => {
                logoImg.onload = () => res();
                logoImg.onerror = () => rej();
                logoImg.src = branding.logo;
              });
              
              const logoSize = 60;
              const logoY = cardY + 20;
              
              // Draw white rounded background
              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.roundRect(textX, logoY, logoSize, logoSize, 10);
              ctx.fill();
              
              // Draw logo
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(textX + 4, logoY + 4, logoSize - 8, logoSize - 8, 8);
              ctx.clip();
              ctx.drawImage(logoImg, textX + 4, logoY + 4, logoSize - 8, logoSize - 8);
              ctx.restore();
              
              textX += logoSize + 15;
            } catch {
              // Logo failed to load
            }
          }
          
          // Draw business name
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px Arial, sans-serif';
          ctx.fillText(branding.businessName, textX, textY + 10);
          
          // Draw phone
          if (branding.phone) {
            ctx.font = '16px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(`📞 ${branding.phone}`, textX, textY + 35);
          }
          
          // Draw address
          if (branding.address) {
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            const truncatedAddress = branding.address.length > 50 
              ? branding.address.substring(0, 47) + '...' 
              : branding.address;
            ctx.fillText(`📍 ${truncatedAddress}`, textX, textY + 55);
          }
        }
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Failed to create blob');
        }, 'image/jpeg', 0.95);
      };
      img.onerror = () => reject('Failed to load image');
      img.src = template.imageUrl;
    });
  };

  // Share image directly using Web Share API
  const handleShare = async (platform: string) => {
    setIsSharing(true);
    try {
      await apiRequest("POST", `/api/greeting-templates/${template.id}/share`, { platform });
      
      const imageBlob = await generateBrandedImage();
      const fileName = `${(branding?.businessName || 'poster').replace(/[^a-z0-9]/gi, "_")}_marketing.jpg`;
      const file = new File([imageBlob], fileName, { type: 'image/jpeg' });
      
      // Try native share first (for mobile - shares image directly)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: branding?.businessName || 'Marketing Post',
          text: buildShareText(),
        });
        toast({ title: "Shared successfully!" });
      } else {
        // Fallback - Download image and open share URL
        const url = window.URL.createObjectURL(imageBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        const shareText = buildShareText();
        let shareUrl = "";
        switch (platform) {
          case "whatsapp": shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`; break;
          case "telegram": shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`; break;
        }
        if (shareUrl) window.open(shareUrl, "_blank");
        toast({ title: "Image downloaded! Share it from your gallery." });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({ title: "Sharing failed. Please try downloading instead.", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await apiRequest("POST", `/api/greeting-templates/${template.id}/download`, {});
      const blob = await generateBrandedImage();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(branding?.businessName || 'poster').replace(/[^a-z0-9]/gi, "_")}_${template.title.replace(/[^a-z0-9]/gi, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded with your branding!" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const hasProducts = products?.length > 0;
  const hasServices = services?.length > 0;
  const hasCoupons = coupons?.length > 0;
  const hasCatalogue = hasProducts || hasServices || hasCoupons;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] md:max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[90vh] md:max-h-[95vh]">
          {/* Header with Back Button */}
          <div className="p-3 md:p-4 border-b flex items-center gap-3 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-10 w-10 rounded-full text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-bold text-white truncate">Share Marketing Post</h2>
              <p className="text-xs text-blue-100">Your branding card is attached below</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 shrink-0 hidden md:flex">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Preview with Branding Card Below */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4">
              <div className="max-w-[320px] mx-auto">
                <ImageWithBrandingCard 
                  src={template.imageUrl} 
                  branding={branding} 
                  className="aspect-square" 
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">Preview: Image + Branding Card</p>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Custom Message */}
              <div className="bg-blue-50 rounded-xl p-4">
                <Label className="text-sm font-semibold text-blue-700">Custom Message (Optional)</Label>
                <Textarea
                  placeholder="Add your custom greeting or offer message..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="mt-2 h-20 bg-white border-blue-200"
                />
              </div>
              
              {/* Catalogue Selection - Products/Services/Coupons */}
              {hasCatalogue && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Link from Your Catalogue</Label>
                  
                  {/* Tabs */}
                  <div className="flex gap-2">
                    {hasProducts && (
                      <button
                        onClick={() => setActiveTab('products')}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                          activeTab === 'products' 
                            ? "bg-blue-600 text-white" 
                            : "bg-white text-gray-600 border hover:bg-gray-100"
                        )}
                      >
                        <Package className="w-4 h-4" />
                        Products ({products.length})
                      </button>
                    )}
                    {hasServices && (
                      <button
                        onClick={() => setActiveTab('services')}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                          activeTab === 'services' 
                            ? "bg-blue-600 text-white" 
                            : "bg-white text-gray-600 border hover:bg-gray-100"
                        )}
                      >
                        <Wrench className="w-4 h-4" />
                        Services ({services.length})
                      </button>
                    )}
                    {hasCoupons && (
                      <button
                        onClick={() => setActiveTab('coupons')}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                          activeTab === 'coupons' 
                            ? "bg-green-600 text-white" 
                            : "bg-white text-gray-600 border hover:bg-gray-100"
                        )}
                      >
                        <Ticket className="w-4 h-4" />
                        Coupons ({coupons.length})
                      </button>
                    )}
                  </div>
                  
                  {/* Items List */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {activeTab === 'products' && products?.slice(0, 10).map((item: any) => (
                      <CatalogueItemCard 
                        key={item.id}
                        item={item}
                        type="product"
                        isSelected={selectedProduct?.id === item.id}
                        onSelect={() => {
                          setSelectedProduct(selectedProduct?.id === item.id ? null : item);
                          setSelectedService(null);
                          setSelectedCoupon(null);
                        }}
                      />
                    ))}
                    {activeTab === 'services' && services?.slice(0, 10).map((item: any) => (
                      <CatalogueItemCard 
                        key={item.id}
                        item={item}
                        type="service"
                        isSelected={selectedService?.id === item.id}
                        onSelect={() => {
                          setSelectedService(selectedService?.id === item.id ? null : item);
                          setSelectedProduct(null);
                          setSelectedCoupon(null);
                        }}
                      />
                    ))}
                    {activeTab === 'coupons' && coupons?.map((item: any) => (
                      <CatalogueItemCard 
                        key={item.id}
                        item={item}
                        type="coupon"
                        isSelected={selectedCoupon?.id === item.id}
                        onSelect={() => {
                          setSelectedCoupon(selectedCoupon?.id === item.id ? null : item);
                          setSelectedProduct(null);
                          setSelectedService(null);
                        }}
                      />
                    ))}
                    
                    {/* Empty state for each tab */}
                    {activeTab === 'products' && !hasProducts && (
                      <p className="text-center text-gray-500 py-4 text-sm">No products available</p>
                    )}
                    {activeTab === 'services' && !hasServices && (
                      <p className="text-center text-gray-500 py-4 text-sm">No services available</p>
                    )}
                    {activeTab === 'coupons' && !hasCoupons && (
                      <p className="text-center text-gray-500 py-4 text-sm">No coupons available</p>
                    )}
                  </div>
                  
                  {/* Clear Selection */}
                  {(selectedProduct || selectedService || selectedCoupon) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setSelectedProduct(null); setSelectedService(null); setSelectedCoupon(null); }}
                      className="text-gray-500"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t shrink-0 space-y-3 bg-gray-50">
            {isFree && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
                <p className="text-xs text-amber-700 text-center">
                  🔒 Download & Share are Pro features. <button className="font-bold underline" onClick={() => setShowUpgradeModal(true)}>Upgrade to unlock</button>
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={() => handleProAction(handleDownload)} 
                disabled={isDownloading || isSharing} 
                className={cn("flex-1 h-12", isFree ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700")}
              >
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isFree ? "Pro Only" : "Download"}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleProAction(() => handleShare("whatsapp"))} 
                disabled={isSharing}
                className={cn("h-12 bg-green-50 border-green-200 hover:bg-green-100", isFree && "opacity-60")}
              >
                <SiWhatsapp className="w-6 h-6 text-green-600" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleProAction(() => handleShare("facebook"))} 
                disabled={isSharing}
                className={cn("h-12 bg-blue-50 border-blue-200 hover:bg-blue-100", isFree && "opacity-60")}
              >
                <SiFacebook className="w-6 h-6 text-blue-600" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleProAction(() => handleShare("instagram"))} 
                disabled={isSharing}
                className={cn("h-12 bg-pink-50 border-pink-200 hover:bg-pink-100", isFree && "opacity-60")}
              >
                <SiInstagram className="w-6 h-6 text-pink-600" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleProAction(() => handleShare("telegram"))} 
                disabled={isSharing}
                className={cn("h-12 bg-sky-50 border-sky-200 hover:bg-sky-100", isFree && "opacity-60")}
              >
                <SiTelegram className="w-6 h-6 text-sky-600" />
              </Button>
            </div>
            {isSharing && (
              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing image for sharing...
              </p>
            )}
          </div>
        </div>
      </DialogContent>
      
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature="Download & Share Marketing Posts" />
    </Dialog>
  );
}

// Category View with templates - clean images with branding card
function CategoryView({ category, templates, onBack, onSelectTemplate, branding, toggleWishlist, isInWishlist }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTemplates = templates.filter((t: any) => 
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header - Fixed position to prevent overlap */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold flex-1">{category.name}</h2>
          <Badge className="bg-blue-100 text-blue-700">{templates.length}</Badge>
        </div>
        
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-gray-50 border-gray-200" />
          </div>
        </div>
      </div>

      {/* Templates Grid - Proper scroll container */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-24 md:pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template: any) => (
            <div
              key={template.id}
              className="relative cursor-pointer group"
              onClick={() => onSelectTemplate(template)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist(template); }}
                className={cn(
                  "absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-md transition-all",
                  isInWishlist(template.id) ? "bg-pink-500 text-white" : "bg-white/90 text-gray-500"
                )}
              >
                <Bookmark className={cn("w-3.5 h-3.5", isInWishlist(template.id) && "fill-current")} />
              </button>
              <ImageWithBrandingCard 
                src={template.imageUrl} 
                branding={branding} 
                className="aspect-square group-hover:scale-[1.02] transition-transform duration-300" 
              />
            </div>
          ))}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No templates found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorGreetingBrowse() {
  const params = useParams<{ vendorId: string }>();
  const { vendorId: hookVendorId } = useAuth();
  const { toast } = useToast();
  
  const vendorId = params.vendorId || hookVendorId;
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GreetingTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState<string>("all");
  const businessCategoryScrollRef = useRef<HTMLDivElement>(null);

  // Wishlist state
  const [wishlist, setWishlist] = useState<GreetingTemplate[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem(`vendor_wishlist_${vendorId}`);
    if (saved) setWishlist(JSON.parse(saved));
  }, [vendorId]);

  const toggleWishlist = (template: GreetingTemplate) => {
    const exists = wishlist.some(t => t.id === template.id);
    const newWishlist = exists ? wishlist.filter(t => t.id !== template.id) : [template, ...wishlist];
    setWishlist(newWishlist);
    localStorage.setItem(`vendor_wishlist_${vendorId}`, JSON.stringify(newWishlist));
  };

  const isInWishlist = (templateId: string) => wishlist.some(t => t.id === templateId);

  // Fetch vendor profile for auto-branding
  const { data: vendorProfile } = useQuery<any>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Auto branding from vendor profile
  const branding: VendorBranding | null = vendorProfile ? {
    businessName: vendorProfile.businessName || vendorProfile.name || 'Business',
    logo: vendorProfile.logo || vendorProfile.profileImage || '',
    phone: vendorProfile.phone || vendorProfile.mobileNumber || '',
    address: vendorProfile.address || vendorProfile.businessAddress || '',
  } : null;

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/greeting-templates?status=published"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Fetch template categories (poster categories)
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/poster-categories"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/poster-categories"));
      if (!res.ok) return defaultCategories;
      const data = await res.json();
      return data.length > 0 ? data : defaultCategories;
    },
  });

  // Fetch business categories from master data
  const { data: businessCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch vendor products
  const { data: products = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  // Fetch vendor services (catalogue) - FIXED: using correct endpoint
  const { data: services = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  // Fetch vendor coupons
  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/coupons`],
    enabled: !!vendorId,
  });

  // Filter templates by business category
  const filteredByBusinessCategory = selectedBusinessCategory === "all" 
    ? templates 
    : templates.filter(t => t.industries?.includes(selectedBusinessCategory));

  // Search results
  const searchResults = searchQuery 
    ? filteredByBusinessCategory.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Get templates for category
  const getTemplatesForCategory = (cat: any) => {
    const baseTemplates = filteredByBusinessCategory;
    if (cat.id === "festivals") return baseTemplates.filter(t => t.occasions && t.occasions.length > 0);
    if (cat.id === "offers") return baseTemplates.filter(t => t.offerTypes?.includes("flat_discount") || t.offerTypes?.includes("bogo"));
    if (cat.id === "marketing") return baseTemplates.filter(t => t.offerTypes?.includes("marketing"));
    if (cat.id === "announcements") return baseTemplates.filter(t => t.offerTypes?.includes("announcement"));
    if (cat.id === "greetings") return baseTemplates.filter(t => t.offerTypes?.includes("greeting"));
    return baseTemplates.filter(t => t.categoryId === cat.id);
  };

  const handleTemplateSelect = (template: GreetingTemplate) => {
    setSelectedTemplate(template);
    setShowShareModal(true);
  };

  // Scroll business category filter
  const scrollBusinessCategories = (direction: 'left' | 'right') => {
    if (businessCategoryScrollRef.current) {
      const scrollAmount = 200;
      businessCategoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading || !vendorId) return <LoadingSpinner />;

  const allCategories = categories.length > 0 ? categories : defaultCategories;

  // Category View
  if (selectedCategory) {
    return (
      <>
        <CategoryView
          category={selectedCategory}
          templates={getTemplatesForCategory(selectedCategory)}
          onBack={() => setSelectedCategory(null)}
          onSelectTemplate={handleTemplateSelect}
          branding={branding}
          toggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
        />
        <ShareModal
          template={selectedTemplate}
          isOpen={showShareModal}
          onClose={() => { setShowShareModal(false); setSelectedTemplate(null); }}
          branding={branding}
          products={products}
          services={services}
          coupons={coupons}
        />
      </>
    );
  }

  // Main View
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header - Fixed with proper z-index */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/vendor/dashboard")} className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Marketing Posts</h1>
          </div>
          
          {/* Show current branding info */}
          {branding && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              {branding.logo && <img src={branding.logo} className="w-6 h-6 rounded-full object-cover" />}
              <span className="text-xs font-medium text-blue-700 max-w-[100px] truncate">{branding.businessName}</span>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl border-gray-200 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Business Category Filter - Horizontal Scrolling */}
        {businessCategories.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="shrink-0 h-9 w-9 rounded-lg border-2"
                onClick={() => scrollBusinessCategories('left')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div 
                ref={businessCategoryScrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Select All Option */}
                <button
                  onClick={() => setSelectedBusinessCategory("all")}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all whitespace-nowrap",
                    selectedBusinessCategory === "all"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  )}
                >
                  All Categories
                </button>
                {businessCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedBusinessCategory(category.id)}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all whitespace-nowrap",
                      selectedBusinessCategory === category.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="shrink-0 h-9 w-9 rounded-lg border-2"
                onClick={() => scrollBusinessCategories('right')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content - Proper scroll container with bottom padding */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-24 md:pb-8">
        {/* Search Results */}
        {searchQuery && (
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-3">{searchResults.length} results for "{searchQuery}"</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchResults.map((template) => (
                <div 
                  key={template.id} 
                  className="cursor-pointer hover:scale-[1.02] transition-transform" 
                  onClick={() => handleTemplateSelect(template)}
                >
                  <ImageWithBrandingCard src={template.imageUrl} branding={branding} className="aspect-square" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!searchQuery && (
          <>
            {/* Categories - Grid Style */}
            <div className="py-6 px-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allCategories.map((cat) => {
                  const IconComponent = categoryIcons[cat.icon] || Sparkles;
                  const categoryTemplates = getTemplatesForCategory(cat);
                  const previewImage = categoryTemplates[0]?.imageUrl;
                  
                  return (
                    <div
                      key={cat.id}
                      className="cursor-pointer group"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <div className="aspect-square rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 group-hover:shadow-lg group-hover:scale-[1.02] transition-all">
                        {previewImage ? (
                          <CleanImage src={previewImage} className="w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}40)` }}>
                            <IconComponent className="w-10 h-10" style={{ color: cat.color }} />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-800 text-center line-clamp-2">{cat.name}</p>
                      {categoryTemplates.length > 0 && (
                        <p className="text-xs text-gray-500 text-center">{categoryTemplates.length} templates</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        template={selectedTemplate}
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setSelectedTemplate(null); }}
        branding={branding}
        products={products}
        services={services}
        coupons={coupons}
      />
    </div>
  );
}
