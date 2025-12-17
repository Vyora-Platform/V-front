import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, Download, Share2, ArrowLeft, Edit, Check, 
  Palette, Layout, Eye, Loader2, Copy, X, Upload, ZoomIn, ZoomOut, Move,
  Sparkles, Gift, Calendar, Tag, TrendingUp, Star, Megaphone,
  PartyPopper, Heart, ShoppingBag, Bell, Sun, Moon, Camera, Phone, Globe,
  Building, Briefcase, Store, Coffee, Dumbbell, Scissors, Stethoscope, 
  BookOpen, Utensils, Car, PawPrint, GraduationCap, Home, Shirt, Gem, Plane,
  Clock, Bookmark, BookmarkCheck
} from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram, SiLinkedin, SiTelegram } from "react-icons/si";
import type { GreetingTemplate } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LoadingSpinner } from "@/components/AuthGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { cn } from "@/lib/utils";

// Category Icons Map - Extended
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

// Business Category Options for filtering
const businessCategories = [
  { id: "all", name: "All Industries", icon: "Store" },
  { id: "fitness", name: "Fitness & Gym", icon: "Dumbbell" },
  { id: "salon", name: "Salon & Spa", icon: "Scissors" },
  { id: "restaurant", name: "Restaurant", icon: "Utensils" },
  { id: "retail", name: "Retail", icon: "ShoppingBag" },
  { id: "clinic", name: "Healthcare", icon: "Stethoscope" },
  { id: "education", name: "Education", icon: "GraduationCap" },
  { id: "real_estate", name: "Real Estate", icon: "Home" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "jewelry", name: "Jewelry", icon: "Gem" },
  { id: "automotive", name: "Automotive", icon: "Car" },
  { id: "pet_care", name: "Pet Care", icon: "PawPrint" },
  { id: "travel", name: "Travel", icon: "Plane" },
];

// Default Categories for display
const defaultCategories = [
  { id: "upcoming", name: "Upcoming Events", icon: "Calendar", color: "#EF4444", isUpcoming: true },
  { id: "festivals", name: "Festivals", icon: "PartyPopper", color: "#F59E0B" },
  { id: "offers", name: "Offers & Discounts", icon: "Tag", color: "#10B981" },
  { id: "greetings", name: "Greetings", icon: "Heart", color: "#EC4899" },
  { id: "marketing", name: "Marketing", icon: "Megaphone", color: "#8B5CF6" },
  { id: "trending", name: "Trending", icon: "TrendingUp", color: "#3B82F6" },
  { id: "new_arrivals", name: "New Arrivals", icon: "Sparkles", color: "#06B6D4" },
  { id: "announcements", name: "Announcements", icon: "Bell", color: "#F97316" },
];

// Branding Layouts
const brandingLayouts = [
  { id: "classic", name: "Classic", description: "Logo bottom-right with info bar" },
  { id: "modern", name: "Modern", description: "Full-width branded footer" },
  { id: "minimal", name: "Minimal", description: "Small corner branding" },
];

interface BrandingData {
  businessName: string;
  tagline: string;
  phone: string;
  website: string;
  logo: string;
  logoZoom: number;
  logoPosition: { x: number; y: number };
  primaryColor: string;
  defaultLayout: string;
}

// Instagram-like Logo Upload & Crop Modal with Drag to Pan
function LogoUploadModal({ isOpen, onClose, onSave, currentLogo }: any) {
  const [image, setImage] = useState<string | null>(currentLogo || null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Limit the movement based on zoom level
    const maxMove = 50 * zoom;
    setPosition({
      x: Math.max(-maxMove, Math.min(maxMove, newX)),
      y: Math.max(-maxMove, Math.min(maxMove, newY))
    });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!image) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    const maxMove = 50 * zoom;
    setPosition({
      x: Math.max(-maxMove, Math.min(maxMove, newX)),
      y: Math.max(-maxMove, Math.min(maxMove, newY))
    });
  }, [isDragging, dragStart, zoom]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleSave = () => {
    onSave({ logo: image, logoZoom: zoom, logoPosition: position });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            Upload Logo
          </DialogTitle>
          <DialogDescription>Upload and adjust your business logo like Instagram profile</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview Circle - Instagram Style */}
          <div 
            ref={containerRef}
            className={cn(
              "relative mx-auto w-36 h-36 rounded-full border-4 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center",
              image ? "border-blue-500 cursor-move" : "border-dashed border-muted-foreground/30"
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {image ? (
              <>
                <img
                  src={image}
                  alt="Logo"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  }}
                  draggable={false}
                />
                {/* Drag Indicator */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                  <Move className={cn("w-8 h-8 text-white opacity-0 hover:opacity-70 transition-opacity", isDragging && "opacity-70")} />
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Tap to upload</p>
              </div>
            )}
          </div>

          {image && (
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Move className="w-3 h-3" /> Drag to reposition • Pinch or use slider to zoom
            </p>
          )}
          
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            {image ? "Change Image" : "Upload Image"}
          </Button>
          
          {/* Zoom Control */}
          {image && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Zoom & Crop</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                value={zoom * 100}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="w-full accent-blue-500"
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!image}>
              <Check className="w-4 h-4 mr-2" />
              Save Logo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Branding Setup Modal with Auto-save
function BrandingSetupModal({ isOpen, onClose, onSave, initialData }: any) {
  const [branding, setBranding] = useState<BrandingData>(initialData || {
    businessName: "", tagline: "", phone: "", website: "", logo: "",
    logoZoom: 1, logoPosition: { x: 0, y: 0 }, primaryColor: "#3B82F6", defaultLayout: "classic",
  });
  const [showLogoUpload, setShowLogoUpload] = useState(false);

  // Update branding when initialData changes (pre-fill on edit)
  useEffect(() => {
    if (initialData) {
      setBranding(initialData);
    }
  }, [initialData]);

  // Auto-save on change (debounced)
  useEffect(() => {
    if (branding.businessName) {
      const timer = setTimeout(() => {
        onSave(branding);
      }, 1500); // Auto-save after 1.5s of no changes
      return () => clearTimeout(timer);
    }
  }, [branding, onSave]);

  const handleSave = () => {
    if (!branding.businessName) return;
    onSave(branding);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-500" />
              Setup Your Branding
            </DialogTitle>
            <DialogDescription>Add your business details to personalize all marketing materials</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLogoUpload(true)}
                className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
              >
                {branding.logo ? (
                  <img 
                    src={branding.logo} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${branding.logoZoom}) translate(${branding.logoPosition.x / branding.logoZoom}px, ${branding.logoPosition.y / branding.logoZoom}px)`,
                    }}
                  />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium">Business Logo</p>
                <p className="text-xs text-muted-foreground">Click to upload and adjust like Instagram</p>
              </div>
            </div>
            
            {/* Business Name */}
            <div>
              <Label className="text-sm font-medium">Business Name *</Label>
              <Input
                placeholder="Your Business Name"
                value={branding.businessName}
                onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                className="mt-1"
              />
            </div>
            
            {/* Tagline */}
            <div>
              <Label className="text-sm font-medium">Tagline</Label>
              <Input
                placeholder="Your catchy tagline"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                className="mt-1"
              />
            </div>
            
            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  placeholder="+91 9876543210"
                  value={branding.phone}
                  onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Website</Label>
                <Input
                  placeholder="www.yourbusiness.com"
                  value={branding.website}
                  onChange={(e) => setBranding({ ...branding, website: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* Brand Color */}
            <div>
              <Label className="text-sm font-medium">Brand Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            {/* Layout Selection */}
            <div>
              <Label className="text-sm font-medium">Default Layout</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {brandingLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setBranding({ ...branding, defaultLayout: layout.id })}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      branding.defaultLayout === layout.id 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-border hover:border-blue-300"
                    )}
                  >
                    <Layout className={cn("w-5 h-5 mx-auto mb-1", branding.defaultLayout === layout.id ? "text-blue-600" : "text-muted-foreground")} />
                    <p className="text-xs font-medium">{layout.name}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!branding.businessName}>
                <Check className="w-4 h-4 mr-2" />
                Save & Close
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                ✓ Auto-saving your changes
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <LogoUploadModal
        isOpen={showLogoUpload}
        onClose={() => setShowLogoUpload(false)}
        onSave={(logoData: any) => setBranding({ ...branding, ...logoData })}
        currentLogo={branding.logo}
      />
    </>
  );
}

// Share Modal - Improved Single Step Flow with Product/Service/Coupon Selection
function ShareModal({ template, isOpen, onClose, branding, products, services, coupons }: any) {
  const { toast } = useToast();
  const { isPro, isFree } = useSubscription();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<"customize" | "preview">("customize");
  const [customText, setCustomText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [selectedLayout, setSelectedLayout] = useState(branding?.defaultLayout || "classic");
  const [isDownloading, setIsDownloading] = useState(false);
  const [brandedImageUrl, setBrandedImageUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [, setLocation] = useLocation();

  if (!template || !branding) return null;
  
  // Check if user can download/share (Pro only)
  const handleProAction = (action: () => void, actionName: string) => {
    if (isFree) {
      setShowUpgradeModal(true);
      return;
    }
    action();
  };

  const selectedProductData = products?.find((p: any) => p.id === selectedProduct);
  const selectedServiceData = services?.find((s: any) => s.id === selectedService);
  const selectedCouponData = coupons?.find((c: any) => c.id === selectedCoupon);

  const buildShareText = () => {
    let text = customText || template.title;
    if (selectedProductData) text += `\n\n🏷️ ${selectedProductData.name} - ₹${selectedProductData.price}`;
    if (selectedServiceData) text += `\n\n⚙️ ${selectedServiceData.name}`;
    if (selectedCouponData) text += `\n\n🎁 Use code: ${selectedCouponData.code}`;
    text += `\n\n${branding.businessName}`;
    if (branding.phone) text += `\n📞 ${branding.phone}`;
    if (branding.website) text += `\n🌐 ${branding.website}`;
    text += `\n\n✨ Grow your business with Vyora\nhttps://vyora.in`;
    return text;
  };

  // Generate branded image using canvas
  const generateBrandedImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas not supported');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Add branding based on layout
        const brandingHeight = 80;
        
        if (selectedLayout === 'modern') {
          // Modern: Full-width footer
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(0, canvas.height - brandingHeight, canvas.width, brandingHeight);
          
          // Logo
          if (branding.logo) {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.arc(50, canvas.height - brandingHeight/2, 25, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(logoImg, 25, canvas.height - brandingHeight/2 - 25, 50, 50);
              ctx.restore();
            };
            logoImg.src = branding.logo;
          }
          
          // Text
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(branding.businessName, 90, canvas.height - brandingHeight/2 + 5);
          if (branding.phone) {
            ctx.font = '12px Arial';
            ctx.fillText(branding.phone, 90, canvas.height - brandingHeight/2 + 22);
  }
        } else if (selectedLayout === 'classic') {
          // Classic: Bottom-right logo
          if (branding.logo) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width - 50, canvas.height - 50, 35, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = 'white';
            ctx.fill();
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.onload = () => {
              ctx.drawImage(logoImg, canvas.width - 85, canvas.height - 85, 70, 70);
              ctx.restore();
            };
            logoImg.src = branding.logo;
          }
        } else if (selectedLayout === 'minimal') {
          // Minimal: Top-left small logo
          if (branding.logo) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(40, 40, 25, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = 'white';
            ctx.fill();
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            logoImg.onload = () => {
              ctx.drawImage(logoImg, 15, 15, 50, 50);
              ctx.restore();
            };
            logoImg.src = branding.logo;
          }
        }
        
        // Add "Powered by Vyora" watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Arial';
        ctx.fillText('Powered by Vyora', 10, canvas.height - 10);
        
        setTimeout(() => {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        }, 100);
      };
      img.onerror = () => reject('Failed to load image');
      img.src = template.imageUrl;
    });
  };

  const handleShare = async (platform: string) => {
    try {
      await apiRequest("POST", `/api/greeting-templates/${template.id}/share`, { platform });
      
      // Try to share the actual image
      const imageBlob = await fetch(template.imageUrl).then(r => r.blob());
      const file = new File([imageBlob], 'poster.jpg', { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        // Native share with image
        await navigator.share({
          files: [file],
          title: branding.businessName,
          text: buildShareText(),
        });
        toast({ title: "Shared successfully!" });
    } else {
        // Fallback to URL sharing
        const shareText = buildShareText();
        let url = "";
        switch (platform) {
          case "whatsapp": url = `https://wa.me/?text=${encodeURIComponent(shareText)}`; break;
          case "facebook": url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`; break;
          case "telegram": url = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`; break;
          case "linkedin": url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://vyora.in')}`; break;
        }
        if (url) window.open(url, "_blank");
        toast({ title: "Shared!", description: `Content shared to ${platform}` });
      }
    } catch (error) {
      // Fallback
      const shareText = buildShareText();
      let url = "";
      switch (platform) {
        case "whatsapp": url = `https://wa.me/?text=${encodeURIComponent(shareText)}`; break;
        case "facebook": url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`; break;
        case "telegram": url = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`; break;
      }
      if (url) window.open(url, "_blank");
      toast({ title: "Shared!" });
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await apiRequest("POST", `/api/greeting-templates/${template.id}/download`, {});
      
      // Generate branded image
      const brandedUrl = await generateBrandedImage();
      
      // Create download link
      const a = document.createElement("a");
      a.href = brandedUrl;
      a.download = `${branding.businessName.replace(/[^a-z0-9]/gi, "_")}_${template.title.replace(/[^a-z0-9]/gi, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({ title: "Downloaded with branding!" });
    } catch (error) {
      // Fallback - download original
      const response = await fetch(template.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.title.replace(/[^a-z0-9]/gi, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded!" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        {step === "customize" ? (
          <div className="flex flex-col h-full max-h-[95vh]">
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <div>
                <h2 className="text-lg font-bold">Customize & Share</h2>
                <p className="text-xs text-muted-foreground">Add your message, select products, and share</p>
      </div>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
      </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Preview */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex items-center justify-center min-h-[280px]">
                  <div className="relative max-w-[260px] w-full">
                    <img src={template.imageUrl} alt={template.title} className="w-full rounded-lg shadow-2xl" />
                    {/* Branding Overlay */}
                    {selectedLayout === "classic" && branding.logo && (
                      <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white shadow-lg p-1 flex items-center justify-center overflow-hidden">
                        <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {selectedLayout === "modern" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-2 rounded-b-lg flex items-center gap-2">
                        {branding.logo && <img src={branding.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-900 truncate">{branding.businessName}</p>
                          {branding.phone && <p className="text-[8px] text-gray-600">{branding.phone}</p>}
                        </div>
                      </div>
                    )}
                    {selectedLayout === "minimal" && branding.logo && (
                      <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white shadow-lg p-1 flex items-center justify-center overflow-hidden">
                        <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 text-[6px] text-white/60">Powered by Vyora</div>
                  </div>
                </div>
                
                {/* Form */}
                <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                  {/* Step 1: Custom Message */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300">Step 1: Custom Message</Label>
                    <Textarea
                      placeholder="Add your custom message..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="mt-2 h-16 bg-white dark:bg-gray-800"
        />
      </div>
                  
                  {/* Step 2: Link Products/Services/Coupons */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
                    <Label className="text-sm font-semibold text-green-700 dark:text-green-300">Step 2: Link from Catalogue</Label>
                    
                    {/* Product */}
                    {products?.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className="w-full mt-1 h-9 rounded-md border bg-white dark:bg-gray-800 px-3 text-sm"
                        >
                          <option value="">Select a product</option>
                          {products.slice(0, 20).map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Service */}
                    {services?.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Service</Label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full mt-1 h-9 rounded-md border bg-white dark:bg-gray-800 px-3 text-sm"
                        >
                          <option value="">Select a service</option>
                          {services.slice(0, 20).map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Coupon */}
                    {coupons?.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Coupon</Label>
                        <select
                          value={selectedCoupon}
                          onChange={(e) => setSelectedCoupon(e.target.value)}
                          className="w-full mt-1 h-9 rounded-md border bg-white dark:bg-gray-800 px-3 text-sm"
                        >
                          <option value="">Select a coupon</option>
                          {coupons.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.code} - {c.discount}% off</option>
                ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Select Layout */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <Label className="text-sm font-semibold text-purple-700 dark:text-purple-300">Step 3: Select Layout</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {brandingLayouts.map((layout) => (
                        <button
                          key={layout.id}
                          onClick={() => setSelectedLayout(layout.id)}
                          className={cn(
                            "p-2 rounded-lg border-2 text-center text-xs transition-all",
                            selectedLayout === layout.id ? "border-purple-500 bg-purple-100 dark:bg-purple-800" : "border-border bg-white dark:bg-gray-800"
                          )}
                        >
                          <Layout className={cn("w-4 h-4 mx-auto mb-1", selectedLayout === layout.id ? "text-purple-600" : "text-muted-foreground")} />
                          {layout.name}
                        </button>
                ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t shrink-0 space-y-3 bg-gray-50 dark:bg-gray-900">
              {/* Pro Feature Notice for Free Users */}
              {isFree && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-2">
                  <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                    🔒 Download & Share are Pro features. <button className="font-bold underline" onClick={() => setShowUpgradeModal(true)}>Upgrade to unlock</button>
                  </p>
                </div>
                  )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("preview")} className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />Preview
                </Button>
                <Button 
                  onClick={() => handleProAction(handleDownload, "Download")} 
                  disabled={isDownloading} 
                  className={cn("flex-1", isFree ? "bg-gray-400 hover:bg-gray-400" : "bg-blue-600 hover:bg-blue-700")}
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {isFree ? "Pro Only" : "Download"}
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleProAction(() => handleShare("whatsapp"), "Share")} className={cn("bg-green-50 border-green-200", isFree && "opacity-60")}>
                  <SiWhatsapp className="w-4 h-4 text-green-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleProAction(() => handleShare("facebook"), "Share")} className={cn("bg-blue-50 border-blue-200", isFree && "opacity-60")}>
                  <SiFacebook className="w-4 h-4 text-blue-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleProAction(() => handleShare("instagram"), "Share")} className={cn("bg-pink-50 border-pink-200", isFree && "opacity-60")}>
                  <SiInstagram className="w-4 h-4 text-pink-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleProAction(() => handleShare("telegram"), "Share")} className={cn("bg-sky-50 border-sky-200", isFree && "opacity-60")}>
                  <SiTelegram className="w-4 h-4 text-sky-600" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Step */
          <div className="flex flex-col h-full max-h-[95vh]">
            <div className="p-4 border-b flex items-center gap-3 shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <Button variant="ghost" size="icon" onClick={() => setStep("customize")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-lg font-bold">Preview</h2>
                <p className="text-xs text-muted-foreground">This is how your post will look</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center">
              <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative">
                  <img src={template.imageUrl} alt={template.title} className="w-full" />
                  {selectedLayout === "classic" && branding.logo && (
                    <div className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white shadow-lg p-1 overflow-hidden">
                      <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {selectedLayout === "modern" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3 flex items-center gap-3">
                      {branding.logo && <img src={branding.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{branding.businessName}</p>
                        {branding.phone && <p className="text-xs text-gray-600">{branding.phone}</p>}
                      </div>
                    </div>
                  )}
                  {selectedLayout === "minimal" && branding.logo && (
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white shadow-lg p-1 overflow-hidden">
                      <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-2 text-[8px] text-white/70">Powered by Vyora</div>
                </div>
                <div className="p-4 space-y-2">
                  {customText && <p className="text-sm">{customText}</p>}
                  {selectedProductData && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">🏷️ {selectedProductData.name} - ₹{selectedProductData.price}</div>
                  )}
                  {selectedServiceData && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">⚙️ {selectedServiceData.name}</div>
                  )}
                  {selectedCouponData && (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-sm text-emerald-700">
                      🎁 Code: {selectedCouponData.code} - {selectedCouponData.discount}% off
                    </div>
                  )}
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">{branding.businessName}</p>
                    {branding.phone && <p className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" /> {branding.phone}</p>}
                    {branding.website && <p className="flex items-center gap-1 text-xs"><Globe className="w-3 h-3" /> {branding.website}</p>}
                  </div>
                  <div className="pt-2 border-t text-xs text-blue-600 text-center">
                    ✨ Grow your business with Vyora - vyora.in
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t shrink-0 space-y-3 bg-gray-50 dark:bg-gray-900">
              {/* Pro Feature Notice for Free Users */}
              {isFree && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-2">
                  <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                    🔒 Download & Share are Pro features. <button className="font-bold underline" onClick={() => setShowUpgradeModal(true)}>Upgrade to unlock</button>
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("customize")} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />Edit
                </Button>
              <Button
                  onClick={() => handleProAction(handleDownload, "Download")} 
                  disabled={isDownloading} 
                  className={cn("flex-1", isFree ? "bg-gray-400 hover:bg-gray-400" : "bg-blue-600 hover:bg-blue-700")}
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {isFree ? "Pro Only" : "Download"}
              </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => handleProAction(() => handleShare("whatsapp"), "Share")} className={cn("bg-green-50 border-green-200", isFree && "opacity-60")}>
                  <SiWhatsapp className="w-4 h-4 text-green-600" />
                </Button>
                <Button variant="outline" onClick={() => handleProAction(() => handleShare("facebook"), "Share")} className={cn("bg-blue-50 border-blue-200", isFree && "opacity-60")}>
                  <SiFacebook className="w-4 h-4 text-blue-600" />
                </Button>
                <Button variant="outline" onClick={() => handleProAction(() => handleShare("instagram"), "Share")} className={cn("bg-pink-50 border-pink-200", isFree && "opacity-60")}>
                  <SiInstagram className="w-4 h-4 text-pink-600" />
                </Button>
                <Button variant="outline" onClick={() => handleProAction(() => handleShare("telegram"), "Share")} className={cn("bg-sky-50 border-sky-200", isFree && "opacity-60")}>
                  <SiTelegram className="w-4 h-4 text-sky-600" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        feature="Download & Share Marketing Posts"
      />
    </Dialog>
  );
}

// Category View Modal
function CategoryView({ category, templates, onBack, onSelectTemplate, businessFilter, setBusinessFilter, toggleWishlist, isInWishlist }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTemplates = templates.filter((t: any) => {
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBusiness = businessFilter === "all" || 
      t.industries?.includes(businessFilter);
    
    return matchesSearch && matchesBusiness;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center gap-3 px-3 py-2 md:p-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-base md:text-lg font-bold flex-1">{category.name}</h2>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {/* Business Category Filter */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {businessCategories.map((cat) => {
              const IconComponent = categoryIcons[cat.icon] || Store;
              return (
              <Button
                  key={cat.id}
                  variant={businessFilter === cat.id ? "default" : "outline"}
                size="sm"
                  onClick={() => setBusinessFilter(cat.id)}
                  className={cn("shrink-0", businessFilter === cat.id && "bg-blue-600")}
              >
                  <IconComponent className="w-3 h-3 mr-1" />
                  {cat.name}
              </Button>
              );
            })}
          </div>
        </div>
          </div>

          {/* Templates Grid */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTemplates.map((template: any) => (
                <Card
                  key={template.id}
              className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] relative"
              onClick={() => onSelectTemplate(template)}
            >
              {/* Wishlist Button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist(template); }}
                className={cn(
                  "absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-md transition-all",
                  isInWishlist(template.id) 
                    ? "bg-pink-500 text-white" 
                    : "bg-white/90 text-gray-500 hover:bg-white"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isInWishlist(template.id) && "fill-current")} />
              </button>
              <div className="relative aspect-square">
                <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
              <CardContent className="p-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />{template.downloadCount}</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{template.shareCount}</span>
                </div>
              </CardContent>
            </Card>
                      ))}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No templates found</p>
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
  const queryClient = useQueryClient();
  
  const vendorId = params.vendorId || hookVendorId;
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBrandingSetup, setShowBrandingSetup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GreetingTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [recentlyViewed, setRecentlyViewed] = useState<GreetingTemplate[]>([]);
  const [wishlist, setWishlist] = useState<GreetingTemplate[]>([]);

  // Load branding, recently viewed, and wishlist
  useEffect(() => {
    const savedBranding = localStorage.getItem(`vendor_branding_${vendorId}`);
    if (savedBranding) setBranding(JSON.parse(savedBranding));
    else if (vendorId) setShowBrandingSetup(true);
    
    const savedRecent = localStorage.getItem(`vendor_recent_templates_${vendorId}`);
    if (savedRecent) setRecentlyViewed(JSON.parse(savedRecent));
    
    const savedWishlist = localStorage.getItem(`vendor_wishlist_${vendorId}`);
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, [vendorId]);

  // Toggle wishlist
  const toggleWishlist = (template: GreetingTemplate) => {
    const exists = wishlist.some(t => t.id === template.id);
    const newWishlist = exists 
      ? wishlist.filter(t => t.id !== template.id)
      : [template, ...wishlist];
    setWishlist(newWishlist);
    localStorage.setItem(`vendor_wishlist_${vendorId}`, JSON.stringify(newWishlist));
    toast({ 
      title: exists ? "Removed from wishlist" : "Added to wishlist",
      description: exists ? "Template removed" : "You can find it in your wishlist"
    });
  };

  // Check if template is in wishlist
  const isInWishlist = (templateId: string) => wishlist.some(t => t.id === templateId);

  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/greeting-templates?status=published"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/poster-categories"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/poster-categories"));
      if (!res.ok) return defaultCategories;
      const data = await res.json();
      return data.length > 0 ? data : defaultCategories;
    },
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogues`],
    enabled: !!vendorId,
  });

  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/coupons`],
    enabled: !!vendorId,
  });

  // Filter templates by search
  const searchResults = searchQuery 
    ? templates.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Group templates by category
  const getTemplatesForCategory = (cat: any) => {
    if (cat.id === "trending") return templates.filter(t => t.isTrending);
    if (cat.id === "upcoming") return templates.filter(t => t.eventDate && new Date(t.eventDate) > new Date());
    if (cat.id === "festivals") return templates.filter(t => t.occasions.length > 0);
    if (cat.id === "offers") return templates.filter(t => t.offerTypes.some(o => ["flat_discount", "bogo", "flash_sale"].includes(o)));
    if (cat.id === "greetings") return templates.filter(t => t.offerTypes.includes("greeting"));
    if (cat.id === "marketing") return templates.filter(t => t.offerTypes.includes("marketing"));
    if (cat.id === "new_arrivals") return templates.slice(-10).reverse();
    if (cat.id === "announcements") return templates.filter(t => t.offerTypes.includes("announcement"));
    return templates.filter(t => t.categoryId === cat.id);
  };

  const handleSaveBranding = (newBranding: BrandingData) => {
    setBranding(newBranding);
    localStorage.setItem(`vendor_branding_${vendorId}`, JSON.stringify(newBranding));
    setShowBrandingSetup(false);
    toast({ title: "Branding Saved!" });
  };

  const handleTemplateSelect = (template: GreetingTemplate) => {
    if (!branding) {
      setShowBrandingSetup(true);
      return;
    }
    
    // Add to recently viewed
    const newRecent = [template, ...recentlyViewed.filter(t => t.id !== template.id)].slice(0, 20);
    setRecentlyViewed(newRecent);
    localStorage.setItem(`vendor_recent_templates_${vendorId}`, JSON.stringify(newRecent));
    
    setSelectedTemplate(template);
    setShowShareModal(true);
  };

  if (isLoading || !vendorId) return <LoadingSpinner />;

  // Category View
  if (selectedCategory) {
    return (
      <>
        <CategoryView
          category={selectedCategory}
          templates={getTemplatesForCategory(selectedCategory)}
          onBack={() => setSelectedCategory(null)}
          onSelectTemplate={handleTemplateSelect}
          businessFilter={businessFilter}
          setBusinessFilter={setBusinessFilter}
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

  // All categories to display (combine default with custom)
  const allCategories = categories.length > 0 ? categories : defaultCategories;

  // Main View
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Compact */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/vendor/dashboard")} className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base md:text-lg font-bold">Marketing Post</h1>
                    </div>
          
          {/* Branding Status - Compact */}
          {branding ? (
            <button 
              onClick={() => setShowBrandingSetup(true)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition-colors"
            >
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300 max-w-[100px] truncate">
                {branding.businessName}
              </span>
              <Edit className="w-3.5 h-3.5 text-blue-600" />
            </button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowBrandingSetup(true)} className="h-8">
              <Palette className="w-4 h-4 mr-1" />
              <span className="text-xs">Setup</span>
            </Button>
          )}
                    </div>
        
        {/* Search - Compact */}
        <div className="px-3 pb-3 md:px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posters, banners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
                    </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Search Results */}
        {searchQuery && (
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">{searchResults.length} results for "{searchQuery}"</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {searchResults.map((template) => (
                <Card key={template.id} className="border-0 shadow-sm overflow-hidden cursor-pointer" onClick={() => handleTemplateSelect(template)}>
                  <div className="relative aspect-square">
                    <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{template.downloadCount}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{template.shareCount}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          )}

        {/* Recently Viewed Section */}
        {!searchQuery && recentlyViewed.length > 0 && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Recently Viewed</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRecentlyViewed([])}>Clear</Button>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {recentlyViewed.slice(0, 8).map((template) => (
                <Card
                  key={template.id}
                    className="border-0 shadow-sm overflow-hidden cursor-pointer shrink-0 w-[100px] hover:shadow-md transition-all"
                    onClick={() => handleTemplateSelect(template)}
                >
                    <div className="relative aspect-square">
                      <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Section */}
        {!searchQuery && wishlist.length > 0 && (
          <div className="p-4 border-b bg-pink-50/50 dark:bg-pink-900/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-semibold text-pink-800 dark:text-pink-300">My Wishlist</h3>
                <Badge className="bg-pink-500 text-[10px]">{wishlist.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setWishlist([])}>Clear All</Button>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {wishlist.map((template) => (
                  <Card
                    key={template.id}
                    className="border-0 shadow-sm overflow-hidden cursor-pointer shrink-0 w-[120px] hover:shadow-md transition-all relative"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(template); }}
                      className="absolute top-1 right-1 z-10 p-1 bg-white/90 rounded-full"
                    >
                      <BookmarkCheck className="w-4 h-4 text-pink-600" />
                    </button>
                    <div className="relative aspect-square">
                      <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid - Square Cards with Better Icons */}
        {!searchQuery && (
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allCategories.map((cat) => {
                const IconComponent = categoryIcons[cat.icon] || Sparkles;
                const count = getTemplatesForCategory(cat).length;
                return (
                  <Card
                    key={cat.id}
                    className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all active:scale-[0.97] overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${cat.color}10 0%, ${cat.color}25 100%)` }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <CardContent className="p-4 aspect-square flex flex-col items-center justify-center text-center gap-3">
                      <div
                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-md"
                        style={{ backgroundColor: cat.color, boxShadow: `0 8px 20px ${cat.color}40` }}
                      >
                        <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm md:text-base" style={{ color: cat.color }}>{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{count} templates</p>
                    </div>
                  </CardContent>
                  </Card>
                );
              })}
                    </div>
                    </div>
        )}

        {/* Category Sections with Horizontal Scroll */}
        {!searchQuery && allCategories.map((cat) => {
          const categoryTemplates = getTemplatesForCategory(cat);
          if (categoryTemplates.length === 0) return null;
          const IconComponent = categoryIcons[cat.icon] || Sparkles;
          
          return (
            <div key={cat.id} className="py-4 border-t">
              <div className="px-4 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <h3 className="font-semibold">{cat.name}</h3>
                  <Badge variant="secondary" className="text-xs">{categoryTemplates.length}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(cat)}>
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              {/* Horizontal Scroll */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
                  {categoryTemplates.slice(0, 10).map((template) => (
                    <Card
                      key={template.id}
                      className="border-0 shadow-sm overflow-hidden cursor-pointer shrink-0 w-[140px] md:w-[160px] hover:shadow-lg transition-all relative"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(template); }}
                        className={cn(
                          "absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-md transition-all",
                          isInWishlist(template.id) 
                            ? "bg-pink-500 text-white" 
                            : "bg-white/90 text-gray-500 hover:bg-white"
                        )}
                      >
                        <Bookmark className={cn("w-3.5 h-3.5", isInWishlist(template.id) && "fill-current")} />
                      </button>
                      <div className="relative aspect-square">
                        <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{template.downloadCount}</span>
                          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{template.shareCount}</span>
                        </div>
                      </CardContent>
                </Card>
              ))}
            </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <BrandingSetupModal
        isOpen={showBrandingSetup}
        onClose={() => setShowBrandingSetup(false)}
        onSave={handleSaveBranding}
        initialData={branding || undefined}
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
    </div>
  );
}
