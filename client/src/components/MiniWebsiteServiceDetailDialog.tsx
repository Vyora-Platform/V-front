import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
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
  Wind,
  Droplet,
  Users,
  Coffee,
  Zap,
  Heart,
  Lock,
  Sparkles,
  BadgeCheck,
  Package,
  ArrowLeft,
  Share2,
  Bookmark,
  Info,
  ShoppingCart,
  Tag,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { VendorCatalogue } from "@shared/schema";

interface MiniWebsiteServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: VendorCatalogue | null;
  primaryColor: string;
  onAddToCart?: (service: VendorCatalogue) => void;
  onRequestQuote?: (service: VendorCatalogue) => void;
  showAddToCart?: boolean;
  showQuoteButton?: boolean;
}

// Amenity icons mapping
const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  ac: Wind,
  washroom: Droplet,
  waiting: Users,
  water: Coffee,
  cctv: Shield,
  power: Zap,
  staff: Users,
  payment: BadgeCheck,
  housekeeping: Sparkles,
  firstaid: Heart,
  lift: Users,
  consultation: Users,
  locker: Lock,
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

export default function MiniWebsiteServiceDetailDialog({
  open,
  onOpenChange,
  service,
  primaryColor,
  onAddToCart,
  onRequestQuote,
  showAddToCart = true,
  showQuoteButton = false,
}: MiniWebsiteServiceDetailDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  if (!service) return null;

  const serviceData = service as any;
  const images = serviceData.images || [];
  const hasImages = images.length > 0;
  
  // Calculate pricing
  const basePrice = service.price || 0;
  const offerPrice = service.offerPrice;
  const hasDiscount = offerPrice && offerPrice < basePrice;
  const discountPercent = hasDiscount ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;

  // Get duration display
  const getDurationDisplay = () => {
    if (serviceData.durationType === "fixed" && serviceData.durationValue) {
      return `${serviceData.durationValue} ${serviceData.durationUnit || "min"}`;
    }
    if (serviceData.durationType === "variable" && serviceData.durationMin && serviceData.durationMax) {
      return `${serviceData.durationMin}-${serviceData.durationMax} ${serviceData.durationUnit || "min"}`;
    }
    if (serviceData.durationType === "session" && serviceData.sessionCount) {
      return `${serviceData.sessionCount} sessions`;
    }
    if (serviceData.customUnit) {
      return serviceData.customUnit;
    }
    return null;
  };

  const duration = getDurationDisplay();
  const availableDays = serviceData.availableDays || [];
  const timeSlots = serviceData.availableTimeSlots || [];
  const amenities = serviceData.amenities || [];
  const customAmenities = serviceData.customAmenities || [];
  const inclusions = serviceData.inclusions || [];
  const exclusions = serviceData.exclusions || [];
  const policies = serviceData.policies || [];
  const inventoryItems = serviceData.inventoryItems || [];

  const allAmenities = [...amenities, ...customAmenities.map((a: string) => ({ custom: true, label: a }))];
  const displayedAmenities = showAllAmenities ? allAmenities : allAmenities.slice(0, 6);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Description text
  const description = serviceData.detailedDescription || serviceData.shortDescription || service.description || "";
  const isLongDescription = description.length > 250;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 gap-0">
        {/* Compact Header */}
        <div className="sticky top-0 z-50 bg-white dark:bg-background border-b">
          <div className="flex items-center justify-between px-4 py-2.5">
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`p-2 rounded-full transition-colors ${
                  isSaved ? "text-primary bg-primary/10" : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
              </button>
              <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Hero Image - Reduced Height */}
          <div className="relative bg-gray-900">
            {hasImages ? (
              <div className="relative aspect-[16/9] max-h-[30vh] overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
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

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          currentImageIndex === index
                            ? "bg-white w-5"
                            : "bg-white/50 w-1.5 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] max-h-[25vh] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative">
                <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 30%, ${primaryColor}, transparent 50%)` }} />
                <div className="text-center relative z-10">
                  <div className="text-6xl mb-2">{service.icon || "💼"}</div>
                  <Badge className="bg-emerald-500 text-white gap-1 px-2 py-1 text-xs">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-4 py-5 space-y-5">
            {/* Service Title & Rating */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {service.name}
              </h1>

              {/* Rating & Quick Info */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs">4.8</span>
                  <span className="text-gray-500 text-xs">(2.5K)</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {serviceData.deliveryModes?.includes("home-service") 
                      ? "Home & Business" 
                      : "Business Location"}
                  </span>
                </div>
                {duration && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{duration}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            <div className="p-4 rounded-xl border" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)`, borderColor: `${primaryColor}25` }}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold" style={{ color: primaryColor }}>
                  ₹{hasDiscount ? offerPrice : basePrice}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-gray-400 line-through">₹{basePrice}</span>
                    <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                      {discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>
              {serviceData.gstIncluded && (
                <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
              )}
            </div>

            {/* Availability */}
            {(availableDays.length > 0 || timeSlots.length > 0) && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: primaryColor }} />
                  Availability
                </h3>
                
                {availableDays.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Available Days</p>
                    <div className="flex gap-1">
                      {ALL_DAYS.map((day) => (
                        <div
                          key={day}
                          className={`w-7 h-7 rounded-lg text-[10px] font-semibold flex items-center justify-center ${
                            availableDays.includes(day)
                              ? "text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-400 line-through"
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
                        <Badge key={index} variant="outline" className="text-xs font-normal py-0.5">
                          {slot}
                        </Badge>
                      ))}
                      {timeSlots.length > 6 && (
                        <Badge variant="secondary" className="text-xs">+{timeSlots.length - 6}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* About This Service - Collapsible */}
            {description && (
              <Card className="border shadow-sm overflow-hidden">
                <Collapsible open={isDescriptionExpanded} onOpenChange={setIsDescriptionExpanded}>
                  <CardContent className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                      <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap ${!isDescriptionExpanded && isLongDescription ? 'line-clamp-3' : ''}`}>
                        {description}
                      </p>
                      {isLongDescription && (
                        <button 
                          className="text-xs font-medium mt-2"
                          style={{ color: primaryColor }}
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                          {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Collapsible>
              </Card>
            )}

            {/* Inclusions & Exclusions */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-3">
                {inclusions.length > 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        What's Included
                      </h3>
                      <ul className="space-y-1.5">
                        {inclusions.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {exclusions.length > 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-3">
                        <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                          <X className="h-3 w-3 text-red-600" />
                        </div>
                        Not Included
                      </h3>
                      <ul className="space-y-1.5">
                        {exclusions.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-xs">
                            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Amenities */}
            {allAmenities.length > 0 && (
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
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
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <Icon className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                          <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{label}</span>
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
            )}

            {/* Trust Indicators */}
            <div className="grid grid-cols-4 gap-2">
              {TRUST_INDICATORS.map((item, index) => (
                <div key={index} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
                  <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 line-clamp-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Policies */}
            {policies.length > 0 && (
              <Card className="border shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <AlertCircle className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                    Policies
                  </h3>
                  <div className="space-y-2">
                    {policies.map((policy: any, index: number) => (
                      <div key={index} className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-xs text-gray-800 dark:text-white mb-0.5">{policy.title}</h4>
                        <p className="text-[11px] text-gray-500">{policy.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-card border-t p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-bold" style={{ color: primaryColor }}>
                  ₹{hasDiscount ? offerPrice : basePrice}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">₹{basePrice}</span>
                )}
              </div>
              <p className="text-[10px] text-gray-500">Inclusive of taxes</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {showQuoteButton && onRequestQuote && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => onRequestQuote(service)}
                >
                  <Tag className="h-4 w-4 mr-1.5" />
                  Quote
                </Button>
              )}
              {showAddToCart && onAddToCart && (
                <Button 
                  size="sm"
                  className="h-10 px-5"
                  onClick={() => onAddToCart(service)}
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                >
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
