import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Calendar,
  Check,
  X,
  Star,
  Shield,
  Wifi,
  Car,
  Thermometer,
  Bath,
  Users,
  GlassWater,
  Zap,
  HeartPulse,
  UserCheck,
  CreditCard,
  SprayCan,
  MessageCircle,
  Lock,
  Sparkles,
  Package,
  ArrowLeft,
  Share2,
  Bookmark,
  Info,
  Building2,
  Home,
  Tag,
  BadgeCheck,
  ShoppingCart,
  PhoneCall,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ServiceDescriptionPageProps {
  service: any;
  primaryColor?: string;
  isPreview?: boolean;
  onClose?: () => void;
  onBook?: () => void;
  showBookingSection?: boolean;
  isLoading?: boolean;
}

// Amenity icons mapping with proper icons
const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  ac: Thermometer,
  washroom: Bath,
  waiting: Users,
  water: GlassWater,
  cctv: Shield,
  power: Zap,
  staff: UserCheck,
  payment: CreditCard,
  housekeeping: SprayCan,
  firstaid: HeartPulse,
  lift: Building2,
  consultation: MessageCircle,
  locker: Lock,
};

// Amenity labels mapping
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

// Day abbreviations
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

export default function ServiceDescriptionPage({
  service,
  primaryColor = "#6366f1",
  isPreview = false,
  onClose,
  onBook,
  showBookingSection = true,
  isLoading = false,
}: ServiceDescriptionPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background border-b px-4 py-3">
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="w-full aspect-[16/9] max-h-[40vh]" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const images = service.images || [];
  const hasImages = images.length > 0;
  
  // Calculate pricing
  const basePrice = service.basePrice || service.price || 0;
  const offerPrice = service.offerPrice;
  const hasDiscount = offerPrice && offerPrice < basePrice;
  const discountPercent = hasDiscount ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;

  // Get duration display
  const getDurationDisplay = () => {
    if (service.durationType === "fixed" && service.durationValue) {
      return `${service.durationValue} ${service.durationUnit || "min"}`;
    }
    if (service.durationType === "variable" && service.durationMin && service.durationMax) {
      return `${service.durationMin}-${service.durationMax} ${service.durationUnit || "min"}`;
    }
    if (service.durationType === "session" && service.sessionCount) {
      return `${service.sessionCount} sessions`;
    }
    if (service.durationType === "project" && service.durationMin && service.durationMax) {
      return `${service.durationMin}-${service.durationMax} days`;
    }
    if (service.durationType === "long" && service.durationValue) {
      return `${service.durationValue} ${service.durationUnit || "days"}`;
    }
    return null;
  };

  // Get pricing type display
  const getPricingTypeDisplay = () => {
    const types: Record<string, string> = {
      "per-service": "Per Service",
      "price-range": "Price Range",
      "hourly": "Per Hour",
      "daily": "Per Day",
      "weekly": "Per Week",
      "monthly": "Per Month",
      "per-session": "Per Session",
      "per-person": "Per Person",
      "package": "Package",
    };
    return types[service.pricingType] || "";
  };

  const duration = getDurationDisplay();
  const availableDays = service.availableDays || [];
  const timeSlots = service.availableTimeSlots || [];
  const amenities = service.amenities || [];
  const customAmenities = service.customAmenities || [];
  const inclusions = service.inclusions || [];
  const exclusions = service.exclusions || [];
  const policies = service.policies || [];
  const inventoryItems = service.inventoryItems || [];

  const allAmenities = [...amenities, ...customAmenities.map((a: string) => ({ custom: true, label: a }))];
  const displayedAmenities = showAllAmenities ? allAmenities : allAmenities.slice(0, 8);

  // Next/Prev image handlers
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Description text
  const description = service.detailedDescription || service.description || "";
  const shortDescription = service.shortDescription || "";
  const isLongDescription = description.length > 300;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      {/* Compact Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-6xl mx-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-1">
            {isPreview && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs mr-2">
                Preview
              </Badge>
            )}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-full transition-all ${
                isSaved 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">
        {/* Hero Image Section - Reduced Height */}
        <div className="relative bg-gray-900">
          {hasImages ? (
            <div className="relative aspect-[16/10] md:aspect-[21/9] max-h-[35vh] md:max-h-[40vh] overflow-hidden">
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
                  {images.map((_: any, index: number) => (
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

              {/* Category & Rating Badge on Image */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <Badge className="bg-white/90 text-gray-800 hover:bg-white shadow-sm backdrop-blur-sm border-0 text-xs font-medium">
                  {service.category}
                </Badge>
                {service.subcategory && (
                  <Badge variant="outline" className="bg-white/90 text-gray-700 border-0 backdrop-blur-sm text-xs">
                    {service.subcategory}
                  </Badge>
                )}
              </div>

              {/* Verified Badge */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2 py-1 shadow-lg text-xs">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              </div>

              {/* Title & Rating on Image (Mobile) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
                <h1 className="text-xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                  {service.name}
                </h1>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">4.8</span>
                    <span className="text-white/70">(2.5K)</span>
                  </div>
                  {duration && (
                    <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/10] md:aspect-[21/9] max-h-[35vh] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 30%, ${primaryColor}, transparent 50%)` }} />
              <div className="text-center relative z-10">
                <div className="text-7xl mb-3">{service.icon || "💼"}</div>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2 py-1 text-xs">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6">
            {/* Left Column - Service Details */}
            <div className="lg:col-span-2 bg-white dark:bg-card lg:bg-transparent">
              {/* Service Header - Desktop */}
              <div className="hidden md:block p-6 pb-4 bg-white dark:bg-card lg:rounded-xl lg:mt-4 lg:shadow-sm lg:border">
                <div className="space-y-3">
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {service.name}
                  </h1>
                  
                  {/* Rating & Location */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-amber-700 dark:text-amber-400">4.8</span>
                      <span className="text-gray-500">(2.5K reviews)</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {service.deliveryModes?.includes("home-service") 
                          ? "At Business & Home" 
                          : "At Business Location"}
                      </span>
                    </div>
                    {duration && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{duration}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="p-4 lg:p-0 lg:mt-4">
                <div className="grid grid-cols-3 gap-2 lg:hidden">
                  {duration && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-3 text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1" style={{ color: primaryColor }} />
                        <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-white">{duration}</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3 text-center">
                      <MapPin className="h-5 w-5 mx-auto mb-1" style={{ color: primaryColor }} />
                      <p className="text-[10px] text-gray-500 mb-0.5">Location</p>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white">
                        {service.deliveryModes?.includes("home-service") ? "Home & Business" : "Business"}
                      </p>
                    </CardContent>
                  </Card>
                  {service.inventoryType === "limited" && inventoryItems.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-3 text-center">
                        <Package className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                        <p className="text-[10px] text-gray-500 mb-0.5">Stock</p>
                        <p className="text-xs font-semibold text-emerald-600">
                          {inventoryItems.filter((i: any) => i.available).length} left
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* About This Service - Collapsible */}
              {(description || shortDescription) && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border lg:shadow-sm overflow-hidden">
                    <Collapsible open={isDescriptionExpanded} onOpenChange={setIsDescriptionExpanded}>
                      <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                                <Info className="h-4 w-4" style={{ color: primaryColor }} />
                              </div>
                              About This Service
                            </h2>
                            {isLongDescription && (
                              isDescriptionExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <div className="mt-3">
                          {shortDescription && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                              {shortDescription}
                            </p>
                          )}
                          
                          {isLongDescription ? (
                            <>
                              <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                                {description}
                              </p>
                              <CollapsibleContent>
                                {/* Content shown when expanded is handled by line-clamp removal */}
                              </CollapsibleContent>
                              <button 
                                className="text-sm font-medium mt-2"
                                style={{ color: primaryColor }}
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                              >
                                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                              </button>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                              {description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Collapsible>
                  </Card>
                </div>
              )}

              {/* What's Included / Not Included */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    {inclusions.length > 0 && (
                      <Card className="border-0 shadow-sm lg:border overflow-hidden">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            What's Included
                          </h3>
                          <ul className="space-y-2">
                            {inclusions.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {exclusions.length > 0 && (
                      <Card className="border-0 shadow-sm lg:border overflow-hidden">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                              <X className="h-3.5 w-3.5 text-red-600" />
                            </div>
                            Not Included
                          </h3>
                          <ul className="space-y-2">
                            {exclusions.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities Section */}
              {allAmenities.length > 0 && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border overflow-hidden">
                    <CardContent className="p-4">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
                        </div>
                        Amenities & Facilities
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {displayedAmenities.map((amenity: any, index: number) => {
                          const isCustom = typeof amenity === 'object' && amenity.custom;
                          const amenityId = isCustom ? null : amenity;
                          const Icon = amenityId ? AMENITY_ICONS[amenityId] || Sparkles : Sparkles;
                          const label = isCustom ? amenity.label : (amenityId ? AMENITY_LABELS[amenityId] || amenityId : amenity);
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                <Icon className="h-4 w-4" style={{ color: primaryColor }} />
                              </div>
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {allAmenities.length > 8 && (
                        <button
                          onClick={() => setShowAllAmenities(!showAllAmenities)}
                          className="mt-3 text-sm font-medium flex items-center gap-1"
                          style={{ color: primaryColor }}
                        >
                          {showAllAmenities ? (
                            <>Show Less <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>Show {allAmenities.length - 8} More <ChevronDown className="h-4 w-4" /></>
                          )}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Trust & Assurance Section */}
              <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                <Card className="border-0 shadow-sm lg:border overflow-hidden">
                  <CardContent className="p-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Shield className="h-4 w-4" style={{ color: primaryColor }} />
                      </div>
                      Trust & Assurance
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TRUST_INDICATORS.map((item, index) => (
                        <div key={index} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <item.icon className={`h-6 w-6 mx-auto mb-1.5 ${item.color}`} />
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Policies */}
              {policies.length > 0 && (
                <div className="px-4 pb-4 lg:px-0 lg:mt-4">
                  <Card className="border-0 shadow-sm lg:border overflow-hidden">
                    <CardContent className="p-4">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                          <AlertCircle className="h-4 w-4" style={{ color: primaryColor }} />
                        </div>
                        Policies
                      </h2>
                      <div className="space-y-3">
                        {policies.map((policy: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-1">{policy.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{policy.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Right Column - Sticky Pricing Card (Desktop) */}
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
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                            {discountPercent}% OFF
                          </Badge>
                        </>
                      )}
                    </div>
                    {getPricingTypeDisplay() && (
                      <p className="text-xs text-gray-500 mt-1">{getPricingTypeDisplay()}</p>
                    )}
                    {service.gstIncluded && (
                      <p className="text-xs text-gray-500 mt-1">
                        Inclusive of all taxes
                      </p>
                    )}
                  </div>

                  {/* Availability Section */}
                  {showBookingSection && (availableDays.length > 0 || timeSlots.length > 0) && (
                    <div className="p-5 space-y-4 border-b">
                      {/* Available Days */}
                      {availableDays.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Available Days
                          </p>
                          <div className="flex gap-1">
                            {ALL_DAYS.map((day) => (
                              <div
                                key={day}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                                  availableDays.includes(day)
                                    ? "text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 line-through"
                                }`}
                                style={availableDays.includes(day) ? { backgroundColor: primaryColor } : {}}
                              >
                                {DAY_ABBREVIATIONS[day]}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Time Slots */}
                      {timeSlots.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Time Slots
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {timeSlots.slice(0, 6).map((slot: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs font-normal py-1">
                                {slot}
                              </Badge>
                            ))}
                            {timeSlots.length > 6 && (
                              <Badge variant="secondary" className="text-xs">
                                +{timeSlots.length - 6}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isPreview && showBookingSection && (
                    <div className="p-5 space-y-3">
                      <Button 
                        onClick={onBook} 
                        size="lg" 
                        className="w-full h-12 text-base font-semibold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Book Now
                      </Button>
                      <Button variant="outline" size="lg" className="w-full h-12 text-base">
                        <PhoneCall className="h-5 w-5 mr-2" />
                        Contact Vendor
                      </Button>
                    </div>
                  )}

                  {isPreview && (
                    <div className="p-5">
                      <Button variant="outline" onClick={onClose} className="w-full h-11">
                        Close Preview
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sticky CTA */}
      {!isPreview && showBookingSection && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t shadow-2xl z-40 safe-area-pb">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Price Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-bold" style={{ color: primaryColor }}>
                  ₹{hasDiscount ? offerPrice : basePrice}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-gray-400 line-through">₹{basePrice}</span>
                    <Badge className="bg-red-500 text-white text-[10px] h-5">
                      {discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-500">Inclusive of all taxes</p>
            </div>
            
            {/* CTA Button */}
            <Button 
              onClick={onBook} 
              size="lg" 
              className="h-11 px-6 text-sm font-semibold shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              Book Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
