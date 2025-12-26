import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, Star, Package, Clock, Users, ChevronLeft, ChevronRight,
  ShoppingCart, Plus, Minus, X, User, LogOut, Menu, MapPin, 
  CheckCircle2, HelpCircle, Tag, Store, ImageIcon, Info,
  Mail, MessageCircle, MessageSquare, Calendar, Award, Heart, Share2,
  Facebook, Instagram, Twitter, Linkedin, Youtube, Globe,
  Building, Briefcase, GraduationCap, Shield, Zap, Target,
  ArrowRight, ExternalLink, Copy, Send, Home, Image, UserCircle,
  Navigation, FileText, ArrowLeft, ZoomIn, ZoomOut, Search, BookOpen
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MiniWebsite, MiniWebsiteReview, VendorCatalogue, VendorProduct } from "@shared/schema";
import MiniWebsiteServiceDetailDialog from "@/components/MiniWebsiteServiceDetailDialog";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import { QuotationModal } from "@/components/QuotationModal";

interface CartItem {
  type: 'product' | 'service';
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorProductId?: string;
  vendorCatalogueId?: string;
}

// Mobile tab types
type MobileTab = 'home' | 'gallery' | 'about' | 'cart' | 'profile';

// Helper function to convert 24-hour time to 12-hour format
const formatTo12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function MiniWebsitePublic() {
  const [, params] = useRoute("/:subdomain");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();
  
  // State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<VendorCatalogue | null>(null);
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  
  // Mobile app state
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('home');
  const [isMobile, setIsMobile] = useState(false);
  const [imageZoom, setImageZoom] = useState<{ src: string; scale: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Refs for scroll navigation
  const heroRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  
  // Lead form state
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Load customer auth on mount
  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const data = localStorage.getItem("customerData");
    if (token && data && data !== "undefined" && data !== "null") {
      try {
        setCustomerToken(token);
        setCustomerData(JSON.parse(data));
      } catch {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerData");
      }
    }
  }, [subdomain]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${subdomain}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch { /* ignore */ }
    }
  }, [subdomain]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
  }, [cart, subdomain]);

  // Fetch mini-website data
  const { data, isLoading, error } = useQuery<MiniWebsite & { 
    reviews: MiniWebsiteReview[],
    services: VendorCatalogue[],
    products: VendorProduct[],
    coupons?: any[],
  }>({
    queryKey: [`/api/mini-website/${subdomain}`],
    enabled: !!subdomain,
    staleTime: 0,
  });
  
  // Store mini-website context in localStorage when data is available
  // SECURITY: Do NOT overwrite the main 'vendorId' key - that's for vendor authentication
  // Use separate keys for customer-facing mini-website context
  useEffect(() => {
    if (data && subdomain) {
      // Store subdomain for customer context
      localStorage.setItem('miniWebsite_subdomain', subdomain);
      
      // Store mini-website vendor ID for customer operations (orders, cart, etc.)
      // IMPORTANT: This is different from the logged-in vendor's 'vendorId'
      if (data.vendorId) {
        localStorage.setItem('miniWebsite_vendorId', data.vendorId);
      }
      
      // Store mini website ID if available
      if (data.id) {
        localStorage.setItem('miniWebsite_id', data.id);
      }
    }
  }, [data, subdomain]);

  // Lead form mutation
  const leadMutation = useMutation({
    mutationFn: async (formData: typeof leadForm) => {
      return await apiRequest("POST", `/api/mini-website/${subdomain}/leads`, formData);
    },
    onSuccess: () => {
      toast({ title: "Thank you!", description: "We'll get back to you soon." });
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
    },
  });

  // Auto-advance hero carousel
  useEffect(() => {
    const heroMedia = data?.branding?.heroMedia || [];
    if (heroMedia.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroMedia.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [data?.branding?.heroMedia]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Website Not Found</h2>
            <p className="text-muted-foreground">This website is not available or has been unpublished.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data with defaults
  const businessName = data.businessName || data.businessInfo?.businessName || "Business";
  const tagline = data.businessInfo?.tagline || "";
  const about = data.businessInfo?.about || "";
  const category = data.businessInfo?.category || "";
  const yearFounded = data.businessInfo?.yearFounded;
  const owners = data.businessInfo?.owners || [];
  const logo = data.branding?.logoUrl || data.businessInfo?.logo;
  const coverImages = data.businessInfo?.coverImages || [];
  
  const contactInfo = data.contactInfo || {};
  const address = contactInfo.address || "";
  const city = contactInfo.city || "";
  const state = contactInfo.state || "";
  const pincode = contactInfo.pincode || "";
  const phone = contactInfo.phone || "";
  const whatsapp = contactInfo.whatsapp || phone;
  const email = contactInfo.email || "";
  const workingHours = contactInfo.workingHours || [];
  const googleMapsUrl = contactInfo.googleMapsUrl || "";
  
  const branding = data.branding || {};
  const primaryColor = branding.primaryColor || "#4F46E5";
  const secondaryColor = branding.secondaryColor || "#10B981";
  const accentColor = branding.accentColor || "#F59E0B";
  const heroMedia = branding.heroMedia || [];
  const gallery = branding.gallery || [];
  const socialLinks = branding.socialLinks || {};
  const ctaButtons = branding.ctaButtons || [];
  
  const team = data.team || [];
  const faqs = data.faqs || [];
  const testimonials = data.testimonials || [];
  const coupons = data.coupons || (data as any).coupons || [];
  const features = data.features || {};
  const ecommerce = data.ecommerce || { enabled: false, mode: 'quotation' };
  
  const services = data.services || [];
  const products = data.products || [];
  const reviews = data.reviews || [];
  
  // Trust Numbers from form
  const trustNumbers = (data as any).trustNumbers || { yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 };
  
  // Social Media links
  const socialMedia = (data as any).socialMedia || { facebook: '', instagram: '', youtube: '', twitter: '' };
  
  // Get unique subcategories from products and services (use subcategory only for filtering)
  const productSubcategories = products.map((p: any) => p.subcategory).filter(Boolean);
  const serviceSubcategories = services.map((s: any) => s.subcategory).filter(Boolean);
  const subcategories = ['all', ...Array.from(new Set([...productSubcategories, ...serviceSubcategories]))];
  
  // Check if business is currently open (computed function)
  const getBusinessStatus = (() => {
    if (!workingHours || workingHours.length === 0) return { isOpen: true, message: 'Open' };
    
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const todayHours = workingHours.find((d: any) => d.day === currentDay);
    
    if (!todayHours || !todayHours.isOpen) {
      return { isOpen: false, message: 'Closed Today' };
    }
    
    const slots = todayHours.slots || [];
    for (const slot of slots) {
      if (currentTime >= slot.open && currentTime <= slot.close) {
        return { isOpen: true, message: 'Open Now', closesAt: slot.close };
      }
    }
    
    // Find next opening time
    const nextSlot = slots.find((s: any) => currentTime < s.open);
    if (nextSlot) {
      return { isOpen: false, message: `Opens at ${nextSlot.open}`, opensAt: nextSlot.open };
    }
    
    return { isOpen: false, message: 'Closed' };
  })();
  
  // Get today's business hours (computed function)
  const getTodayHours = (() => {
    if (!workingHours || workingHours.length === 0) return null;
    
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    
    const todayHours = workingHours.find((d: any) => d.day === currentDay);
    if (!todayHours || !todayHours.isOpen || !todayHours.slots?.length) return null;
    
    const firstSlot = todayHours.slots[0];
    const lastSlot = todayHours.slots[todayHours.slots.length - 1];
    
    return { opensAt: firstSlot.open, closesAt: lastSlot.close };
  })();
  
  // Share website function
  const shareWebsite = (platform?: string) => {
    const websiteUrl = window.location.href;
    const shareText = `Check out ${businessName}!`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(websiteUrl);
      toast({ title: "Link Copied!", description: "Website link copied to clipboard" });
      setShareMenuOpen(false);
      return;
    }
    
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + websiteUrl)}`,
      sms: `sms:?body=${encodeURIComponent(shareText + ' ' + websiteUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(websiteUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(websiteUrl)}&text=${encodeURIComponent(shareText)}`,
      email: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(websiteUrl)}`,
    };
    
    if (platform && shareUrls[platform]) {
      if (platform === 'sms') {
        window.location.href = shareUrls[platform];
      } else {
        window.open(shareUrls[platform], '_blank');
      }
      setShareMenuOpen(false);
    } else if (navigator.share) {
      navigator.share({ title: businessName, text: shareText, url: websiteUrl });
    }
  };

  // Calculate trust numbers
  const totalReviews = reviews.length + testimonials.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) + testimonials.reduce((sum, t) => sum + t.rating, 0)) / totalReviews 
    : 5;
  const yearsInBusiness = yearFounded ? new Date().getFullYear() - yearFounded : 0;

  // Cart functions
  const addToCart = (item: CartItem) => {
    const existing = cart.find(c => c.id === item.id && c.type === item.type);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && c.type === item.type ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast({ title: "Added to cart", description: item.name });
  };

  const updateCartQuantity = (id: string, type: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id && c.type === type) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Navigation items
  const navItems = [
    { label: "Home", ref: heroRef },
    ...(services.length > 0 ? [{ label: "Services", ref: servicesRef }] : []),
    ...(products.length > 0 ? [{ label: "Products", ref: productsRef }] : []),
    ...(gallery.length > 0 ? [{ label: "Gallery", ref: galleryRef }] : []),
    { label: "About", ref: aboutRef },
    { label: "Contact", ref: contactRef },
  ];

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // Get all gallery images including hero media
  const allGalleryImages = [...new Set([...gallery, ...heroMedia, ...coverImages])].filter(Boolean);

  // ==================== MOBILE APP UI ====================
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white pb-14" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
        {/* ==================== MOBILE STICKY HEADER ==================== */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left: Logo & Business Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {logo ? (
                <img src={logo} alt={businessName} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  {businessName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg truncate text-gray-900">{businessName}</h1>
              </div>
            </div>
            
            {/* Right: Status & Share */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Business Status with blinking dot */}
              <div className={`flex items-center gap-1.5 ${getBusinessStatus.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${getBusinessStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs font-medium">{getBusinessStatus.isOpen ? 'Open' : 'Closed'}</span>
              </div>
              
              {/* Share Button - YouTube Style Sheet */}
              <Sheet open={shareMenuOpen} onOpenChange={setShareMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Share2 className="h-5 w-5 text-gray-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl px-0 py-0">
                  <div className="px-6 pt-6 pb-3">
                    <h3 className="font-semibold text-lg text-gray-900 text-center">Share</h3>
                  </div>
                  
                  {/* YouTube-style horizontal share options */}
                  <div className="px-6 pb-4">
                    <div className="flex justify-center gap-3 overflow-x-auto scrollbar-hide py-2">
                      <button onClick={() => { shareWebsite('whatsapp'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#25D366' }}>
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-600">WhatsApp</span>
                      </button>
                      <button onClick={() => { shareWebsite('sms'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] text-gray-600">Message</span>
                      </button>
                      <button onClick={() => { shareWebsite('facebook'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1877F2' }}>
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-600">Facebook</span>
                      </button>
                      <button onClick={() => { shareWebsite('twitter'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-600">X</span>
                      </button>
                      <button onClick={() => { shareWebsite('linkedin'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0A66C2' }}>
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-600">LinkedIn</span>
                      </button>
                      <button onClick={() => { shareWebsite('telegram'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0088CC' }}>
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-600">Telegram</span>
                      </button>
                      <button onClick={() => { shareWebsite('email'); setShareMenuOpen(false); }} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                        <div className="w-12 h-12 rounded-full bg-gray-700 text-white flex items-center justify-center">
                          <Mail className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] text-gray-600">Email</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Copy Link Section */}
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                      <span className="flex-1 text-sm text-gray-600 truncate">{typeof window !== 'undefined' ? window.location.href : ''}</span>
                      <button 
                        onClick={() => { shareWebsite('copy'); setShareMenuOpen(false); }} 
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: primaryColor, color: 'white' }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* ==================== MOBILE HOME TAB ==================== */}
        {activeMobileTab === 'home' && (
          <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-1">
            
            {/* Search Bar - Simple like view all section */}
            <div className="bg-white px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Single Banner Image */}
            <div className="relative aspect-[16/9] bg-gray-100">
              {heroMedia.length > 0 ? (
                <img src={heroMedia[0]} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Store className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            
            {/* Business Info Section */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">{businessName}</h2>
                {/* VYORA Verified Badge */}
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[10px] font-medium text-blue-600">Verified</span>
                </div>
              </div>
              
              {/* Reviews & Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-sm text-gray-900">{trustNumbers.starRating > 0 ? trustNumbers.starRating.toFixed(1) : avgRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ({trustNumbers.happyCustomers > 0 ? trustNumbers.happyCustomers : totalReviews} Reviews)
                </span>
              </div>
              
              {/* Address with colored icon */}
              {address && (
                <div className="flex items-start gap-2 mt-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
                  <span className="text-sm text-gray-600 leading-5">{address}{city && `, ${city}`}</span>
                </div>
              )}
              
              {/* Business Hours with clock icon */}
              {getTodayHours && (
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Opens: {formatTo12Hour(getTodayHours.opensAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 font-medium">Closes: {formatTo12Hour(getTodayHours.closesAt)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* 4 CTA Buttons - 2x2 Grid - Always show all 4 CTAs */}
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => phone ? window.open(`tel:${phone}`) : toast({ title: "Phone not available", description: "Contact phone number is not set" })}
                  className="flex items-center justify-center gap-2 h-12 bg-green-500 rounded-xl text-white active:opacity-90 transition-opacity"
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-sm font-medium">Call Now</span>
                </button>
                
                <button 
                  onClick={() => {
                    // Use Google Maps URL if available, otherwise generate from address
                    if (googleMapsUrl) {
                      window.open(googleMapsUrl, '_blank');
                    } else if (address) {
                      const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${pincode ? ` ${pincode}` : ''}`;
                      const encodedAddress = encodeURIComponent(fullAddress);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                    } else {
                      toast({ title: "Address not available", description: "Business address is not set" });
                    }
                  }}
                  className="flex items-center justify-center gap-2 h-12 bg-blue-500 rounded-xl text-white active:opacity-90 transition-opacity"
                >
                  <Navigation className="h-5 w-5" />
                  <span className="text-sm font-medium">Directions</span>
                </button>
                
                <button 
                  onClick={() => {
                    setActiveMobileTab('about');
                    // Delay scroll to allow tab change
                    setTimeout(() => {
                      const contactSection = document.querySelector('[data-section="contact-form"]');
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="flex items-center justify-center gap-2 h-12 bg-purple-500 rounded-xl text-white active:opacity-90 transition-opacity"
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-medium">Send Enquiry</span>
                </button>
                
                <button 
                  onClick={() => {
                    if (cart.length > 0) {
                      setQuotationModalOpen(true);
                    } else {
                      toast({ 
                        title: "Add Items First", 
                        description: "Please add products or services to your cart before requesting a quote" 
                      });
                    }
                  }}
                  className="flex items-center justify-center gap-2 h-12 bg-amber-500 rounded-xl text-white active:opacity-90 transition-opacity"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">Quote</span>
                </button>
              </div>
            </div>
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Offers & Coupons - Horizontal Scroll */}
            {coupons.length > 0 && (
              <div className="pt-4 pb-2 bg-white">
                <div className="px-4 mb-3">
                  <h3 className="font-semibold text-base text-gray-900 flex items-center gap-2">
                    <Tag className="h-5 w-5" style={{ color: primaryColor }} />
                    Offers & Coupons
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {coupons.filter((c: any) => c.isActive !== false && c.status === 'active').map((coupon: any, idx: number) => (
                    <div 
                      key={idx}
                      className="flex-shrink-0 w-64 bg-amber-50 border border-amber-200 border-dashed rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{coupon.title}</h4>
                      {coupon.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{coupon.description}</p>
                      )}
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                        <code className="font-mono text-sm font-semibold" style={{ color: primaryColor }}>{coupon.code}</code>
                        <button 
                          className="p-1.5"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast({ title: "Copied!", description: `Code ${coupon.code} copied` });
                          }}
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Subcategory Filter - Horizontal Scroll */}
            {subcategories.length > 1 && (
              <div className="py-3 bg-white">
                <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedCategory(subcat)}
                      className={`flex-shrink-0 h-9 px-4 rounded-lg text-[13px] font-medium transition-colors border ${
                        selectedCategory === subcat 
                          ? 'text-white border-transparent' 
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                      style={selectedCategory === subcat ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      {subcat === 'all' ? 'All' : subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Products Section - 2 Rows Grid Layout */}
            {products.length > 0 && (
              <div className="pt-4 pb-2 bg-white" data-section="products">
                <div className="px-4 mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-base text-gray-900">Our Products</h3>
                  <button 
                    onClick={() => setLocation(`/${subdomain}/products`)}
                    className="text-sm font-medium flex items-center"
                    style={{ color: primaryColor }}
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                {(() => {
                  const filteredProducts = products
                    .filter((p: any) => {
                      const matchesSubcategory = selectedCategory === 'all' || p.subcategory === selectedCategory;
                      const matchesSearch = !searchQuery || 
                        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchesSubcategory && matchesSearch;
                    });
                  
                  if (filteredProducts.length === 0) {
                    return (
                      <div className="px-4 py-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No products in this subcategory</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="px-4 grid grid-cols-2 gap-3 auto-rows-auto">
                      {filteredProducts.slice(0, 4).map((product: any) => (
                        <div 
                          key={product.id}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                          onClick={() => setLocation(`/${subdomain}/products/${product.id}`)}
                        >
                          <div className="aspect-[4/3] bg-gray-50 relative">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">{product.icon || "📦"}</div>
                            )}
                            {product.stock === 0 && (
                              <Badge variant="destructive" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">Out of Stock</Badge>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-[11px] text-gray-500 truncate">{product.subcategory}</p>
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight mt-0.5">{product.name}</h4>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="font-semibold text-sm" style={{ color: primaryColor }}>₹{product.sellingPrice || product.price}</span>
                              {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
                                <span className="text-[11px] text-gray-400 line-through">₹{product.mrp}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Services Section - 2 Rows Grid Layout */}
            {services.length > 0 && (
              <div className="pt-4 pb-2 bg-white">
                <div className="px-4 mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-base text-gray-900">Our Services</h3>
                  <button 
                    onClick={() => setLocation(`/${subdomain}/services`)}
                    className="text-sm font-medium flex items-center"
                    style={{ color: primaryColor }}
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                {(() => {
                  const filteredServices = services
                    .filter((s: any) => {
                      const matchesSubcategory = selectedCategory === 'all' || s.subcategory === selectedCategory;
                      const matchesSearch = !searchQuery || 
                        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchesSubcategory && matchesSearch;
                    });
                  
                  if (filteredServices.length === 0) {
                    return (
                      <div className="px-4 py-8 text-center">
                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No services in this subcategory</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="px-4 grid grid-cols-2 gap-3 auto-rows-auto">
                      {filteredServices.slice(0, 4).map((service: any) => (
                        <div 
                          key={service.id}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                          onClick={() => {
                            setSelectedService(service);
                            setServiceDetailOpen(true);
                          }}
                        >
                          <div className="aspect-[4/3] bg-gray-50 relative">
                            {service.images?.[0] ? (
                              <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">
                                {service.icon || "✨"}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-[11px] text-gray-500 truncate">{service.subcategory}</p>
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight mt-0.5">{service.name}</h4>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="font-semibold text-sm" style={{ color: primaryColor }}>₹{service.sellingPrice || service.basePrice}</span>
                              {service.duration && <span className="text-[11px] text-gray-400">/ {service.duration}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Business Timing */}
            {workingHours.length > 0 && (
              <div className="pt-4 px-4 pb-4 bg-white">
                <h3 className="font-semibold text-base text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                  Business Hours
                </h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-[100px_1fr_1fr] px-4 py-2 text-xs font-medium border-b border-gray-200" style={{ backgroundColor: primaryColor + '10' }}>
                    <span className="text-gray-500">Day</span>
                    <span className="text-center" style={{ color: primaryColor }}>Business Time</span>
                    <span className="text-center" style={{ color: primaryColor }}>Break Time</span>
                  </div>
                  {/* Table Body */}
                  {workingHours.map((day: any, idx: number) => (
                    <div key={idx} className={`grid grid-cols-[100px_1fr_1fr] px-4 py-3 ${idx !== workingHours.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <span className="font-medium text-sm text-gray-700">{day.day}</span>
                      {day.isOpen ? (
                        <>
                          <div className="text-sm text-center" style={{ color: primaryColor }}>
                            {day.slots?.[0] ? (
                              <span className="whitespace-nowrap">{formatTo12Hour(day.slots[0].open)} - {formatTo12Hour(day.slots[0].close)}</span>
                            ) : '-'}
                          </div>
                          <div className="text-sm text-center text-red-500 font-medium">
                            {day.slots?.length > 1 ? (
                              <span className="whitespace-nowrap">{formatTo12Hour(day.slots[0].close)} - {formatTo12Hour(day.slots[1].open)}</span>
                            ) : '-'}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-center text-gray-400">Closed</span>
                          <span className="text-sm text-center text-gray-400">-</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Social Links */}
            {(socialMedia.facebook || socialMedia.instagram || socialMedia.youtube || socialMedia.twitter) && (
              <div className="pt-6 px-4 pb-4 bg-white">
                <h3 className="font-semibold text-base text-gray-900 mb-4 text-center">Follow Us On Social Media</h3>
                <div className="flex justify-center gap-3">
                  {socialMedia.facebook && (
                    <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-blue-600 rounded-full text-white flex items-center justify-center active:opacity-80">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {socialMedia.instagram && (
                    <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-pink-500 rounded-full text-white flex items-center justify-center active:opacity-80">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {socialMedia.youtube && (
                    <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-red-600 rounded-full text-white flex items-center justify-center active:opacity-80">
                      <Youtube className="h-5 w-5" />
                    </a>
                  )}
                  {socialMedia.twitter && (
                    <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-sky-500 rounded-full text-white flex items-center justify-center active:opacity-80">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* ==================== MOBILE GALLERY TAB ==================== */}
        {activeMobileTab === 'gallery' && (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1">
              {/* Gallery Header */}
              <div className="bg-white px-4 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-lg text-gray-900 text-center flex items-center justify-center gap-2">
                  <Image className="h-5 w-5" style={{ color: primaryColor }} />
                  Business Gallery
                </h2>
                <p className="text-xs text-gray-500 text-center mt-1">Explore our work and ambiance</p>
              </div>
              
              {/* Section Separator */}
              <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
              
              {allGalleryImages.length > 0 ? (
                <div className="p-4 space-y-4">
                  {allGalleryImages.map((image, idx) => (
                    <div 
                      key={idx}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm"
                      onClick={() => setImageZoom({ src: image, scale: 1 })}
                    >
                      <img 
                        src={image} 
                        alt={`Gallery ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                          {idx + 1} / {allGalleryImages.length}
                        </span>
                        <span className="text-white text-xs bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                          <ZoomIn className="h-3 w-3" /> Tap to zoom
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 bg-white">
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p className="text-sm font-medium">No gallery images available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {imageZoom && (
          <div 
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setImageZoom(null)}
          >
            <button 
              className="absolute top-4 right-4 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20"
              onClick={() => setImageZoom(null)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
              <button 
                className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageZoom(prev => prev ? { ...prev, scale: Math.max(0.5, prev.scale - 0.25) } : null);
                }}
              >
                <ZoomOut className="h-5 w-5 text-white" />
              </button>
              <button 
                className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageZoom(prev => prev ? { ...prev, scale: Math.min(3, prev.scale + 0.25) } : null);
                }}
              >
                <ZoomIn className="h-5 w-5 text-white" />
              </button>
            </div>
            <img 
              src={imageZoom.src} 
              alt="Zoomed" 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${imageZoom.scale})` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ==================== MOBILE ABOUT US TAB ==================== */}
        {activeMobileTab === 'about' && (
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-1">
            {/* Business Description */}
            <div className="bg-white px-4 pt-4 pb-4">
              <h3 className="font-bold text-xl text-gray-900 mb-4 text-center">
                About Us
              </h3>
              <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl p-5 shadow-sm overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 left-0 w-20 h-20 rounded-full blur-3xl opacity-30" style={{ backgroundColor: primaryColor }}></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }}></div>
                
                <div className="relative">
                  {about ? (
                    <p className="text-sm text-gray-700 leading-7 whitespace-pre-line">{about}</p>
                  ) : (
                    <p className="text-sm text-gray-700 leading-7">
                      Welcome to {businessName}! We are dedicated to providing the best {category || 'services'} in {city || 'your area'}.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Team - Only show if vendor created team members */}
            {team.length > 0 && (
              <div className="bg-white px-4 py-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 text-center">
                  Our Team
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {team.slice(0, 6).map((member: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gray-200 ring-2 ring-gray-100">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-gray-400">
                            {member.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-gray-900">{member.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{member.designation || member.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            {team.length > 0 && (
              <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            )}
            
            {/* Trust Numbers - Why Choose Us (right after Team) */}
            {(trustNumbers.yearsInBusiness > 0 || trustNumbers.happyCustomers > 0 || trustNumbers.starRating > 0 || trustNumbers.repeatCustomers > 0) && (
              <div className="bg-white px-4 py-4">
                <h3 className="font-bold text-xl text-gray-900 mb-4 text-center">
                  Why Choose Us
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {trustNumbers.yearsInBusiness > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="font-bold text-2xl" style={{ color: primaryColor }}>{trustNumbers.yearsInBusiness}+</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Years in Business</p>
                    </div>
                  )}
                  {trustNumbers.happyCustomers > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="font-bold text-2xl" style={{ color: primaryColor }}>{trustNumbers.happyCustomers}+</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Happy Customers</p>
                    </div>
                  )}
                  {trustNumbers.starRating > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="font-bold text-2xl" style={{ color: primaryColor }}>{trustNumbers.starRating}</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Star Rating</p>
                    </div>
                  )}
                  {trustNumbers.repeatCustomers > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                      <p className="font-bold text-2xl" style={{ color: primaryColor }}>{trustNumbers.repeatCustomers}%</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Repeat Customers</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            {(trustNumbers.yearsInBusiness > 0 || trustNumbers.happyCustomers > 0 || trustNumbers.starRating > 0 || trustNumbers.repeatCustomers > 0) && (
              <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            )}
            
            {/* Social Media Links */}
            {(socialMedia.facebook || socialMedia.instagram || socialMedia.youtube || socialMedia.twitter || socialMedia.linkedin) && (
              <div className="bg-white px-4 py-4">
                <h3 className="font-bold text-xl text-gray-900 mb-4 text-center">
                  Follow Us
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {socialMedia.facebook && (
                    <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Facebook</span>
                    </a>
                  )}
                  {socialMedia.instagram && (
                    <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <Instagram className="h-5 w-5 text-pink-500" />
                      <span className="text-sm font-medium text-gray-700">Instagram</span>
                    </a>
                  )}
                  {socialMedia.youtube && (
                    <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <Youtube className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-gray-700">YouTube</span>
                    </a>
                  )}
                  {socialMedia.twitter && (
                    <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <Twitter className="h-5 w-5 text-sky-500" />
                      <span className="text-sm font-medium text-gray-700">Twitter</span>
                    </a>
                  )}
                  {socialMedia.linkedin && (
                    <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            {(socialMedia.facebook || socialMedia.instagram || socialMedia.youtube || socialMedia.twitter || socialMedia.linkedin) && (
              <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            )}
            
            {/* What Our Customers Say */}
            {(testimonials.length > 0 || reviews.length > 0) && (
              <div className="bg-white px-4 py-4">
                <h3 className="font-bold text-xl text-gray-900 mb-4 text-center">
                  What Our Customers Say
                </h3>
                <div className="space-y-3">
                  {[...testimonials, ...reviews].slice(0, 5).map((review: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-gray-100">
                          {review.customerPhoto ? (
                            <img src={review.customerPhoto} alt={review.customerName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-medium text-gray-400">
                              {review.customerName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{review.customerName}</p>
                          {review.customerLocation && (
                            <p className="text-xs text-gray-500">{review.customerLocation}</p>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-5">{review.reviewText || review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section Separator */}
            {(testimonials.length > 0 || reviews.length > 0) && (
              <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            )}
            
            {/* FAQs */}
            {faqs.length > 0 && (
              <div className="bg-white px-4 py-4">
                <h3 className="font-bold text-xl text-gray-900 mb-4 text-center">
                  FAQs
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((faq: any, idx: number) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-100 rounded-2xl px-4 shadow-sm">
                      <AccordionTrigger className="text-left font-medium text-sm text-gray-900 hover:no-underline py-3">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600 leading-5 pb-3">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            
            {/* Section Separator */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor + '15' }}></div>
            
            {/* Contact Form */}
            <div className="bg-white px-4 py-4" ref={contactRef} data-section="contact-form">
              <h3 className="font-semibold text-lg text-gray-900 mb-4 text-center">
                Send Enquiry
              </h3>
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
                <form onSubmit={(e) => { e.preventDefault(); leadMutation.mutate(leadForm); }} className="space-y-3">
                  <Input
                    placeholder="Your Name *"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    required
                    className="h-11 text-sm bg-white"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="h-11 text-sm bg-white"
                  />
                  <Input
                    placeholder="Phone *"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    required
                    className="h-11 text-sm bg-white"
                  />
                  <Textarea
                    placeholder="Message"
                    value={leadForm.message}
                    onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                    rows={3}
                    className="text-sm bg-white"
                  />
                  <button 
                    type="submit" 
                    className="w-full h-12 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                    disabled={leadMutation.isPending}
                  >
                    {leadMutation.isPending ? "Sending..." : "Send Enquiry"}
                  </button>
                </form>
              </div>
            </div>
            </div>
            
          </div>
        )}

        {/* ==================== MOBILE CART TAB ==================== */}
        {activeMobileTab === 'cart' && (
          <div className="min-h-screen bg-white flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart className="h-16 w-16 mb-4" />
                <p className="font-medium text-gray-600">Your cart is empty</p>
                <p className="text-sm mt-1">Add products to get started</p>
                <button 
                  className="mt-4 h-11 px-6 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setActiveMobileTab('home')}
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Cart Items - Amazon Style */}
                <div className="flex-1 p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex gap-3 bg-white border border-gray-100 rounded-xl p-3">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.type}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-semibold text-base" style={{ color: primaryColor }}>₹{item.price * item.quantity}</p>
                          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg">
                            <button 
                              className="w-8 h-8 flex items-center justify-center active:bg-gray-100"
                              onClick={() => updateCartQuantity(item.id, item.type, -1)}
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </button>
                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                            <button 
                              className="w-8 h-8 flex items-center justify-center active:bg-gray-100"
                              onClick={() => updateCartQuantity(item.id, item.type, 1)}
                            >
                              <Plus className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Cart Summary - Amazon Style */}
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {/* Subtotal Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({cartItemCount} items)</span>
                      <span className="text-gray-900 font-medium">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold" style={{ color: primaryColor }}>₹{cartTotal}</span>
                    </div>
                  </div>
                  <button 
                    className="w-full h-12 rounded-xl text-white font-medium text-sm"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setLocation(`/${subdomain}/checkout`)}
                  >
                    Proceed to Checkout ({cartItemCount} items)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== MOBILE USER PROFILE TAB ==================== */}
        {activeMobileTab === 'profile' && (
          <div className="min-h-screen bg-white flex flex-col">
            <div className="p-4 flex-1">
              {/* User Info */}
              {customerData ? (
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg" style={{ backgroundColor: primaryColor }}>
                    {customerData.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-gray-900 truncate">{customerData.name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{customerData.email || customerData.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
                  <UserCircle className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium text-gray-700 mb-4">Sign in to your account</p>
                  <button 
                    className="h-11 px-6 rounded-xl text-white text-sm font-medium"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setLocation(`/${subdomain}/login`)}
                  >
                    Login / Sign Up
                  </button>
                </div>
              )}
              
              {/* Profile Menu Items - Only unique items not in header/footer */}
              <div className="space-y-2">
                {customerData && (
                  <button 
                    className="w-full flex items-center gap-3 h-14 px-4 bg-gray-50 rounded-xl active:bg-gray-100"
                    onClick={() => setLocation(`/${subdomain}/my-orders`)}
                  >
                    <Package className="h-5 w-5" style={{ color: primaryColor }} />
                    <span className="font-medium text-sm text-gray-700">My Orders</span>
                    <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
                  </button>
                )}
                
                {customerData && (
                  <button 
                    className="w-full flex items-center gap-3 h-14 px-4 bg-gray-50 rounded-xl active:bg-gray-100"
                    onClick={() => setLocation(`/${subdomain}/my-quotations`)}
                  >
                    <FileText className="h-5 w-5" style={{ color: primaryColor }} />
                    <span className="font-medium text-sm text-gray-700">My Quotations</span>
                    <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
                  </button>
                )}
                
                {customerData && (
                  <button 
                    className="w-full flex items-center gap-3 h-14 px-4 bg-red-50 rounded-xl active:bg-red-100 text-red-600 mt-4"
                    onClick={() => {
                      localStorage.removeItem("customerToken");
                      localStorage.removeItem("customerData");
                      setCustomerToken(null);
                      setCustomerData(null);
                      toast({ title: "Logged out", description: "You have been logged out successfully" });
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium text-sm">Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MOBILE FIXED BOTTOM NAVIGATION ==================== */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-pb">
          <div className="flex items-center justify-around h-14">
            <button 
              onClick={() => setActiveMobileTab('home')}
              className="flex flex-col items-center justify-center flex-1 h-full"
              style={{ color: activeMobileTab === 'home' ? primaryColor : '#1f2937' }}
            >
              <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="text-[11px] mt-1 font-medium">Home</span>
            </button>
            
            <button 
              onClick={() => setActiveMobileTab('gallery')}
              className="flex flex-col items-center justify-center flex-1 h-full"
              style={{ color: activeMobileTab === 'gallery' ? primaryColor : '#1f2937' }}
            >
              <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span className="text-[11px] mt-1 font-medium">Gallery</span>
            </button>
            
            <button 
              onClick={() => setActiveMobileTab('about')}
              className="flex flex-col items-center justify-center flex-1 h-full"
              style={{ color: activeMobileTab === 'about' ? primaryColor : '#1f2937' }}
            >
              <BookOpen className="h-[22px] w-[22px]" />
              <span className="text-[11px] mt-1 font-medium">About Us</span>
            </button>
            
            <button 
              onClick={() => setActiveMobileTab('cart')}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{ color: activeMobileTab === 'cart' ? primaryColor : '#1f2937' }}
            >
              <div className="relative">
                <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-medium flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-medium">Cart</span>
            </button>
            
            <button 
              onClick={() => setActiveMobileTab('profile')}
              className="flex flex-col items-center justify-center flex-1 h-full"
              style={{ color: activeMobileTab === 'profile' ? primaryColor : '#1f2937' }}
            >
              <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-[11px] mt-1 font-medium">Profile</span>
            </button>
          </div>
        </nav>

        {/* Service Detail Dialog */}
        <MiniWebsiteServiceDetailDialog
          open={serviceDetailOpen}
          onOpenChange={setServiceDetailOpen}
          service={selectedService}
          primaryColor={primaryColor}
          onAddToCart={ecommerce.enabled ? (service) => {
            addToCart({
              type: 'service',
              id: service.id,
              name: service.name,
              price: service.sellingPrice || service.basePrice || 0,
              quantity: 1,
              image: service.images?.[0],
              vendorCatalogueId: service.id,
            });
            setServiceDetailOpen(false);
          } : undefined}
        />

        {/* Product Detail Dialog */}
        {selectedProduct && (
          <ProductDetailDialog
            open={productDetailOpen}
            onOpenChange={setProductDetailOpen}
            product={selectedProduct}
            primaryColor={primaryColor}
            showAddToCart={ecommerce.enabled}
            onAddToCart={(quantity) => {
              if (selectedProduct) {
                addToCart({
                  type: 'product',
                  id: selectedProduct.id,
                  name: selectedProduct.name,
                  price: selectedProduct.price,
                  quantity,
                  image: selectedProduct.images?.[0],
                  vendorProductId: selectedProduct.id,
                });
                setProductDetailOpen(false);
              }
            }}
          />
        )}

        {/* Quotation Request Modal */}
        <QuotationModal
          open={quotationModalOpen}
          onOpenChange={setQuotationModalOpen}
          items={cart}
          subdomain={subdomain}
          primaryColor={primaryColor}
          customerToken={customerToken}
          onSuccess={() => {
            setCart([]);
            localStorage.removeItem(`cart_${subdomain}`);
          }}
        />
      </div>
    );
  }

  // ==================== DESKTOP VIEW (MNC LEVEL FULL-SCREEN DESIGN) ====================
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: branding.fontFamily || "'DM Sans', 'Inter', sans-serif" }}>
      {/* ==================== HEADER NAVIGATION - FULL WIDTH ==================== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => scrollToSection(heroRef)}>
              {logo ? (
                <img src={logo} alt={businessName} className="h-14 w-14 rounded-xl object-cover shadow-md" />
              ) : (
                <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md" style={{ backgroundColor: primaryColor }}>
                  {businessName.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="flex items-center gap-3">
                  <h1 className="font-bold text-xl lg:text-2xl text-gray-900">{businessName}</h1>
                  {/* VYORA Verified Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: primaryColor + '15' }}>
                    <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                    <span className="text-xs font-semibold" style={{ color: primaryColor }}>Verified</span>
                  </div>
                </div>
                {tagline && <p className="text-sm text-gray-500 mt-0.5 max-w-md line-clamp-1">{tagline}</p>}
              </div>
            </div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center gap-1 bg-gray-50 rounded-full px-2 py-1.5">
              {navItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(item.ref)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Business Status Indicator */}
              <div className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full ${getBusinessStatus.isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${getBusinessStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm font-semibold">{getBusinessStatus.isOpen ? 'Open Now' : 'Closed'}</span>
              </div>

              {/* Share Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl border-gray-200 hover:bg-gray-50">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <DropdownMenuLabel className="text-center">Share Website</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => shareWebsite('whatsapp')} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-3 text-green-600" /> WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareWebsite('facebook')} className="cursor-pointer">
                    <Facebook className="h-4 w-4 mr-3 text-blue-600" /> Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareWebsite('twitter')} className="cursor-pointer">
                    <Twitter className="h-4 w-4 mr-3 text-sky-500" /> Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareWebsite('linkedin')} className="cursor-pointer">
                    <Linkedin className="h-4 w-4 mr-3 text-blue-700" /> LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareWebsite('email')} className="cursor-pointer">
                    <Mail className="h-4 w-4 mr-3 text-gray-600" /> Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => shareWebsite('copy')} className="cursor-pointer">
                    <Copy className="h-4 w-4 mr-3" /> Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cart Button */}
              {ecommerce.enabled && (
                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative h-10 px-4 rounded-xl border-gray-200 hover:bg-gray-50 gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="hidden lg:inline text-sm font-medium">Cart</span>
                      {cartItemCount > 0 && (
                        <Badge className="h-5 min-w-5 flex items-center justify-center px-1.5 text-xs font-semibold" style={{ backgroundColor: primaryColor }}>
                          {cartItemCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg">
                    <SheetHeader className="border-b pb-4">
                      <SheetTitle className="text-xl">Shopping Cart ({cartItemCount} items)</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-3 max-h-[55vh] overflow-y-auto pr-2">
                      {cart.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 font-medium">Your cart is empty</p>
                          <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <Card key={`${item.type}-${item.id}`} className="border-gray-100">
                            <CardContent className="p-4 flex items-center gap-4">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                                <p className="text-sm text-gray-500 mt-0.5">₹{item.price} each</p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => updateCartQuantity(item.id, item.type, -1)}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => updateCartQuantity(item.id, item.type, 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="font-bold text-lg" style={{ color: primaryColor }}>₹{item.price * item.quantity}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                    {cart.length > 0 && (
                      <div className="mt-6 space-y-4 border-t pt-6">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                          <span className="text-2xl font-bold" style={{ color: primaryColor }}>₹{cartTotal}</span>
                        </div>
                        <Button className="w-full h-12 text-base font-semibold rounded-xl" style={{ backgroundColor: primaryColor }} onClick={() => setLocation(`/${subdomain}/checkout`)}>
                          Proceed to Checkout
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full h-12 text-base font-semibold rounded-xl border-2" 
                          onClick={() => {
                            setCartOpen(false);
                            setQuotationModalOpen(true);
                          }}
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          Request Quotation
                        </Button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              )}

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-2 h-10 px-4 rounded-xl border-gray-200 hover:bg-gray-50">
                    {customerData ? (
                      <>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
                          {customerData.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium">{customerData.name?.split(' ')[0] || 'User'}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5" />
                        <span className="text-sm font-medium">Login</span>
                      </>
                    )}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  {customerData ? (
                    <>
                      <DropdownMenuLabel className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
                            {customerData.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold">{customerData.name || 'User'}</p>
                            <p className="text-xs text-gray-500">{customerData.email || customerData.phone}</p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation(`/${subdomain}/my-orders`)} className="cursor-pointer py-2.5">
                        <Package className="h-4 w-4 mr-3" /> My Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation(`/${subdomain}/my-quotations`)} className="cursor-pointer py-2.5">
                        <FileText className="h-4 w-4 mr-3" /> My Quotations
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 cursor-pointer py-2.5"
                        onClick={() => {
                          localStorage.removeItem("customerToken");
                          localStorage.removeItem("customerData");
                          setCustomerToken(null);
                          setCustomerData(null);
                          toast({ title: "Logged out", description: "You have been logged out successfully" });
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-3" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => setLocation(`/${subdomain}/login`)} className="cursor-pointer py-2.5">
                        <User className="h-4 w-4 mr-3" /> Login
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation(`/${subdomain}/signup`)} className="cursor-pointer py-2.5">
                        <UserCircle className="h-4 w-4 mr-3" /> Sign Up
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tablet Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden h-10 w-10 rounded-xl border-gray-200">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader className="border-b pb-4">
                    <SheetTitle className="text-lg">{businessName}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {navItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToSection(item.ref)}
                        className="block w-full text-left px-4 py-3.5 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                    <Separator className="my-4" />
                    {phone && (
                      <Button className="w-full h-12 gap-2 rounded-xl text-base font-semibold" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`tel:${phone}`)}>
                        <Phone className="h-5 w-5" />
                        Call Now
                      </Button>
                    )}
                    {whatsapp && (
                      <Button variant="outline" className="w-full h-12 gap-2 rounded-xl text-base font-semibold border-green-500 text-green-600 hover:bg-green-50" onClick={() => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)}>
                        <MessageCircle className="h-5 w-5" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== HERO SECTION - FULL WIDTH IMMERSIVE ==================== */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center">
        {/* Background */}
        {heroMedia.length > 0 ? (
          <div className="absolute inset-0">
            {heroMedia.map((media, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              >
                <img src={media} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
              </div>
            ))}
            {/* Carousel Controls */}
            {heroMedia.length > 1 && (
              <>
                <button
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md transition-all"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + heroMedia.length) % heroMedia.length)}
                >
                  <ChevronLeft className="h-8 w-8 text-white" />
                </button>
                <button
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md transition-all"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % heroMedia.length)}
                >
                  <ChevronRight className="h-8 w-8 text-white" />
                </button>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                  {heroMedia.map((_, idx) => (
                    <button
                      key={idx}
                      className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'w-12 bg-white' : 'w-2 bg-white/50'}`}
                      onClick={() => setCurrentSlide(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)` }} />
        )}

        {/* Hero Content - Full Width */}
        <div className="relative z-10 w-full px-6 lg:px-12 xl:px-20 py-20">
          <div className="max-w-4xl">
            {category && (
              <Badge className="mb-6 text-sm px-4 py-2 font-semibold" style={{ backgroundColor: `rgba(255,255,255,0.15)`, color: 'white', backdropFilter: 'blur(8px)' }}>
                {category}
              </Badge>
            )}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              {businessName}
            </h1>
            {tagline && (
              <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 max-w-2xl leading-relaxed">{tagline}</p>
            )}
            
            {/* Reviews & Rating + Location Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white text-lg">{trustNumbers.starRating > 0 ? trustNumbers.starRating.toFixed(1) : avgRating.toFixed(1)}</span>
                <span className="text-white/80">({trustNumbers.happyCustomers > 0 ? trustNumbers.happyCustomers : totalReviews}+ Reviews)</span>
              </div>
              {address && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                  <MapPin className="h-5 w-5 text-red-400" />
                  <span className="text-white/90">{city || address.split(',')[0]}</span>
                </div>
              )}
              {getTodayHours && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20">
                  <Clock className="h-5 w-5 text-green-400" />
                  <span className="text-white/90">{formatTo12Hour(getTodayHours.opensAt)} - {formatTo12Hour(getTodayHours.closesAt)}</span>
                </div>
              )}
            </div>

            {/* 4 CTA Buttons - Professional Grid - Always show all 4 CTAs */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-3 h-14 px-8 text-base font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105"
                onClick={() => phone ? window.open(`tel:${phone}`) : toast({ title: "Phone not available", description: "Contact phone number is not set" })}
              >
                <Phone className="h-5 w-5" />
                Call Now
              </Button>
              <Button 
                size="lg" 
                className="gap-3 h-14 px-8 text-base font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                onClick={() => {
                  // Use Google Maps URL if available, otherwise generate from address
                  if (googleMapsUrl) {
                    window.open(googleMapsUrl, '_blank');
                  } else if (address) {
                    const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${pincode ? ` ${pincode}` : ''}`;
                    const encodedAddress = encodeURIComponent(fullAddress);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                  } else {
                    toast({ title: "Address not available", description: "Business address is not set" });
                  }
                }}
              >
                <Navigation className="h-5 w-5" />
                Get Directions
              </Button>
              <Button 
                size="lg" 
                className="gap-3 h-14 px-8 text-base font-semibold rounded-xl bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
                onClick={() => scrollToSection(contactRef)}
              >
                <Mail className="h-5 w-5" />
                Send Enquiry
              </Button>
              <Button 
                size="lg" 
                className="gap-3 h-14 px-8 text-base font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
                onClick={() => {
                  if (cart.length > 0) {
                    setQuotationModalOpen(true);
                  } else {
                    toast({ 
                      title: "Add Items First", 
                      description: "Please add products or services to your cart before requesting a quote" 
                    });
                  }
                }}
              >
                <FileText className="h-5 w-5" />
                Request Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar Overlay - Bottom of Hero */}
        <div className="absolute bottom-0 left-0 right-0 pb-0 hidden">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="max-w-3xl relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-14 text-base bg-white/95 backdrop-blur-md border-0 rounded-2xl shadow-2xl focus:outline-none focus:ring-4 transition-all"
                style={{ '--tw-ring-color': primaryColor + '40' } as any}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WHY CHOOSE US (TRUST NUMBERS) - FULL WIDTH ==================== */}
      {(trustNumbers.yearsInBusiness > 0 || trustNumbers.happyCustomers > 0 || trustNumbers.starRating > 0 || trustNumbers.repeatCustomers > 0 || yearsInBusiness > 0 || totalReviews > 0) && (
        <section className="py-16 bg-white">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                <Award className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>Our Achievements</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Why Choose Us</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {(trustNumbers.yearsInBusiness > 0 || yearsInBusiness > 0) && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                    <Building className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-bold text-4xl lg:text-5xl mb-2" style={{ color: primaryColor }}>{trustNumbers.yearsInBusiness > 0 ? trustNumbers.yearsInBusiness : yearsInBusiness}+</p>
                  <p className="text-sm text-gray-600 font-medium">Years in Business</p>
                </div>
              )}
              {(trustNumbers.happyCustomers > 0 || totalReviews > 0) && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                    <Users className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-bold text-4xl lg:text-5xl mb-2" style={{ color: primaryColor }}>{trustNumbers.happyCustomers > 0 ? trustNumbers.happyCustomers : totalReviews}+</p>
                  <p className="text-sm text-gray-600 font-medium">Happy Customers</p>
                </div>
              )}
              {(trustNumbers.starRating > 0 || avgRating > 0) && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                    <Star className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-bold text-4xl lg:text-5xl mb-2" style={{ color: primaryColor }}>{trustNumbers.starRating > 0 ? trustNumbers.starRating : avgRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-600 font-medium">Star Rating</p>
                </div>
              )}
              {trustNumbers.repeatCustomers > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                    <Heart className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-bold text-4xl lg:text-5xl mb-2" style={{ color: primaryColor }}>{trustNumbers.repeatCustomers}%</p>
                  <p className="text-sm text-gray-600 font-medium">Repeat Customers</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== OFFERS & COUPONS - FULL WIDTH ==================== */}
      {coupons.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-amber-50 to-white">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-100">
                  <Tag className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-gray-900">Special Offers</h3>
                  <p className="text-sm text-gray-500">Exclusive deals just for you</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coupons.filter((c: any) => c.isActive !== false && c.status === 'active').slice(0, 4).map((coupon: any, idx: number) => (
                <div 
                  key={idx}
                  className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Badge className="bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{coupon.title}</h4>
                  {coupon.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{coupon.description}</p>
                  )}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <code className="font-mono text-base font-bold" style={{ color: primaryColor }}>{coupon.code}</code>
                    <button 
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        toast({ title: "Copied!", description: `Code ${coupon.code} copied to clipboard` });
                      }}
                    >
                      <Copy className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== SEARCH & FILTER BAR ==================== */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Search Bar */}
            <div className="w-full lg:w-96 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-12 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            
            {/* Subcategory Filter */}
            {subcategories.length > 1 && (products.length > 0 || services.length > 0) && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {subcategories.map((subcat) => (
                  <button
                    key={subcat}
                    onClick={() => setSelectedCategory(subcat)}
                    className={`flex-shrink-0 h-11 px-6 rounded-xl text-sm font-semibold transition-all border-2 ${
                      selectedCategory === subcat 
                        ? 'text-white border-transparent shadow-lg' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={selectedCategory === subcat ? { backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` } : {}}
                  >
                    {subcat === 'all' ? 'All Categories' : subcat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== PRODUCTS SECTION - FULL WIDTH ==================== */}
      {products.length > 0 && (
        <section ref={productsRef} className="py-16 bg-gray-50">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                  <Package className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Our Products</h3>
                  <p className="text-sm text-gray-500 mt-1">Quality products at best prices</p>
                </div>
              </div>
              <button 
                onClick={() => setLocation(`/${subdomain}/products`)}
                className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
              >
                View All Products <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Filtered Products */}
            {(() => {
              const filteredProducts = products.filter((p: any) => {
                const matchesSubcategory = selectedCategory === 'all' || p.subcategory === selectedCategory;
                const matchesSearch = !searchQuery || 
                  p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesSubcategory && matchesSearch;
              });

              if (filteredProducts.length === 0) {
                return (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg text-gray-500 font-medium">No products found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button 
                        variant="outline" 
                        className="mt-6 rounded-xl"
                        onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredProducts.slice(0, 10).map((product: any) => (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => setLocation(`/${subdomain}/products/${product.id}`)}
                    >
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50">{product.icon || "📦"}</div>
                        )}
                        {product.stock === 0 && (
                          <Badge variant="destructive" className="absolute top-3 left-3 text-xs px-2 py-1">Out of Stock</Badge>
                        )}
                        {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
                          <Badge className="absolute top-3 right-3 text-xs px-2 py-1 bg-green-500">
                            {Math.round((1 - (product.sellingPrice || product.price) / product.mrp) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-1">{product.subcategory || product.category}</p>
                        <h4 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{product.name}</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xl" style={{ color: primaryColor }}>₹{product.sellingPrice || product.price}</span>
                          {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
                            <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                        {ecommerce.enabled && product.stock > 0 && (
                          <Button 
                            size="sm" 
                            className="w-full mt-4 h-11 font-semibold rounded-xl"
                            style={{ backgroundColor: primaryColor }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                type: 'product',
                                id: product.id,
                                name: product.name,
                                price: product.sellingPrice || product.price,
                                quantity: 1,
                                image: product.images?.[0],
                                vendorProductId: product.id,
                              });
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            
            {/* Mobile View All Button */}
            <div className="lg:hidden text-center mt-8">
              <Button 
                onClick={() => setLocation(`/${subdomain}/products`)}
                className="h-12 px-8 rounded-xl font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                View All Products <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SERVICES SECTION - FULL WIDTH ==================== */}
      {services.length > 0 && (
        <section ref={servicesRef} className="py-16 bg-white">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '15' }}>
                  <Briefcase className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Our Services</h3>
                  <p className="text-sm text-gray-500 mt-1">Professional services tailored for you</p>
                </div>
              </div>
              <button 
                onClick={() => setLocation(`/${subdomain}/services`)}
                className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                style={{ backgroundColor: primaryColor + '15', color: primaryColor }}
              >
                View All Services <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Filtered Services */}
            {(() => {
              const filteredServices = services.filter((s: any) => {
                const matchesSubcategory = selectedCategory === 'all' || s.subcategory === selectedCategory;
                const matchesSearch = !searchQuery || 
                  s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesSubcategory && matchesSearch;
              });

              if (filteredServices.length === 0) {
                return (
                  <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg text-gray-500 font-medium">No services found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button 
                        variant="outline" 
                        className="mt-6 rounded-xl"
                        onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredServices.slice(0, 10).map((service: any) => (
                    <div 
                      key={service.id} 
                      className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedService(service);
                        setServiceDetailOpen(true);
                      }}
                    >
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {service.images?.[0] ? (
                          <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">
                            {service.icon || "✨"}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-1">{service.subcategory || service.category}</p>
                        <h4 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{service.name}</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xl" style={{ color: primaryColor }}>₹{service.sellingPrice || service.basePrice}</span>
                          {service.duration && <span className="text-sm text-gray-400">/ {service.duration}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            
            {/* Mobile View All Button */}
            <div className="lg:hidden text-center mt-8">
              <Button 
                onClick={() => setLocation(`/${subdomain}/services`)}
                className="h-12 px-8 rounded-xl font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                View All Services <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ==================== GALLERY SECTION - FULL WIDTH ==================== */}
      {allGalleryImages.length > 0 && (
        <section ref={galleryRef} className="py-16 bg-gray-50">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                <Image className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>Gallery</span>
              </div>
              <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Explore Our Work</h3>
              <p className="text-gray-500 mt-2">Take a visual tour of our business</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allGalleryImages.slice(0, 10).map((image, idx) => (
                <div 
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all"
                  onClick={() => {
                    setFullscreenImage(image);
                    setFullscreenImageIndex(idx);
                  }}
                >
                  <img src={image} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {idx + 1} / {allGalleryImages.length}
                    </span>
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fullscreen Image Viewer */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <DialogHeader className="sr-only">
            <DialogTitle>Gallery Image</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {fullscreenImage && (
              <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
            )}
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
            {allGalleryImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full"
                  onClick={() => {
                    const newIdx = (fullscreenImageIndex - 1 + allGalleryImages.length) % allGalleryImages.length;
                    setFullscreenImageIndex(newIdx);
                    setFullscreenImage(allGalleryImages[newIdx]);
                  }}
                >
                  <ChevronLeft className="h-8 w-8 text-white" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full"
                  onClick={() => {
                    const newIdx = (fullscreenImageIndex + 1) % allGalleryImages.length;
                    setFullscreenImageIndex(newIdx);
                    setFullscreenImage(allGalleryImages[newIdx]);
                  }}
                >
                  <ChevronRight className="h-8 w-8 text-white" />
                </button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {fullscreenImageIndex + 1} / {allGalleryImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== ABOUT US SECTION - FULL WIDTH ==================== */}
      <section ref={aboutRef} className="py-16 bg-white">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: primaryColor + '15' }}>
                  <Info className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="text-sm font-semibold" style={{ color: primaryColor }}>About Us</span>
                </div>
                <h3 className="font-bold text-3xl lg:text-4xl text-gray-900 mb-6 leading-tight">
                  Welcome to {businessName}
                </h3>
                {about ? (
                  <p className="text-base lg:text-lg text-gray-600 leading-8 whitespace-pre-line">{about}</p>
                ) : (
                  <p className="text-base lg:text-lg text-gray-600 leading-8">
                    We are dedicated to providing the best {category || 'services'} in {city || 'your area'}. Our commitment to quality and customer satisfaction sets us apart from the rest.
                  </p>
                )}
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 mt-8">
                  {(trustNumbers.yearsInBusiness > 0 || yearsInBusiness > 0) && (
                    <div>
                      <p className="font-bold text-3xl" style={{ color: primaryColor }}>{trustNumbers.yearsInBusiness > 0 ? trustNumbers.yearsInBusiness : yearsInBusiness}+</p>
                      <p className="text-sm text-gray-500">Years Experience</p>
                    </div>
                  )}
                  {(trustNumbers.happyCustomers > 0 || totalReviews > 0) && (
                    <div>
                      <p className="font-bold text-3xl" style={{ color: primaryColor }}>{trustNumbers.happyCustomers > 0 ? trustNumbers.happyCustomers : totalReviews}+</p>
                      <p className="text-sm text-gray-500">Happy Customers</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right - Image or Decorative */}
              <div className="relative">
                {coverImages.length > 0 || heroMedia.length > 0 ? (
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <img 
                      src={coverImages[0] || heroMedia[0]} 
                      alt={businessName} 
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                ) : (
                  <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl p-12 text-center">
                    <div className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl" style={{ backgroundColor: primaryColor }}>
                      {businessName.charAt(0)}
                    </div>
                    <p className="mt-6 text-xl font-bold text-gray-900">{businessName}</p>
                    {category && <p className="text-gray-500 mt-1">{category}</p>}
                  </div>
                )}
                
                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" style={{ color: primaryColor }} />
                    <span className="font-semibold text-gray-900">Vyora Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TEAM SECTION - FULL WIDTH - Only show if vendor created team members ==================== */}
      {team.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                <Users className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>Our Team</span>
              </div>
              <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Meet The Experts</h3>
              <p className="text-gray-500 mt-2">Dedicated professionals at your service</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
              {team.slice(0, 8).map((member: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-gray-100 ring-4 ring-gray-50">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                        {member.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{member.designation || member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== BUSINESS HOURS - FULL WIDTH ==================== */}
      {workingHours.length > 0 && (
        <section className="py-16 bg-white">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                  <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="text-sm font-semibold" style={{ color: primaryColor }}>Hours</span>
                </div>
                <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Business Hours</h3>
                <p className="text-gray-500 mt-2">Plan your visit with our schedule</p>
              </div>
              
              <div className="bg-gray-50 rounded-3xl overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="grid grid-cols-[140px_1fr_1fr] lg:grid-cols-[200px_1fr_1fr] px-6 py-4 text-sm font-semibold border-b border-gray-200" style={{ backgroundColor: primaryColor + '10' }}>
                  <span className="text-gray-600">Day</span>
                  <span className="text-center" style={{ color: primaryColor }}>Business Hours</span>
                  <span className="text-center" style={{ color: primaryColor }}>Break Time</span>
                </div>
                {/* Table Body */}
                {workingHours.map((day: any, idx: number) => {
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day.day;
                  return (
                    <div 
                      key={idx} 
                      className={`grid grid-cols-[140px_1fr_1fr] lg:grid-cols-[200px_1fr_1fr] px-6 py-4 ${idx !== workingHours.length - 1 ? 'border-b border-gray-100' : ''} ${isToday ? 'bg-white' : ''}`}
                    >
                      <span className={`font-medium text-gray-700 ${isToday ? 'flex items-center gap-2' : ''}`}>
                        {day.day}
                        {isToday && <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: primaryColor }}>Today</span>}
                      </span>
                      {day.isOpen ? (
                        <>
                          <div className="text-center font-medium" style={{ color: primaryColor }}>
                            {day.slots?.[0] ? (
                              <span className="whitespace-nowrap">{formatTo12Hour(day.slots[0].open)} - {formatTo12Hour(day.slots[0].close)}</span>
                            ) : '-'}
                          </div>
                          <div className="text-center text-red-500 font-medium">
                            {day.slots?.length > 1 ? (
                              <span className="whitespace-nowrap">{formatTo12Hour(day.slots[0].close)} - {formatTo12Hour(day.slots[1].open)}</span>
                            ) : '-'}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-center text-gray-400">Closed</span>
                          <span className="text-center text-gray-400">-</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== TESTIMONIALS - FULL WIDTH ==================== */}
      {(testimonials.length > 0 || reviews.length > 0) && (
        <section className="py-16 bg-gray-50">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                <Star className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>Reviews</span>
              </div>
              <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">What Our Customers Say</h3>
              <p className="text-gray-500 mt-2">Real experiences from real customers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[...testimonials, ...reviews].slice(0, 8).map((review: any, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-5 w-5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">"{review.reviewText || review.comment}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {review.customerPhoto ? (
                        <img src={review.customerPhoto} alt={review.customerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                          {review.customerName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{review.customerName}</p>
                      {review.customerLocation && (
                        <p className="text-sm text-gray-500">{review.customerLocation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== FAQs SECTION - FULL WIDTH ==================== */}
      {faqs.length > 0 && (
        <section ref={faqRef} className="py-16 bg-white">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                  <HelpCircle className="h-5 w-5" style={{ color: primaryColor }} />
                  <span className="text-sm font-semibold" style={{ color: primaryColor }}>FAQs</span>
                </div>
                <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Frequently Asked Questions</h3>
                <p className="text-gray-500 mt-2">Find answers to common questions</p>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((faq: any, idx: number) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="bg-gray-50 border-0 rounded-2xl px-6 data-[state=open]:shadow-lg transition-shadow">
                    <AccordionTrigger className="text-left font-semibold text-base text-gray-900 hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 leading-relaxed pb-5 pr-8">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SOCIAL LINKS - FULL WIDTH ==================== */}
      {(socialMedia.facebook || socialMedia.instagram || socialMedia.youtube || socialMedia.twitter || socialMedia.linkedin || socialLinks.facebook || socialLinks.instagram) && (
        <section className="py-12 bg-gray-50">
          <div className="w-full px-6 lg:px-12 xl:px-20">
            <div className="text-center mb-8">
              <h3 className="font-bold text-xl text-gray-900">Connect With Us</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {(socialMedia.facebook || socialLinks.facebook) && (
                <a href={socialMedia.facebook || socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-gray-700">Facebook</span>
                </a>
              )}
              {(socialMedia.instagram || socialLinks.instagram) && (
                <a href={socialMedia.instagram || socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <Instagram className="h-6 w-6 text-pink-500" />
                  <span className="font-medium text-gray-700">Instagram</span>
                </a>
              )}
              {(socialMedia.youtube || socialLinks.youtube) && (
                <a href={socialMedia.youtube || socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <Youtube className="h-6 w-6 text-red-600" />
                  <span className="font-medium text-gray-700">YouTube</span>
                </a>
              )}
              {(socialMedia.twitter || socialLinks.twitter) && (
                <a href={socialMedia.twitter || socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <Twitter className="h-6 w-6 text-sky-500" />
                  <span className="font-medium text-gray-700">Twitter</span>
                </a>
              )}
              {(socialMedia.linkedin || socialLinks.linkedin) && (
                <a href={socialMedia.linkedin || socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                  <Linkedin className="h-6 w-6 text-blue-700" />
                  <span className="font-medium text-gray-700">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== CONTACT US SECTION - FULL WIDTH ==================== */}
      <section ref={contactRef} className="py-16 bg-white">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: primaryColor + '15' }}>
                <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>Contact</span>
              </div>
              <h3 className="font-bold text-2xl lg:text-3xl text-gray-900">Get In Touch</h3>
              <p className="text-gray-500 mt-2">We'd love to hear from you</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left - Contact Form */}
              <div className="bg-gray-50 rounded-3xl p-8">
                <h4 className="font-bold text-xl text-gray-900 mb-6">Send us a message</h4>
                <form onSubmit={(e) => { e.preventDefault(); leadMutation.mutate(leadForm); }} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">Your Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      required
                      className="h-12 bg-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="h-12 bg-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+91 XXXXX XXXXX"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      required
                      className="h-12 bg-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      rows={4}
                      className="bg-white rounded-xl"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-xl font-semibold text-base"
                    style={{ backgroundColor: primaryColor }}
                    disabled={leadMutation.isPending}
                  >
                    {leadMutation.isPending ? "Sending..." : "Send Enquiry"}
                  </Button>
                </form>
              </div>
              
              {/* Right - Contact Info */}
              <div className="flex flex-col justify-center">
                <div className="space-y-6">
                  {address && (
                    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 flex-shrink-0">
                        <MapPin className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Visit Us</h5>
                        <p className="text-gray-600">{address}{city && `, ${city}`}{state && `, ${state}`}</p>
                        <button 
                          className="text-sm font-semibold mt-2 flex items-center gap-1.5 hover:gap-2 transition-all"
                          style={{ color: primaryColor }}
                          onClick={() => {
                            // Use Google Maps URL if available, otherwise generate from address
                            if (googleMapsUrl) {
                              window.open(googleMapsUrl, '_blank');
                            } else {
                              const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${pincode ? ` ${pincode}` : ''}`;
                              const encodedAddress = encodeURIComponent(fullAddress);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                            }
                          }}
                        >
                          Get Directions <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {phone && (
                    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 flex-shrink-0">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Call Us</h5>
                        <a href={`tel:${phone}`} className="text-gray-600 hover:underline text-lg">{phone}</a>
                      </div>
                    </div>
                  )}
                  
                  {email && (
                    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 flex-shrink-0">
                        <Mail className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Email Us</h5>
                        <a href={`mailto:${email}`} className="text-gray-600 hover:underline">{email}</a>
                      </div>
                    </div>
                  )}
                  
                  {whatsapp && (
                    <Button 
                      className="w-full h-14 rounded-xl font-semibold text-base gap-3 bg-green-500 hover:bg-green-600"
                      onClick={() => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Chat on WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER - FULL WIDTH ==================== */}
      <footer className="bg-gray-900 text-white">
        {/* Main Footer Content */}
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                {logo ? (
                  <img src={logo} alt={businessName} className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: primaryColor }}>
                    {businessName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-2xl">{businessName}</h3>
                  {category && <p className="text-gray-400">{category}</p>}
                </div>
              </div>
              {about && (
                <p className="text-gray-400 leading-relaxed max-w-md mb-6 line-clamp-3">{about}</p>
              )}
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {phone && (
                  <Button className="h-11 rounded-xl gap-2" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`tel:${phone}`)}>
                    <Phone className="h-4 w-4" />
                    Call Now
                  </Button>
                )}
                {whatsapp && (
                  <Button variant="outline" className="h-11 rounded-xl gap-2 border-green-500 text-green-400 hover:bg-green-500/20" onClick={() => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3">
                {navItems.map((item, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => scrollToSection(item.ref)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
              <ul className="space-y-4">
                {address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400">{address}{city && `, ${city}`}</span>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${phone}`} className="text-gray-400 hover:text-white transition-colors">{phone}</a>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${email}`} className="text-gray-400 hover:text-white transition-colors">{email}</a>
                  </li>
                )}
              </ul>
              
              {/* Social Links */}
              <div className="flex gap-3 mt-6">
                {(socialLinks.facebook || socialMedia.facebook) && (
                  <a href={socialLinks.facebook || socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {(socialLinks.instagram || socialMedia.instagram) && (
                  <a href={socialLinks.instagram || socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-xl flex items-center justify-center transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {(socialLinks.youtube || socialMedia.youtube) && (
                  <a href={socialLinks.youtube || socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
                {(socialLinks.twitter || socialMedia.twitter) && (
                  <a href={socialLinks.twitter || socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-sky-500 rounded-xl flex items-center justify-center transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800">
          <div className="w-full px-6 lg:px-12 xl:px-20 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} {businessName}. All rights reserved.
              </p>
              
              {/* Vyora Branding */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Powered by</span>
                <a 
                  href="https://vyora.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold">V</div>
                  Vyora
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== SERVICE DETAIL DIALOG ==================== */}
      <MiniWebsiteServiceDetailDialog
        open={serviceDetailOpen}
        onOpenChange={setServiceDetailOpen}
        service={selectedService}
        primaryColor={primaryColor}
        onAddToCart={ecommerce.enabled ? (service) => {
          addToCart({
            type: 'service',
            id: service.id,
            name: service.name,
            price: service.sellingPrice || service.basePrice || 0,
            quantity: 1,
            image: service.images?.[0],
            vendorCatalogueId: service.id,
          });
          setServiceDetailOpen(false);
        } : undefined}
      />

      {/* ==================== PRODUCT DETAIL DIALOG ==================== */}
      {selectedProduct && (
        <ProductDetailDialog
          open={productDetailOpen}
          onOpenChange={setProductDetailOpen}
          product={selectedProduct}
          primaryColor={primaryColor}
          showAddToCart={ecommerce.enabled}
          onAddToCart={(quantity) => {
            if (selectedProduct) {
              addToCart({
                type: 'product',
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.sellingPrice || selectedProduct.price,
                quantity,
                image: selectedProduct.images?.[0],
                vendorProductId: selectedProduct.id,
              });
              setProductDetailOpen(false);
            }
          }}
        />
      )}

      {/* ==================== QUOTATION MODAL ==================== */}
      <QuotationModal
        open={quotationModalOpen}
        onOpenChange={setQuotationModalOpen}
        items={cart}
        subdomain={subdomain}
        primaryColor={primaryColor}
        customerToken={customerToken}
        onSuccess={() => {
          setCart([]);
          localStorage.removeItem(`cart_${subdomain}`);
        }}
      />
    </div>
  );
}
