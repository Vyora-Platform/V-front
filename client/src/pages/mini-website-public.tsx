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
  
  // Store vendorId and subdomain in localStorage when data is available
  useEffect(() => {
    if (data && subdomain) {
      // Store subdomain
      localStorage.setItem('subdomain', subdomain);
      
      // Store vendorId if available
      if (data.vendorId) {
        localStorage.setItem('vendorId', data.vendorId);
      }
      
      // Store mini website ID if available
      if (data.id) {
        localStorage.setItem('miniWebsiteId', data.id);
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
            
            {/* 4 CTA Buttons - 2x2 Grid */}
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                {phone && (
                  <button 
                    onClick={() => window.open(`tel:${phone}`)}
                    className="flex items-center justify-center gap-2 h-12 bg-green-500 rounded-xl text-white active:opacity-90 transition-opacity"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="text-sm font-medium">Call Now</span>
                  </button>
                )}
                
                {googleMapsUrl && (
                  <button 
                    onClick={() => window.open(googleMapsUrl, '_blank')}
                    className="flex items-center justify-center gap-2 h-12 bg-blue-500 rounded-xl text-white active:opacity-90 transition-opacity"
                  >
                    <Navigation className="h-5 w-5" />
                    <span className="text-sm font-medium">Directions</span>
                  </button>
                )}
                
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
            
            {/* Team */}
            {(team.length > 0 || owners.length > 0) && (
              <div className="bg-white px-4 py-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 text-center">
                  Our Team
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...owners, ...team].slice(0, 6).map((member: any, idx: number) => (
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
            {(team.length > 0 || owners.length > 0) && (
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

  // ==================== DESKTOP VIEW (UNCHANGED) ====================
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: branding.fontFamily || "Inter, sans-serif" }}>
      {/* ==================== HEADER NAVIGATION ==================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection(heroRef)}>
              {logo ? (
                <img src={logo} alt={businessName} className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: primaryColor }}>
                  {businessName.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg md:text-xl" style={{ color: primaryColor }}>{businessName}</h1>
                {tagline && <p className="text-xs text-muted-foreground line-clamp-1">{tagline}</p>}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(item.ref)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Cart Button */}
              {ecommerce.enabled && (
                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs" style={{ backgroundColor: primaryColor }}>
                          {cartItemCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Your Cart ({cartItemCount})</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Your cart is empty</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <Card key={`${item.type}-${item.id}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />}
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">₹{item.price}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.type, -1)}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.type, 1)}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="font-semibold">₹{item.price * item.quantity}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                    {cart.length > 0 && (
                      <div className="mt-6 space-y-4 border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span style={{ color: primaryColor }}>₹{cartTotal}</span>
                        </div>
                        <Button className="w-full" style={{ backgroundColor: primaryColor }} onClick={() => setLocation(`/${subdomain}/checkout`)}>
                          Proceed to Checkout
                        </Button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              )}

              {/* CTA Buttons */}
              {phone && (
                <Button size="sm" className="hidden md:flex gap-2" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`tel:${phone}`)}>
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
              )}
              {whatsapp && (
                <Button size="sm" variant="outline" className="hidden md:flex gap-2 border-green-500 text-green-600 hover:bg-green-50" onClick={() => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)}>
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle>{businessName}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-8 space-y-4">
                    {navItems.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToSection(item.ref)}
                        className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 font-medium"
                      >
                        {item.label}
                      </button>
                    ))}
                    <Separator />
                    {phone && (
                      <Button className="w-full gap-2" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`tel:${phone}`)}>
                        <Phone className="h-4 w-4" />
                        Call Now
                      </Button>
                    )}
                    {whatsapp && (
                      <Button variant="outline" className="w-full gap-2 border-green-500 text-green-600" onClick={() => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)}>
                        <MessageCircle className="h-4 w-4" />
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

      {/* ==================== HERO SECTION ==================== */}
      <section ref={heroRef} className="relative min-h-[60vh] md:min-h-[80vh] flex items-center">
        {/* Background */}
        {heroMedia.length > 0 ? (
          <div className="absolute inset-0">
            {heroMedia.map((media, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              >
                <img src={media} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              </div>
            ))}
            {/* Carousel Controls */}
            {heroMedia.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + heroMedia.length) % heroMedia.length)}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % heroMedia.length)}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {heroMedia.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-white' : 'bg-white/50'}`}
                      onClick={() => setCurrentSlide(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
        )}

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            {category && (
              <Badge className="mb-4 text-sm" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                {category}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {businessName}
            </h1>
            {tagline && (
              <p className="text-xl md:text-2xl text-white/90 mb-8">{tagline}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {ctaButtons.length > 0 ? (
                ctaButtons.map((cta, idx) => (
                  <Button
                    key={idx}
                    size="lg"
                    variant={cta.style === 'outline' ? 'outline' : 'default'}
                    className={cta.style === 'outline' ? 'border-white text-white hover:bg-white/10' : ''}
                    style={cta.style !== 'outline' ? { backgroundColor: primaryColor } : {}}
                    onClick={() => {
                      if (cta.action === 'call') window.open(`tel:${phone}`);
                      else if (cta.action === 'whatsapp') window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`);
                      else if (cta.action === 'enquiry') scrollToSection(contactRef);
                    }}
                  >
                    {cta.label}
                  </Button>
                ))
              ) : (
                <>
                  {phone && (
                    <Button size="lg" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`tel:${phone}`)}>
                      <Phone className="h-5 w-5 mr-2" />
                      Call Us Now
                    </Button>
                  )}
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => scrollToSection(contactRef)}>
                    Get In Touch
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TRUST NUMBERS ==================== */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {yearsInBusiness > 0 && (
              <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Award className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>{yearsInBusiness}+</p>
                <p className="text-sm text-muted-foreground">Years Experience</p>
              </div>
            )}
            {totalReviews > 0 && (
              <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Star className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>{avgRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">{totalReviews} Reviews</p>
              </div>
            )}
            {services.length > 0 && (
              <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Briefcase className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>{services.length}+</p>
                <p className="text-sm text-muted-foreground">Services</p>
              </div>
            )}
            {products.length > 0 && (
              <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Package className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>{products.length}+</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            )}
            {!yearsInBusiness && totalReviews === 0 && (
              <>
                <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Users className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-3xl font-bold" style={{ color: primaryColor }}>500+</p>
                  <p className="text-sm text-muted-foreground">Happy Clients</p>
                </div>
                <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                    <CheckCircle2 className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-3xl font-bold" style={{ color: primaryColor }}>100%</p>
                  <p className="text-sm text-muted-foreground">Quality Assured</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ==================== OFFERS & COUPONS ==================== */}
      {coupons.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: accentColor, color: 'white' }}>
                <Tag className="h-3 w-3 mr-1" />
                Special Offers
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Exclusive Deals For You</h2>
              <p className="text-muted-foreground mt-2">Don't miss out on these amazing offers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.filter((c: any) => c.isActive).slice(0, 6).map((coupon: any, idx: number) => (
                <Card key={idx} className="overflow-hidden border-2 border-dashed border-amber-300 bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-800">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </Badge>
                        <h3 className="font-bold text-lg">{coupon.title}</h3>
                      </div>
                      {coupon.image && (
                        <img src={coupon.image} alt="" className="w-16 h-16 rounded object-cover" />
                      )}
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-muted-foreground mb-4">{coupon.description}</p>
                    )}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <code className="font-mono font-bold text-lg" style={{ color: primaryColor }}>{coupon.code}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          toast({ title: "Copied!", description: `Code ${coupon.code} copied to clipboard` });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    {(coupon.validUntil || coupon.termsAndConditions) && (
                      <div className="mt-4 text-xs text-muted-foreground">
                        {coupon.validUntil && <p>Valid till: {new Date(coupon.validUntil).toLocaleDateString()}</p>}
                        {coupon.termsAndConditions && <p className="mt-1">*{coupon.termsAndConditions}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== PRODUCTS SECTION ==================== */}
      {products.length > 0 && (
        <section ref={productsRef} className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Package className="h-3 w-3 mr-1" />
                Our Products
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Explore Our Products</h2>
              <p className="text-muted-foreground mt-2">Quality products at the best prices</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 8).map((product: any) => (
                <Card 
                  key={product.id} 
                  className="group overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setLocation(`/${subdomain}/products/${product.id}`)}
                >
                  <div className="relative aspect-square bg-gray-100">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">{product.icon || "📦"}</span>
                      </div>
                    )}
                    {product.stock === 0 && (
                      <Badge variant="destructive" className="absolute top-2 left-2">Out of Stock</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="outline" className="text-xs mb-2">{product.category}</Badge>
                    <h3 className="font-semibold line-clamp-2 mb-2">{product.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color: primaryColor }}>₹{product.price}</span>
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-sm text-muted-foreground line-through">₹{product.mrp}</span>
                      )}
                    </div>
                    {ecommerce.enabled && product.stock > 0 && (
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        style={{ backgroundColor: primaryColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            type: 'product',
                            id: product.id,
                            name: product.name,
                            price: product.price,
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
                  </CardContent>
                </Card>
              ))}
            </div>
            {products.length > 8 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" onClick={() => setLocation(`/${subdomain}/products`)}>
                  View All Products
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== SERVICES SECTION ==================== */}
      {services.length > 0 && (
        <section ref={servicesRef} className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Briefcase className="h-3 w-3 mr-1" />
                Our Services
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">What We Offer</h2>
              <p className="text-muted-foreground mt-2">Professional services tailored to your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((service: any) => (
                <Card 
                  key={service.id} 
                  className="group overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedService(service);
                    setServiceDetailOpen(true);
                  }}
                >
                  <div className="relative h-48 bg-gray-100">
                    {service.images?.[0] ? (
                      <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` }}>
                        <span className="text-5xl">{service.icon || "✨"}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <Badge variant="outline" className="text-xs mb-2">{service.category}</Badge>
                    <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold" style={{ color: primaryColor }}>₹{service.sellingPrice || service.basePrice}</span>
                        {service.duration && <span className="text-sm text-muted-foreground ml-1">/ {service.duration}</span>}
                      </div>
                      <Button size="sm" variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {services.length > 6 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" onClick={() => setLocation(`/${subdomain}/services`)}>
                  View All Services
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== GALLERY SECTION ==================== */}
      {allGalleryImages.length > 0 && (
        <section ref={galleryRef} className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <ImageIcon className="h-3 w-3 mr-1" />
                Gallery
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Our Work & Space</h2>
              <p className="text-muted-foreground mt-2">A glimpse of what we do</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allGalleryImages.slice(0, 8).map((image, idx) => (
                <div 
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setFullscreenImage(image);
                    setFullscreenImageIndex(idx);
                  }}
                >
                  <img src={image} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Zap className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* ==================== ABOUT US SECTION ==================== */}
      <section ref={aboutRef} className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Info className="h-3 w-3 mr-1" />
              About Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Know More About {businessName}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* About Content */}
            <div>
              {about ? (
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{about}</p>
              ) : (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Welcome to {businessName}! We are dedicated to providing the best {category || 'services'} in {city || 'your area'}. 
                  Our team of professionals is committed to delivering exceptional quality and customer satisfaction.
                </p>
              )}
              
              {yearFounded && (
                <div className="mt-6 p-4 bg-white rounded-xl inline-block">
                  <p className="text-sm text-muted-foreground">Established</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>{yearFounded}</p>
                </div>
              )}
            </div>

            {/* Team / Owners */}
            {(team.length > 0 || owners.length > 0) && (
              <div>
                <h3 className="text-xl font-bold mb-6">Our Team</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[...owners, ...team].slice(0, 4).map((member: any, idx) => (
                    <Card key={idx} className="text-center p-4">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-200">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                            {member.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold">{member.name}</h4>
                      <p className="text-sm text-muted-foreground">{member.designation || member.role}</p>
                      {member.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== BUSINESS HOURS ==================== */}
      {workingHours.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Clock className="h-3 w-3 mr-1" />
                Business Hours
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">When We're Open</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  {workingHours.map((day: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between py-3 ${idx !== workingHours.length - 1 ? 'border-b' : ''}`}
                    >
                      <span className="font-medium">{day.day}</span>
                      {day.isOpen ? (
                        <div className="text-right">
                          {day.slots?.map((slot: any, slotIdx: number) => (
                            <div key={slotIdx} className="flex items-center gap-2">
                              <span className="text-sm" style={{ color: primaryColor }}>{formatTo12Hour(slot.open)} - {formatTo12Hour(slot.close)}</span>
                              {slotIdx < (day.slots?.length || 0) - 1 && (
                                <span className="text-xs text-muted-foreground">(Break)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ==================== TESTIMONIALS ==================== */}
      {(testimonials.length > 0 || reviews.length > 0) && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Star className="h-3 w-3 mr-1" />
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">What Our Customers Say</h2>
              <p className="text-muted-foreground mt-2">Real feedback from real customers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...testimonials, ...reviews].slice(0, 6).map((review: any, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {review.customerPhoto ? (
                        <img src={review.customerPhoto} alt={review.customerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                          {review.customerName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{review.customerName}</p>
                      {review.customerLocation && (
                        <p className="text-sm text-muted-foreground">{review.customerLocation}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{review.reviewText || review.comment}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== FAQs SECTION ==================== */}
      {faqs.length > 0 && (
        <section ref={faqRef} className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <HelpCircle className="h-3 w-3 mr-1" />
                FAQs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground mt-2">Find answers to common questions</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((faq: any, idx: number) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="bg-white rounded-xl px-6 border">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {/* ==================== CONTACT US SECTION ==================== */}
      <section ref={contactRef} className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Mail className="h-3 w-3 mr-1" />
              Contact Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Get In Touch</h2>
            <p className="text-muted-foreground mt-2">We'd love to hear from you</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6">
              {address && (
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                      <MapPin className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Address</h3>
                      <p className="text-muted-foreground">
                        {address}{city && `, ${city}`}{state && `, ${state}`}{pincode && ` - ${pincode}`}
                      </p>
                      {googleMapsUrl && (
                        <Button variant="link" className="p-0 h-auto mt-2" style={{ color: primaryColor }} onClick={() => window.open(googleMapsUrl)}>
                          View on Maps <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              
              {phone && (
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Phone className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <a href={`tel:${phone}`} className="text-muted-foreground hover:underline">{phone}</a>
                    </div>
                  </div>
                </Card>
              )}
              
              {email && (
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Mail className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <a href={`mailto:${email}`} className="text-muted-foreground hover:underline">{email}</a>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Lead Form */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-6">Send Enquiry</h3>
              <form onSubmit={(e) => { e.preventDefault(); leadMutation.mutate(leadForm); }} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="Your phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={leadForm.message}
                    onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                    placeholder="How can we help you?"
                    rows={4}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  style={{ backgroundColor: primaryColor }}
                  disabled={leadMutation.isPending}
                >
                  {leadMutation.isPending ? "Sending..." : "Send Enquiry"}
                  <Send className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {logo ? (
                  <img src={logo} alt={businessName} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center text-xl font-bold" style={{ backgroundColor: primaryColor }}>
                    {businessName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{businessName}</h3>
                  {category && <p className="text-sm text-gray-400">{category}</p>}
                </div>
              </div>
              {about && <p className="text-gray-400 text-sm line-clamp-3">{about}</p>}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navItems.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => scrollToSection(item.ref)}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{address}{city && `, ${city}`}</span>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href={`tel:${phone}`} className="hover:text-white">{phone}</a>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
                  </li>
                )}
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-3">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-blue-600 rounded-full transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-pink-600 rounded-full transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-sky-500 rounded-full transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-blue-700 rounded-full transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-red-600 rounded-full transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
              
              {/* CTA Buttons */}
              <div className="mt-6 space-y-2">
                {phone && (
                  <Button size="sm" className="w-full" style={{ backgroundColor: primaryColor }} onClick={() => window.open(`tel:${phone}`)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                )}
                {whatsapp && (
                  <Button size="sm" variant="outline" className="w-full border-green-500 text-green-400 hover:bg-green-500/10" onClick={() => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-10 bg-gray-800" />

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
                className="flex items-center gap-1 font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <Globe className="h-4 w-4" />
                Vyora
              </a>
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

      {/* Desktop-only floating CTA - mobile uses separate UI */}
    </div>
  );
}
