import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, Home, Plus, Minus, Tag, 
  User, LogOut, ArrowLeft, Clock, Package, Image, BookOpen,
  ChevronLeft, ChevronRight, MapPin, Calendar, Star, Check, X, Info, Shield,
  BadgeCheck, Sparkles, RefreshCw, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { MiniWebsite, VendorCatalogue } from "@shared/schema";
import { QuotationModal } from "@/components/QuotationModal";

interface CartItem {
  type: 'service';
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorServiceId: string;
}

// Amenity icons mapping
const AMENITY_ICONS: Record<string, any> = {
  wifi: Shield,
  parking: Shield,
  ac: Shield,
  washroom: Shield,
  waiting: Shield,
  water: Shield,
  cctv: Shield,
  power: Shield,
  staff: Shield,
  payment: Shield,
  housekeeping: Shield,
  firstaid: Shield,
  lift: Shield,
  consultation: Shield,
  locker: Shield,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Free Wi-Fi",
  parking: "Parking Space",
  ac: "Air Conditioning",
  washroom: "Clean Washrooms",
  waiting: "Waiting Area",
  water: "Drinking Water",
  cctv: "CCTV / Security",
  power: "Power Backup",
  staff: "Staff Assistance",
  payment: "Online Payment",
  housekeeping: "Housekeeping",
  firstaid: "First Aid",
  lift: "Lift / Elevator",
  consultation: "Free Consultation",
  locker: "Locker Facility",
};

const DAY_ABBREVIATIONS: Record<string, string> = {
  Monday: "M",
  Tuesday: "T",
  Wednesday: "W",
  Thursday: "T",
  Friday: "F",
  Saturday: "S",
  Sunday: "S",
};

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Trust indicators
const TRUST_INDICATORS = [
  { icon: Shield, label: "Secure Payment", color: "text-emerald-600" },
  { icon: BadgeCheck, label: "Verified Provider", color: "text-blue-600" },
  { icon: Star, label: "Quality Assured", color: "text-amber-600" },
  { icon: RefreshCw, label: "Easy Cancellation", color: "text-violet-600" },
];

export default function MiniWebsiteServiceDetail() {
  const [, params] = useRoute("/:subdomain/services/:serviceId");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const serviceId = params?.serviceId || "";
  const { toast } = useToast();

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Customer authentication
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const data = localStorage.getItem("customerData");
    if (token && data && data !== "undefined" && data !== "null") {
      try {
        const parsedData = JSON.parse(data);
        setCustomerToken(token);
        setCustomerData(parsedData);
      } catch (error) {
        console.error("Failed to parse customer data:", error);
      }
    }
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_services_${subdomain}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart:", error);
      }
    }
  }, [subdomain]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`cart_services_${subdomain}`, JSON.stringify(cart));
  }, [cart, subdomain]);

  // Fetch mini-website data
  const { data, isLoading } = useQuery<MiniWebsite & { services: VendorCatalogue[] }>({
    queryKey: [`/api/mini-website/${subdomain}`],
    enabled: !!subdomain,
  });

  const primaryColor = data?.branding?.primaryColor || "#4F46E5";
  const service = data?.services?.find((s: any) => s.id === serviceId);
  const ecommerce = (data?.ecommerce as any) || { enabled: false, mode: 'cart' };

  // Get business info
  const businessName = (data as any)?.businessInfo?.businessName || data?.businessName || subdomain;
  const logo = (data as any)?.businessInfo?.logo || data?.branding?.logoUrl;

  // Service data
  const serviceData = service as any;
  const images = serviceData?.images || [];
  const hasImages = images.length > 0;

  // Calculate pricing
  const basePrice = serviceData?.sellingPrice || serviceData?.basePrice || serviceData?.price || 0;
  const offerPrice = serviceData?.offerPrice;
  const hasDiscount = offerPrice && offerPrice < basePrice;
  const discountPercent = hasDiscount ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;

  // Navigation
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Get duration display
  const getDurationDisplay = () => {
    if (serviceData?.durationType === "fixed" && serviceData?.durationValue) {
      return `${serviceData.durationValue} ${serviceData.durationUnit || "min"}`;
    }
    if (serviceData?.durationType === "variable" && serviceData?.durationMin && serviceData?.durationMax) {
      return `${serviceData.durationMin}-${serviceData.durationMax} ${serviceData.durationUnit || "min"}`;
    }
    if (serviceData?.durationType === "session" && serviceData?.sessionCount) {
      return `${serviceData.sessionCount} sessions`;
    }
    if (serviceData?.duration) {
      return serviceData.duration;
    }
    return null;
  };

  const duration = getDurationDisplay();
  const inclusions = serviceData?.inclusions || [];
  const exclusions = serviceData?.exclusions || [];
  const amenities = serviceData?.amenities || [];
  const customAmenities = serviceData?.customAmenities || [];
  const policies = serviceData?.policies || [];
  const availableDays = serviceData?.availableDays || [];
  const timeSlots = serviceData?.availableTimeSlots || [];

  const allAmenities = [...amenities, ...customAmenities.map((a: string) => ({ custom: true, label: a }))];
  const displayedAmenities = showAllAmenities ? allAmenities : allAmenities.slice(0, 6);

  const description = serviceData?.detailedDescription || serviceData?.shortDescription || service?.description || "";
  const isLongDescription = description.length > 250;

  // Add to cart handler
  const handleAddToCart = () => {
    if (!service) return;

    const existingItem = cart.find(item => item.id === service.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        type: 'service',
        id: service.id,
        name: service.name,
        price: basePrice,
        quantity: 1,
        image: images[0],
        vendorServiceId: service.id,
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${service.name} added to cart`,
    });
    setIsCartOpen(true);
  };

  // Request quote handler
  const handleRequestQuote = () => {
    if (!service) return;
    
    setQuotationItems([{
      type: 'service',
      id: service.id,
      name: service.name,
      price: basePrice,
      quantity: 1,
      vendorServiceId: service.id,
    }]);
    setQuotationOpen(true);
  };

  const updateCartQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== serviceId));
      return;
    }
    setCart(cart.map(item =>
      item.id === serviceId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerData");
    setCustomerToken(null);
    setCustomerData(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white border-b px-4 py-3">
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="w-full aspect-[16/10] max-h-[35vh]" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-24" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!data || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold mb-4 text-gray-900">Service Not Found</h2>
            <p className="text-gray-500 mb-6 text-sm">The service you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation(`/${subdomain}/services`)} style={{ backgroundColor: primaryColor }}>
              Back to Services
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation(`/${subdomain}/services`)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors -ml-1.5"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            {!isMobile && (
              <button
                onClick={() => setLocation(`/${subdomain}`)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {logo ? (
                  <img src={logo} alt={businessName} className="h-8 w-8 rounded-lg object-cover" />
                ) : null}
                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                  {businessName}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-9">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemsCount > 0 && (
                    <span 
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartItemsCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Cart ({cartItemsCount})</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                        {cart.map((item, index) => (
                          <Card key={`${item.id}-${index}`} className="border-0 shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex gap-3">
                                {item.image && (
                                  <img 
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm mb-1 truncate">{item.name}</h4>
                                  <p className="text-xs text-gray-500 mb-2">₹{item.price}</p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex justify-between text-base font-bold">
                          <span>Total:</span>
                          <span style={{ color: primaryColor }}>₹{cartTotal}</span>
                        </div>
                        <Button 
                          className="w-full h-11" 
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => setLocation(`/${subdomain}/checkout`)}
                        >
                          Proceed to Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* User Menu - Desktop */}
            {!isMobile && ecommerce.mode !== 'quotation' && (
              customerData ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 h-9">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">{customerData.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">
                      {customerData.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation(`/${subdomain}/my-orders`)} className="text-sm">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-sm">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" className="h-9" onClick={() => setLocation(`/${subdomain}/login`)}>
                  Login
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white lg:bg-transparent">
        <div className="max-w-6xl mx-auto">
          {/* Hero Image - Reduced Height */}
          <div className="relative bg-gray-900">
            {hasImages ? (
              <div className="relative aspect-[16/10] md:aspect-[21/9] max-h-[35vh] overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image Indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          currentImageIndex === index
                            ? "bg-white w-6"
                            : "bg-white/50 w-1.5 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-gray-800 hover:bg-white shadow-sm backdrop-blur-sm border-0 text-xs font-medium">
                    {service.category}
                  </Badge>
                </div>

                {/* Verified Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2 py-1 shadow-lg text-xs">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>

                {/* Title on Image (Mobile) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
                  <h1 className="text-xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                    {service.name}
                  </h1>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-xs">4.8</span>
                      <span className="text-white/70 text-xs">(2.5K)</span>
                    </div>
                    {duration && (
                      <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[16/10] md:aspect-[21/9] max-h-[30vh] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 30%, ${primaryColor}, transparent 50%)` }} />
                <div className="text-center relative z-10">
                  <div className="text-7xl mb-3">{service.icon || "✨"}</div>
                  <Badge className="bg-emerald-500 text-white gap-1 px-2 py-1 text-xs">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 bg-white lg:bg-transparent">
              {/* Title - Desktop */}
              <div className="hidden md:block p-6 pb-4 bg-white lg:rounded-xl lg:mt-4 lg:shadow-sm lg:border">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 mb-3">
                  {service.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-amber-700 text-xs">4.8</span>
                    <span className="text-gray-500 text-xs">(2.5K)</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {serviceData.deliveryModes?.includes("home-service") 
                        ? "Home & Business" 
                        : "Business Location"}
                    </span>
                  </div>
                  {duration && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Clock className="h-4 w-4" />
                        <span>{duration}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pricing Card - Mobile */}
              <div className="p-4 lg:hidden">
                <div className="p-4 rounded-xl border" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)`, borderColor: `${primaryColor}25` }}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                      ₹{hasDiscount ? offerPrice : basePrice}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-base text-gray-400 line-through">₹{basePrice}</span>
                        <Badge className="bg-red-500 text-white text-xs">{discountPercent}% OFF</Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                </div>
              </div>

              {/* Availability */}
              {(availableDays.length > 0 || timeSlots.length > 0) && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <Calendar className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                        </div>
                        Availability
                      </h3>
                      
                      {availableDays.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">Available Days</p>
                          <div className="flex gap-1">
                            {ALL_DAYS.map((day) => (
                              <div
                                key={day}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center ${
                                  availableDays.includes(day)
                                    ? "text-white"
                                    : "bg-gray-100 text-gray-400 line-through"
                                }`}
                                style={availableDays.includes(day) ? { backgroundColor: primaryColor } : {}}
                              >
                                {DAY_ABBREVIATIONS[day]}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {timeSlots.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Time Slots</p>
                          <div className="flex flex-wrap gap-1.5">
                            {timeSlots.slice(0, 6).map((slot: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs font-normal py-1">
                                {slot}
                              </Badge>
                            ))}
                            {timeSlots.length > 6 && (
                              <Badge variant="secondary" className="text-xs">+{timeSlots.length - 6}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* About This Service */}
              {description && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border overflow-hidden">
                    <Collapsible open={isDescriptionExpanded} onOpenChange={setIsDescriptionExpanded}>
                      <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                                <Info className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                              </div>
                              About This Service
                            </h3>
                            {isLongDescription && (
                              isDescriptionExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <div className="mt-3">
                          <p className={`text-sm text-gray-600 leading-relaxed whitespace-pre-wrap ${!isDescriptionExpanded && isLongDescription ? 'line-clamp-3' : ''}`}>
                            {description}
                          </p>
                          {isLongDescription && (
                            <button 
                              className="text-xs font-medium mt-2"
                              style={{ color: primaryColor }}
                            >
                              {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Collapsible>
                  </Card>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {inclusions.length > 0 && (
                      <Card className="border-0 shadow-sm lg:border">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-xs text-emerald-700 flex items-center gap-1.5 mb-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            What's Included
                          </h3>
                          <ul className="space-y-1.5">
                            {inclusions.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {exclusions.length > 0 && (
                      <Card className="border-0 shadow-sm lg:border">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-xs text-red-700 flex items-center gap-1.5 mb-3">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <X className="h-3 w-3 text-red-600" />
                            </div>
                            Not Included
                          </h3>
                          <ul className="space-y-1.5">
                            {exclusions.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-xs">
                                <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {allAmenities.length > 0 && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <Sparkles className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                        </div>
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {displayedAmenities.map((amenity: any, index: number) => {
                          const isCustom = typeof amenity === 'object' && amenity.custom;
                          const amenityId = isCustom ? null : amenity;
                          const Icon = amenityId ? AMENITY_ICONS[amenityId] || Sparkles : Sparkles;
                          const label = isCustom ? amenity.label : (amenityId ? AMENITY_LABELS[amenityId] || amenityId : amenity);
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                            >
                              <Icon className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                              <span className="text-xs text-gray-700 line-clamp-1">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {allAmenities.length > 6 && (
                        <button
                          onClick={() => setShowAllAmenities(!showAllAmenities)}
                          className="mt-2 text-xs font-medium flex items-center gap-1"
                          style={{ color: primaryColor }}
                        >
                          {showAllAmenities ? (
                            <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                          ) : (
                            <>+{allAmenities.length - 6} More <ChevronDown className="h-3.5 w-3.5" /></>
                          )}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                <div className="grid grid-cols-4 gap-2">
                  {TRUST_INDICATORS.map((item, index) => (
                    <div key={index} className="text-center p-2.5 rounded-lg bg-white lg:bg-gray-50 shadow-sm lg:shadow-none">
                      <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
                      <p className="text-[10px] font-medium text-gray-600 line-clamp-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              {policies.length > 0 && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <AlertCircle className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                        </div>
                        Policies
                      </h3>
                      <div className="space-y-2">
                        {policies.map((policy: any, index: number) => (
                          <div key={index} className="p-2.5 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-xs text-gray-800 mb-0.5">{policy.title}</h4>
                            <p className="text-[11px] text-gray-500">{policy.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Right Column - Sticky Pricing (Desktop) */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-16 p-4 lg:pt-4">
                <Card className="overflow-hidden shadow-lg border-0">
                  {/* Price Header */}
                  <div className="p-5 border-b" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)` }}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                        ₹{hasDiscount ? offerPrice : basePrice}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-lg text-gray-400 line-through">₹{basePrice}</span>
                          <Badge className="bg-red-500 text-white text-xs">{discountPercent}% OFF</Badge>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="p-5 space-y-3">
                    {ecommerce.mode !== 'quotation' && (
                      <Button 
                        size="lg" 
                        className="w-full h-12 text-base font-semibold"
                        style={{ backgroundColor: primaryColor }}
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                    {(ecommerce.mode === 'quotation' || ecommerce.mode === 'both') && (
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full h-12 text-base"
                        onClick={handleRequestQuote}
                      >
                        <Tag className="h-5 w-5 mr-2" />
                        Request Quote
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-40 safe-area-pb">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                ₹{hasDiscount ? offerPrice : basePrice}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-400 line-through">₹{basePrice}</span>
                  <Badge className="bg-red-500 text-white text-[10px] h-5">{discountPercent}% OFF</Badge>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-500">Inclusive of all taxes</p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {(ecommerce.mode === 'quotation' || ecommerce.mode === 'both') && (
              <Button 
                variant="outline" 
                size="sm"
                className="h-10"
                onClick={handleRequestQuote}
              >
                <Tag className="h-4 w-4" />
              </Button>
            )}
            {ecommerce.mode !== 'quotation' && (
              <Button 
                size="sm"
                className="h-10 px-5 text-sm font-semibold"
                style={{ backgroundColor: primaryColor }}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quotation Modal */}
      <QuotationModal
        open={quotationOpen}
        onOpenChange={setQuotationOpen}
        items={quotationItems}
        subdomain={subdomain || ""}
        primaryColor={primaryColor}
        customerToken={customerToken}
        onSuccess={() => {
          setQuotationItems([]);
        }}
      />
    </div>
  );
}
