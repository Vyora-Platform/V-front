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
  Clock, Bookmark, BookmarkCheck, ChevronRight, ChevronLeft, Image as ImageIcon
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
  { id: "good_morning", name: "Good Morning", icon: "Sun", color: "#F59E0B", image: "/api/placeholder/200/200" },
  { id: "festivals", name: "Festivals", icon: "PartyPopper", color: "#EF4444", image: "/api/placeholder/200/200" },
  { id: "quotes", name: "Hindi Quotes", icon: "BookOpen", color: "#8B5CF6", image: "/api/placeholder/200/200" },
  { id: "freedom_fighters", name: "Freedom Fighters", icon: "Star", color: "#10B981", image: "/api/placeholder/200/200" },
  { id: "personalities", name: "Great Personalities", icon: "GraduationCap", color: "#3B82F6", image: "/api/placeholder/200/200" },
  { id: "atmanirbhar", name: "Atmanirbhar Bharat", icon: "Heart", color: "#EC4899", image: "/api/placeholder/200/200" },
  { id: "historical", name: "Historical Places", icon: "Building", color: "#F97316", image: "/api/placeholder/200/200" },
  { id: "sports", name: "Sports Quotes", icon: "Dumbbell", color: "#06B6D4", image: "/api/placeholder/200/200" },
  { id: "offers", name: "Offers & Discounts", icon: "Tag", color: "#10B981", image: "/api/placeholder/200/200" },
  { id: "marketing", name: "Marketing", icon: "Megaphone", color: "#8B5CF6", image: "/api/placeholder/200/200" },
  { id: "announcements", name: "Announcements", icon: "Bell", color: "#F97316", image: "/api/placeholder/200/200" },
  { id: "greetings", name: "Greetings", icon: "Heart", color: "#EC4899", image: "/api/placeholder/200/200" },
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

// Instagram-like Logo Upload Modal
function LogoUploadModal({ isOpen, onClose, onSave, currentLogo }: any) {
  const [image, setImage] = useState<string | null>(currentLogo || null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const maxMove = 50 * zoom;
    setPosition({
      x: Math.max(-maxMove, Math.min(maxMove, newX)),
      y: Math.max(-maxMove, Math.min(maxMove, newY))
    });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    onSave({ logo: image, logoZoom: zoom, logoPosition: position });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-500" />
            Upload Logo
          </DialogTitle>
          <DialogDescription>Upload and adjust your business logo</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div 
            className={cn(
              "relative mx-auto w-32 h-32 rounded-full border-4 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-move",
              image ? "border-emerald-500" : "border-dashed border-gray-300"
            )}
            onMouseDown={handleMouseDown}
          >
            {image ? (
              <img
                src={image}
                alt="Logo"
                className="w-full h-full object-cover select-none"
                style={{ transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)` }}
                draggable={false}
              />
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Tap to upload</p>
              </div>
            )}
          </div>
          
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            {image ? "Change Image" : "Upload Image"}
          </Button>
          
          {image && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Zoom</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
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
                className="w-full accent-emerald-500"
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!image}>
              <Check className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Branding Setup Modal - Fixed to prevent multiple toasts
function BrandingSetupModal({ isOpen, onClose, onSave, initialData }: any) {
  const [branding, setBranding] = useState<BrandingData>(initialData || {
    businessName: "", tagline: "", phone: "", website: "", logo: "",
    logoZoom: 1, logoPosition: { x: 0, y: 0 }, primaryColor: "#10B981", defaultLayout: "classic",
  });
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialData) setBranding(initialData);
  }, [initialData]);

  // Track changes without auto-saving toast
  useEffect(() => {
    if (branding.businessName && initialData) {
      const changed = JSON.stringify(branding) !== JSON.stringify(initialData);
      setHasChanges(changed);
    }
  }, [branding, initialData]);

  const handleSave = () => {
    if (!branding.businessName) return;
    onSave(branding, true); // true = show toast
    onClose();
  };

  // Auto-save silently (without toast) when modal closes
  useEffect(() => {
    return () => {
      if (hasChanges && branding.businessName) {
        onSave(branding, false); // false = don't show toast
      }
    };
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && hasChanges && branding.businessName) {
          onSave(branding, false);
        }
        onClose();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-500" />
              Setup Your Branding
            </DialogTitle>
            <DialogDescription>Add your business details to personalize all marketing materials</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLogoUpload(true)}
                className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-emerald-500 transition-colors bg-gradient-to-br from-gray-50 to-gray-100"
              >
                {branding.logo ? (
                  <img src={branding.logo} alt="Logo" className="w-full h-full object-cover"
                    style={{ transform: `scale(${branding.logoZoom}) translate(${branding.logoPosition.x / branding.logoZoom}px, ${branding.logoPosition.y / branding.logoZoom}px)` }}
                  />
                ) : (
                  <Camera className="w-6 h-6 text-gray-400" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium">Business Logo</p>
                <p className="text-xs text-muted-foreground">Click to upload and adjust</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Business Name *</Label>
              <Input
                placeholder="Your Business Name"
                value={branding.businessName}
                onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Tagline</Label>
              <Input
                placeholder="Your catchy tagline"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                className="mt-1"
              />
            </div>
            
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
            
            <div>
              <Label className="text-sm font-medium">Branding Layout</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {brandingLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setBranding({ ...branding, defaultLayout: layout.id })}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      branding.defaultLayout === layout.id 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "border-gray-200 hover:border-emerald-300"
                    )}
                  >
                    <Layout className={cn("w-5 h-5 mx-auto mb-1", branding.defaultLayout === layout.id ? "text-emerald-600" : "text-gray-400")} />
                    <p className="text-xs font-medium">{layout.name}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={!branding.businessName}>
              <Check className="w-4 h-4 mr-2" /> Save Branding
            </Button>
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

// Share Modal with better branding options
function ShareModal({ template, isOpen, onClose, branding, products, services, coupons }: any) {
  const { toast } = useToast();
  const { isPro, isFree } = useSubscription();
  const [step, setStep] = useState<"customize" | "preview">("customize");
  const [customText, setCustomText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [selectedLayout, setSelectedLayout] = useState(branding?.defaultLayout || "classic");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [, setLocation] = useLocation();

  if (!template || !branding) return null;
  
  const handleProAction = (action: () => void) => {
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
  const generateBrandedImage = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas not supported');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const brandingHeight = 80;
        
        if (selectedLayout === 'modern') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(0, canvas.height - brandingHeight, canvas.width, brandingHeight);
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(branding.businessName, 20, canvas.height - brandingHeight/2 + 5);
          if (branding.phone) {
            ctx.font = '12px Arial';
            ctx.fillText(branding.phone, 20, canvas.height - brandingHeight/2 + 22);
          }
        } else if (selectedLayout === 'classic' && branding.logo) {
          // Draw logo circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width - 50, canvas.height - 50, 35, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
          ctx.closePath();
          ctx.clip();
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = branding.logo;
          ctx.restore();
        }
        
        // Vyora watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Arial';
        ctx.fillText('Powered by Vyora', 10, canvas.height - 10);
        
        setTimeout(() => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject('Failed to create blob');
          }, 'image/jpeg', 0.9);
        }, 100);
      };
      img.onerror = () => reject('Failed to load image');
      img.src = template.imageUrl;
    });
  };

  const handleShare = async (platform: string) => {
    try {
      await apiRequest("POST", `/api/greeting-templates/${template.id}/share`, { platform });
      
      // Generate branded image blob
      const imageBlob = await generateBrandedImage();
      const file = new File([imageBlob], `${branding.businessName.replace(/[^a-z0-9]/gi, "_")}_poster.jpg`, { type: 'image/jpeg' });
      
      // Try native share with image
      if (navigator.share && navigator.canShare({ files: [file] })) {
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
        toast({ title: "Opening share dialog..." });
      }
    } catch (error) {
      const shareText = buildShareText();
      let url = "";
      switch (platform) {
        case "whatsapp": url = `https://wa.me/?text=${encodeURIComponent(shareText)}`; break;
        case "facebook": url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`; break;
        case "telegram": url = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`; break;
      }
      if (url) window.open(url, "_blank");
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
      a.download = `${branding.businessName.replace(/[^a-z0-9]/gi, "_")}_${template.title.replace(/[^a-z0-9]/gi, "_")}.jpg`;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              {step === "preview" && (
                <Button variant="ghost" size="icon" onClick={() => setStep("customize")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h2 className="text-lg font-bold">{step === "customize" ? "Customize & Share" : "Preview"}</h2>
                <p className="text-xs text-muted-foreground">{step === "customize" ? "Add your message and branding" : "This is how your post will look"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Preview */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 flex items-center justify-center min-h-[300px]">
                <div className="relative max-w-[280px] w-full">
                  <img src={template.imageUrl} alt={template.title} className="w-full rounded-xl shadow-2xl" />
                  {selectedLayout === "classic" && branding.logo && (
                    <div className="absolute bottom-3 right-3 w-14 h-14 rounded-full bg-white shadow-lg p-1 overflow-hidden">
                      <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {selectedLayout === "modern" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-2.5 rounded-b-xl flex items-center gap-2">
                      {branding.logo && <img src={branding.logo} alt="Logo" className="w-9 h-9 rounded-full object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{branding.businessName}</p>
                        {branding.phone && <p className="text-[10px] text-gray-600">{branding.phone}</p>}
                      </div>
                    </div>
                  )}
                  {selectedLayout === "minimal" && branding.logo && (
                    <div className="absolute top-3 left-3 w-11 h-11 rounded-full bg-white shadow-lg p-1 overflow-hidden">
                      <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-2 text-[7px] text-white/60">Powered by Vyora</div>
                </div>
              </div>
              
              {/* Form */}
              <div className="p-4 space-y-4 bg-white">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <Label className="text-sm font-semibold text-emerald-700">Custom Message</Label>
                  <Textarea
                    placeholder="Add your custom greeting or offer message..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="mt-2 h-20 bg-white"
                  />
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                  <Label className="text-sm font-semibold text-blue-700">Link from Catalogue</Label>
                  {products?.length > 0 && (
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-white px-3 text-sm"
                    >
                      <option value="">Select a product</option>
                      {products.slice(0, 20).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                      ))}
                    </select>
                  )}
                  {services?.length > 0 && (
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-white px-3 text-sm"
                    >
                      <option value="">Select a service</option>
                      {services.slice(0, 20).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                  {coupons?.length > 0 && (
                    <select
                      value={selectedCoupon}
                      onChange={(e) => setSelectedCoupon(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-white px-3 text-sm"
                    >
                      <option value="">Select a coupon</option>
                      {coupons.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.discount}% off</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <Label className="text-sm font-semibold text-purple-700">Branding Layout</Label>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {brandingLayouts.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => setSelectedLayout(layout.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center text-xs transition-all",
                          selectedLayout === layout.id ? "border-purple-500 bg-purple-100" : "border-gray-200 bg-white"
                        )}
                      >
                        <Layout className={cn("w-5 h-5 mx-auto mb-1", selectedLayout === layout.id ? "text-purple-600" : "text-gray-400")} />
                        {layout.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
                disabled={isDownloading} 
                className={cn("flex-1", isFree ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700")}
              >
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isFree ? "Pro Only" : "Download"}
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => handleProAction(() => handleShare("whatsapp"))} className={cn("bg-green-50 border-green-200 hover:bg-green-100", isFree && "opacity-60")}>
                <SiWhatsapp className="w-5 h-5 text-green-600" />
              </Button>
              <Button variant="outline" onClick={() => handleProAction(() => handleShare("facebook"))} className={cn("bg-blue-50 border-blue-200 hover:bg-blue-100", isFree && "opacity-60")}>
                <SiFacebook className="w-5 h-5 text-blue-600" />
              </Button>
              <Button variant="outline" onClick={() => handleProAction(() => handleShare("instagram"))} className={cn("bg-pink-50 border-pink-200 hover:bg-pink-100", isFree && "opacity-60")}>
                <SiInstagram className="w-5 h-5 text-pink-600" />
              </Button>
              <Button variant="outline" onClick={() => handleProAction(() => handleShare("telegram"))} className={cn("bg-sky-50 border-sky-200 hover:bg-sky-100", isFree && "opacity-60")}>
                <SiTelegram className="w-5 h-5 text-sky-600" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} feature="Download & Share Marketing Posts" />
    </Dialog>
  );
}

// Category View with templates
function CategoryView({ category, templates, onBack, onSelectTemplate, toggleWishlist, isInWishlist }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTemplates = templates.filter((t: any) => 
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold flex-1">{category.name}</h2>
          <Badge className="bg-emerald-100 text-emerald-700">{templates.length}</Badge>
        </div>
        
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-gray-50 border-gray-200" />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredTemplates.map((template: any) => (
            <div
              key={template.id}
              className="relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer group"
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
              <div className="aspect-square">
                <img src={template.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
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
  const queryClient = useQueryClient();
  
  const vendorId = params.vendorId || hookVendorId;
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBrandingSetup, setShowBrandingSetup] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GreetingTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  // Load branding
  useEffect(() => {
    const savedBranding = localStorage.getItem(`vendor_branding_${vendorId}`);
    if (savedBranding) setBranding(JSON.parse(savedBranding));
    else if (vendorId) setShowBrandingSetup(true);
  }, [vendorId]);

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

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/greeting-templates?status=published"));
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/poster-categories"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/poster-categories"));
      if (!res.ok) return defaultCategories;
      const data = await res.json();
      return data.length > 0 ? data : defaultCategories;
    },
  });

  // Fetch vendor data
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

  // Search results
  const searchResults = searchQuery 
    ? templates.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Get templates for category
  const getTemplatesForCategory = (cat: any) => {
    if (cat.id === "festivals") return templates.filter(t => t.occasions && t.occasions.length > 0);
    if (cat.id === "offers") return templates.filter(t => t.offerTypes?.includes("flat_discount") || t.offerTypes?.includes("bogo"));
    if (cat.id === "marketing") return templates.filter(t => t.offerTypes?.includes("marketing"));
    if (cat.id === "announcements") return templates.filter(t => t.offerTypes?.includes("announcement"));
    if (cat.id === "greetings") return templates.filter(t => t.offerTypes?.includes("greeting"));
    return templates.filter(t => t.categoryId === cat.id);
  };

  // Upcoming festivals
  const upcomingFestivals = templates
    .filter(t => t.eventDate && new Date(t.eventDate) > new Date())
    .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
    .slice(0, 10);

  // Handle branding save with optional toast
  const handleSaveBranding = (newBranding: BrandingData, showToast: boolean = true) => {
    setBranding(newBranding);
    localStorage.setItem(`vendor_branding_${vendorId}`, JSON.stringify(newBranding));
    if (showToast) {
      toast({ title: "Branding saved!" });
    }
  };

  const handleTemplateSelect = (template: GreetingTemplate) => {
    if (!branding) {
      setShowBrandingSetup(true);
      return;
    }
    setSelectedTemplate(template);
    setShowShareModal(true);
  };

  // Banner auto-rotate
  const bannerImages = [
    { url: "/api/placeholder/800/400", title: "FREE DEMO Images", subtitle: "Create stunning marketing posts" },
    { url: "/api/placeholder/800/400", title: "GST Invoice Creator", subtitle: "100% Professional invoices" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

  // Main View - Festival Poster App Style
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/vendor/dashboard")} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Marketing Posts</h1>
          </div>
          
          {branding ? (
            <button 
              onClick={() => setShowBrandingSetup(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              {branding.logo && <img src={branding.logo} className="w-6 h-6 rounded-full object-cover" />}
              <span className="text-sm font-medium text-emerald-700 max-w-[80px] truncate">{branding.businessName}</span>
              <Edit className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowBrandingSetup(true)} className="h-9 border-emerald-200 text-emerald-700">
              <Palette className="w-4 h-4 mr-1.5" /> Setup
            </Button>
          )}
        </div>
        
        {/* Search Bar - Festival Poster App Style */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search Upcoming Festival...."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl border-gray-200 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Search Results */}
        {searchQuery && (
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-3">{searchResults.length} results for "{searchQuery}"</p>
            <div className="grid grid-cols-3 gap-3">
              {searchResults.map((template) => (
                <div key={template.id} className="rounded-2xl overflow-hidden bg-white shadow-sm cursor-pointer" onClick={() => handleTemplateSelect(template)}>
                  <div className="aspect-square">
                    <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searchQuery && (
          <>
            {/* Promo Banner Carousel */}
            {bannerImages.length > 0 && (
              <div className="px-4 py-4">
                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                  <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
                  >
                    {bannerImages.map((banner, idx) => (
                      <div key={idx} className="min-w-full relative">
                        <div className="h-40 md:h-48 bg-gradient-to-r from-teal-500 to-emerald-600 flex items-center px-6">
                          <div className="text-white">
                            <h3 className="text-2xl font-bold">{banner.title}</h3>
                            <p className="text-white/80 mt-1">{banner.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {bannerImages.map((_, idx) => (
                      <button key={idx} onClick={() => setBannerIndex(idx)} className={cn("w-2 h-2 rounded-full transition-all", idx === bannerIndex ? "w-6 bg-white" : "bg-white/50")} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Festivals */}
            {upcomingFestivals.length > 0 && (
              <div className="py-4">
                <div className="px-4 flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Festivals</h3>
                  <Button variant="ghost" size="sm" className="text-emerald-600 font-semibold" onClick={() => setSelectedCategory({ id: "upcoming", name: "Upcoming Festivals" })}>
                    View All
                  </Button>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
                    {upcomingFestivals.map((template) => (
                      <div
                        key={template.id}
                        className="shrink-0 w-[140px] cursor-pointer"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="relative rounded-2xl overflow-hidden shadow-sm bg-white">
                          <div className="aspect-square">
                            <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          {/* Date Badge */}
                          {template.eventDate && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow">
                              {new Date(template.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-800 text-center line-clamp-1">{template.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Business Section */}
            {branding && (
              <div className="py-4 bg-white border-y">
                <div className="px-4 flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">My Business</h3>
                  <Button variant="ghost" size="sm" className="text-emerald-600 font-semibold">View All</Button>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
                    {templates.slice(0, 5).map((template) => (
                      <div
                        key={template.id}
                        className="shrink-0 w-[160px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="aspect-[4/3] relative">
                          <img src={template.imageUrl} alt="" className="w-full h-full object-cover" />
                          {branding.logo && (
                            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white shadow p-0.5">
                              <img src={branding.logo} alt="" className="w-full h-full rounded-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* General Categories - Grid Style like Festival Poster App */}
            <div className="py-6 px-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">General Categories</h3>
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
                          <img src={previewImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}40)` }}>
                            <IconComponent className="w-10 h-10" style={{ color: cat.color }} />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-800 text-center line-clamp-2">{cat.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Sections with Horizontal Scroll */}
            {allCategories.slice(0, 4).map((cat) => {
              const categoryTemplates = getTemplatesForCategory(cat);
              if (categoryTemplates.length === 0) return null;
              const IconComponent = categoryIcons[cat.icon] || Sparkles;
              
              return (
                <div key={cat.id} className="py-4 border-t bg-white">
                  <div className="px-4 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                        <IconComponent className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <h3 className="font-bold text-gray-900">{cat.name}</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setSelectedCategory(cat)}>
                      See All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
                      {categoryTemplates.slice(0, 8).map((template) => (
                        <div
                          key={template.id}
                          className="shrink-0 w-[130px] md:w-[150px] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer relative group"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(template); }}
                            className={cn(
                              "absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-md transition-all",
                              isInWishlist(template.id) ? "bg-pink-500 text-white" : "bg-white/90 text-gray-500 hover:bg-white"
                            )}
                          >
                            <Bookmark className={cn("w-3.5 h-3.5", isInWishlist(template.id) && "fill-current")} />
                          </button>
                          <div className="aspect-square">
                            <img src={template.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
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
