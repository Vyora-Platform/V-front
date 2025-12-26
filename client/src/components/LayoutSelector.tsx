import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Eye, Layout, ShoppingBag, Briefcase, Building2, Store, Star, Phone, MapPin, Search, ChevronRight, Sparkles, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// 4 Core Business Type Layouts
export const websiteLayouts = [
  // 1. Retail & Product Sellers
  {
    id: "retail-products",
    name: "Retail & Products",
    businessType: "Retail Business",
    description: "Perfect for retail stores, boutiques, e-commerce shops, and any business focused on selling physical products. Features product catalogs, shopping cart, and order management.",
    suitedFor: "Online stores, Fashion boutiques, Electronics shops, Grocery stores, Gift shops, Furniture stores, Bookstores",
    icon: ShoppingBag,
    features: ["Product Catalog", "Shopping Cart", "Category Navigation", "Wishlist", "Order Tracking", "Inventory Display", "Sale & Discounts", "Customer Reviews"],
    previewColors: { primary: "#2563eb", secondary: "#f97316", accent: "#06b6d4" },
    layout: {
      heroStyle: "product-showcase",
      navPosition: "sticky-top",
      serviceDisplay: "grid-4",
      showProducts: true,
      showServices: false,
      ctaStyle: "add-to-cart",
      footerStyle: "detailed"
    }
  },
  // 2. Service Providers
  {
    id: "service-providers",
    name: "Service Business",
    businessType: "Service Providers",
    description: "Ideal for service-based businesses like salons, consultants, repair services, healthcare, and professionals. Features appointment booking, service menus, and team profiles.",
    suitedFor: "Salons & Spas, Doctors & Clinics, Consultants, Home Services, Repair Services, Fitness Centers, Coaching Classes",
    icon: Briefcase,
    features: ["Service Menu", "Online Booking", "Team Profiles", "Appointment Scheduling", "Testimonials", "FAQ Section", "Contact Form", "Location Map"],
    previewColors: { primary: "#0891b2", secondary: "#14b8a6", accent: "#0ea5e9" },
    layout: {
      heroStyle: "professional-clean",
      navPosition: "sticky-white",
      serviceDisplay: "service-cards",
      showProducts: false,
      showServices: true,
      ctaStyle: "book-appointment",
      footerStyle: "comprehensive"
    }
  },
  // 3. B2B & Corporate
  {
    id: "b2b-corporate",
    name: "B2B & Corporate",
    businessType: "B2B Business",
    description: "Designed for businesses dealing with other businesses - manufacturers, wholesalers, distributors, and corporate service providers. Features bulk inquiry forms, company profiles, and certifications.",
    suitedFor: "Manufacturers, Wholesalers, Distributors, Corporate Services, Industrial Suppliers, Business Consultants, IT Companies",
    icon: Building2,
    features: ["Product Catalog", "Bulk Inquiry Form", "Company Profile", "Certifications", "Partner Logos", "Case Studies", "Request Quote", "B2B Pricing"],
    previewColors: { primary: "#0f172a", secondary: "#3b82f6", accent: "#0ea5e9" },
    layout: {
      heroStyle: "corporate-modern",
      navPosition: "business-top",
      serviceDisplay: "enterprise-cards",
      showProducts: true,
      showServices: true,
      ctaStyle: "request-quote",
      footerStyle: "corporate"
    }
  },
  // 4. Hybrid - Products & Services
  {
    id: "hybrid-business",
    name: "Products & Services",
    businessType: "Hybrid Business",
    description: "Perfect for businesses that offer both products and services - like car dealerships with servicing, electronics shops with repairs, or beauty stores with salon services. Features both catalogs.",
    suitedFor: "Car Dealerships, Electronics + Repairs, Beauty Stores + Salon, Restaurants + Catering, Gyms + Merchandise, Pet Shops + Grooming",
    icon: Store,
    features: ["Product Catalog", "Service Menu", "Dual Navigation", "Shopping Cart", "Appointment Booking", "Customer Reviews", "Gift Cards", "Loyalty Programs"],
    previewColors: { primary: "#7c3aed", secondary: "#f59e0b", accent: "#10b981" },
    layout: {
      heroStyle: "dual-showcase",
      navPosition: "sticky-top",
      serviceDisplay: "hybrid-grid",
      showProducts: true,
      showServices: true,
      ctaStyle: "shop-or-book",
      footerStyle: "comprehensive"
    }
  }
];

// Legacy category map for backwards compatibility
export const categoryLayoutMap: Record<string, string[]> = {
  "Retail": ["retail-products", "hybrid-business"],
  "Shop": ["retail-products", "hybrid-business"],
  "Store": ["retail-products", "hybrid-business"],
  "Boutique": ["retail-products", "hybrid-business"],
  "Fashion": ["retail-products", "hybrid-business"],
  "Electronics": ["retail-products", "hybrid-business"],
  "Grocery": ["retail-products", "hybrid-business"],
  "Salon": ["service-providers", "hybrid-business"],
  "Spa": ["service-providers", "hybrid-business"],
  "Clinic": ["service-providers", "hybrid-business"],
  "Doctor": ["service-providers", "hybrid-business"],
  "Consultant": ["service-providers", "b2b-corporate"],
  "Gym": ["service-providers", "hybrid-business"],
  "B2B": ["b2b-corporate", "hybrid-business"],
  "Manufacturing": ["b2b-corporate", "retail-products"],
  "Wholesale": ["b2b-corporate", "retail-products"],
  "Corporate": ["b2b-corporate", "service-providers"],
  "Restaurant": ["hybrid-business", "service-providers"],
  "Cafe": ["hybrid-business", "retail-products"],
  "Other": ["hybrid-business", "retail-products"],
  "General": ["hybrid-business", "retail-products"],
};

// Function to find recommended layouts based on vendor category
export function getRecommendedLayouts(vendorCategory: string | undefined): string[] {
  if (!vendorCategory) return ["hybrid-business"];
  
  const normalizedCategory = vendorCategory.trim();
  if (categoryLayoutMap[normalizedCategory]) {
    return categoryLayoutMap[normalizedCategory];
  }
  
  const lowerCategory = normalizedCategory.toLowerCase();
  for (const [key, layouts] of Object.entries(categoryLayoutMap)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return layouts;
    }
  }
  
  return ["hybrid-business", "retail-products"];
}

interface LayoutSelectorProps {
  selectedLayout: string;
  onLayoutChange: (layoutId: string) => void;
  formData: any;
  services: any[];
  products: any[];
  vendorCategory?: string;
}

export function LayoutSelector({ 
  selectedLayout, 
  onLayoutChange, 
  formData, 
  services, 
  products,
  vendorCategory
}: LayoutSelectorProps) {
  const [previewLayout, setPreviewLayout] = useState<typeof websiteLayouts[0] | null>(null);

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-6">
        {/* Header */}
        <div className="text-center mb-4">
          <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
            Select Your Website Layout
          </CardTitle>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">100% Mobile Responsive</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">MNC-Level Quality</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        {/* All 4 Layouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {websiteLayouts.map((layout) => (
            <LayoutCard
              key={layout.id}
              layout={layout}
              isSelected={selectedLayout === layout.id}
              onSelect={() => onLayoutChange(layout.id)}
              onPreview={() => setPreviewLayout(layout)}
            />
          ))}
        </div>

        {/* Layout Preview Dialog - Matches Published Website */}
        <Dialog open={!!previewLayout} onOpenChange={() => setPreviewLayout(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden">
            <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="text-base sm:text-lg">{previewLayout?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{previewLayout?.businessType}</Badge>
                  <Badge className="text-xs bg-green-100 text-green-700">Matches Published Site</Badge>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto bg-white" style={{ maxHeight: 'calc(95vh - 140px)' }}>
              {previewLayout && (
                <LayoutPreview 
                  layout={previewLayout} 
                  formData={formData}
                  services={services}
                  products={products}
                />
              )}
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                This preview shows how your published website will look
              </p>
              <div className="flex gap-2 justify-center sm:justify-end">
                <Button variant="outline" size="sm" className="h-9 sm:h-10" onClick={() => setPreviewLayout(null)}>
                  Close
                </Button>
                <Button 
                  size="sm"
                  className="h-9 sm:h-10"
                  onClick={() => {
                    if (previewLayout) {
                      onLayoutChange(previewLayout.id);
                      setPreviewLayout(null);
                    }
                  }}
                  style={{ 
                    backgroundColor: previewLayout?.previewColors.primary,
                    color: 'white'
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Select This Layout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Website Type Selection Component - New step after name
interface WebsiteTypeSelectionProps {
  selectedType: string;
  onTypeChange: (typeId: string) => void;
}

export function WebsiteTypeSelection({ selectedType, onTypeChange }: WebsiteTypeSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">What type of website do you need?</h2>
        <p className="text-muted-foreground">Choose the type that best matches your business model</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {websiteLayouts.map((layout) => {
          const LayoutIcon = layout.icon;
          const isSelected = selectedType === layout.id;
          
          return (
            <Card 
              key={layout.id}
              className={cn(
                "relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                isSelected 
                  ? "border-2 ring-4 shadow-xl" 
                  : "border hover:border-gray-300"
              )}
              style={isSelected ? { 
                borderColor: layout.previewColors.primary, 
                '--tw-ring-color': `${layout.previewColors.primary}30` 
              } as any : {}}
              onClick={() => onTypeChange(layout.id)}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-10">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: layout.previewColors.primary }}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Preview Header */}
              <div 
                className="h-32 relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${layout.previewColors.primary} 0%, ${layout.previewColors.accent} 100%)`
                }}
              >
                {/* Mini Website Mockup */}
                <div className="absolute inset-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-inner overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: layout.previewColors.primary }} />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[60px]" />
                    <div className="flex gap-1.5">
                      <div className="w-10 h-2.5 bg-gray-200 rounded-sm" />
                      <div className="w-10 h-2.5 bg-gray-200 rounded-sm" />
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 rounded-full" style={{ backgroundColor: `${layout.previewColors.primary}40`, width: '70%' }} />
                        <div className="h-2 bg-gray-200 rounded-full w-full" />
                        <div className="h-2 bg-gray-200 rounded-full w-4/5" />
                      </div>
                      <div className="w-16 h-12 rounded-lg" style={{ backgroundColor: `${layout.previewColors.primary}20` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="p-3 rounded-xl shrink-0 shadow-sm"
                    style={{ backgroundColor: `${layout.previewColors.primary}15` }}
                  >
                    <LayoutIcon 
                      className="h-6 w-6" 
                      style={{ color: layout.previewColors.primary }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{layout.name}</h3>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ backgroundColor: `${layout.previewColors.primary}15`, color: layout.previewColors.primary }}
                    >
                      {layout.businessType}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {layout.description}
                </p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Best Suited For:</p>
                  <p className="text-xs text-muted-foreground">{layout.suitedFor}</p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {layout.features.slice(0, 5).map((feature) => (
                    <span 
                      key={feature}
                      className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                  {layout.features.length > 5 && (
                    <span 
                      className="text-[10px] px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: `${layout.previewColors.primary}15`, color: layout.previewColors.primary }}
                    >
                      +{layout.features.length - 5} more
                    </span>
                  )}
                </div>

                {/* Select Button */}
                <Button
                  className="w-full mt-4 gap-2"
                  variant={isSelected ? "default" : "outline"}
                  style={isSelected ? { backgroundColor: layout.previewColors.primary, color: 'white' } : {}}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-4 w-4" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Layout className="h-4 w-4" />
                      Select This Type
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Layout Card Component - MNC Level Professional Design with JustDial-inspired Hero
function LayoutCard({ 
  layout, 
  isSelected, 
  onSelect, 
  onPreview 
}: { 
  layout: typeof websiteLayouts[0];
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const LayoutIcon = layout.icon;
  
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 overflow-hidden transition-all duration-500 cursor-pointer group",
        "hover:shadow-2xl hover:-translate-y-2",
        isSelected
          ? "ring-4 shadow-2xl scale-[1.02]"
          : "border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300"
      )}
      style={isSelected ? { 
        borderColor: layout.previewColors.primary, 
        '--tw-ring-color': `${layout.previewColors.primary}40`,
        boxShadow: `0 25px 50px -12px ${layout.previewColors.primary}30`
      } as any : {}}
      onClick={onSelect}
    >
      {/* Best for Badge - like JustDial verified */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg">
          <Sparkles className="h-3 w-3 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">{layout.businessType}</span>
        </div>
      </div>
      
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl animate-pulse"
            style={{ 
              background: `linear-gradient(135deg, ${layout.previewColors.primary}, ${layout.previewColors.accent})`,
            }}
          >
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* JustDial-Inspired Hero Preview */}
      <div 
        className="h-52 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${layout.previewColors.primary} 0%, ${layout.previewColors.accent} 50%, ${layout.previewColors.secondary} 100%)`
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" 
          style={{ background: 'white', filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} 
        />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-20" 
          style={{ background: 'white', filter: 'blur(30px)', transform: 'translate(-30%, 30%)' }} 
        />
        
        {/* Mini Website Mockup - JustDial Style */}
        <div className="absolute inset-3 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Mini Header - JustDial Style */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" 
                style={{ backgroundColor: layout.previewColors.primary }}>
                B
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full w-14" />
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Phone className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="px-2 py-1 rounded text-[8px] font-bold text-white" 
                style={{ backgroundColor: layout.previewColors.secondary }}>
                Contact
              </div>
            </div>
          </div>
          
          {/* Mini Hero Content - JustDial Search Style */}
          <div className="px-3 py-3" style={{ background: `linear-gradient(to bottom, ${layout.previewColors.primary}08, white)` }}>
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-2 p-1.5 bg-white rounded-lg border shadow-sm">
              <Search className="w-3 h-3 text-gray-400" />
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <div className="px-2 py-1 rounded text-[8px] font-bold text-white" 
                style={{ backgroundColor: layout.previewColors.primary }}>
                Search
              </div>
            </div>
            
            {/* Rating & Stats Row */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500 rounded">
                <Star className="w-2 h-2 text-white fill-white" />
                <span className="text-[8px] font-bold text-white">4.8</span>
              </div>
              <div className="text-[8px] text-gray-500">1.2K+ reviews</div>
              <div className="flex items-center gap-0.5">
                <MapPin className="w-2 h-2 text-gray-400" />
                <div className="w-8 h-1.5 bg-gray-200 rounded" />
              </div>
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-1 mb-2 overflow-hidden">
              {['Popular', 'New', 'Top Rated'].map((cat, i) => (
                <div key={i} className="px-2 py-0.5 text-[7px] font-medium rounded-full whitespace-nowrap"
                  style={{ 
                    backgroundColor: i === 0 ? layout.previewColors.primary : `${layout.previewColors.primary}15`,
                    color: i === 0 ? 'white' : layout.previewColors.primary 
                  }}>
                  {cat}
                </div>
              ))}
            </div>
          </div>
          
          {/* Mini Product/Service Grid */}
          <div className="px-2 pb-2 grid grid-cols-3 gap-1.5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <div className="aspect-square rounded bg-gradient-to-br from-gray-100 to-gray-200 mb-1" />
                <div className="h-1.5 bg-gray-300 rounded w-full mb-0.5" />
                <div className="h-1.5 rounded w-1/2" style={{ backgroundColor: layout.previewColors.primary }} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Hover Overlay with Live Preview */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-4">
          <Button 
            size="sm" 
            className="gap-2 shadow-2xl bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-4 w-4" />
            Live Preview
          </Button>
        </div>
      </div>

      {/* Layout Info */}
      <div className="p-5 bg-gradient-to-b from-card to-card/80">
        {/* Icon and Name */}
        <div className="flex items-start gap-3 mb-3">
          <div 
            className="p-3 rounded-xl shrink-0 shadow-md"
            style={{ 
              background: `linear-gradient(135deg, ${layout.previewColors.primary}20, ${layout.previewColors.accent}20)`,
              boxShadow: `0 4px 12px ${layout.previewColors.primary}20`
            }}
          >
            <LayoutIcon 
              className="h-6 w-6" 
              style={{ color: layout.previewColors.primary }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight mb-1 flex items-center gap-2">
              {layout.name}
              {isSelected && (
                <span className="text-xs font-normal text-green-600 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Active
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Best for: {layout.suitedFor.split(',')[0]}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {layout.description}
        </p>
        
        {/* Features - Compact Tags with Icons */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {layout.features.slice(0, 4).map((feature, idx) => (
            <span 
              key={feature}
              className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium flex items-center gap-1"
            >
              {idx === 0 && <TrendingUp className="h-2.5 w-2.5" />}
              {feature}
            </span>
          ))}
          {layout.features.length > 4 && (
            <span 
              className="text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1"
              style={{ backgroundColor: `${layout.previewColors.primary}15`, color: layout.previewColors.primary }}
            >
              +{layout.features.length - 4} more
              <ChevronRight className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 gap-2 h-11 font-semibold transition-all duration-300",
              isSelected && "shadow-lg"
            )}
            style={isSelected ? { 
              background: `linear-gradient(135deg, ${layout.previewColors.primary}, ${layout.previewColors.accent})`,
              color: 'white',
              boxShadow: `0 8px 20px ${layout.previewColors.primary}40`
            } : {}}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4" />
                Selected
              </>
            ) : (
              <>
                <Layout className="h-4 w-4" />
                Choose This
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-4 h-11 hover:bg-gray-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Layout Preview Component - MNC-level website preview
function LayoutPreview({ 
  layout, 
  formData,
  services,
  products
}: { 
  layout: typeof websiteLayouts[0];
  formData: any;
  services: any[];
  products: any[];
}) {
  const primary = formData?.primaryColor || layout.previewColors.primary;
  const secondary = formData?.secondaryColor || layout.previewColors.secondary;
  const accent = formData?.accentColor || layout.previewColors.accent;
  
  const businessName = formData?.businessName || "Your Business";
  const tagline = formData?.tagline || "Excellence in Every Detail";
  const description = formData?.description || "We are committed to providing the highest quality products and services to our valued customers.";
  const logo = formData?.logo;
  const contactPhone = formData?.contactPhone || "+91 98765 43210";
  const contactEmail = formData?.contactEmail || "contact@yourbusiness.com";
  const address = formData?.address || "123 Business Street, City, India";
  const heroMedia = formData?.heroMedia?.length > 0 ? formData.heroMedia : [];
  
  const teamMembers = formData?.teamMembers?.length > 0 ? formData.teamMembers : [
    { name: 'John Doe', role: 'Founder', photo: null },
    { name: 'Jane Smith', role: 'Manager', photo: null },
    { name: 'Alex Johnson', role: 'Expert', photo: null },
  ];
  
  const faqs = formData?.faqs?.length > 0 ? formData.faqs : [
    { question: 'What services do you offer?', answer: 'We offer a comprehensive range of services tailored to meet your needs.' },
    { question: 'How can I contact you?', answer: 'You can reach us via phone, email, or visit our store.' },
    { question: 'What are your business hours?', answer: 'We are open Monday to Saturday, 9 AM to 6 PM.' },
  ];
  
  const displayServices = services.length > 0 ? services : [
    { id: '1', name: 'Service One', description: 'Professional service for your needs.', price: 1999, image: null },
    { id: '2', name: 'Service Two', description: 'Expert care and attention.', price: 2499, image: null },
    { id: '3', name: 'Service Three', description: 'Quality guaranteed.', price: 1499, image: null },
    { id: '4', name: 'Service Four', description: 'Premium experience.', price: 4999, image: null },
  ];

  const displayProducts = products.length > 0 ? products : [
    { id: '1', name: 'Product A', description: 'High quality product.', salePrice: 3999, price: 4999, image: null },
    { id: '2', name: 'Product B', description: 'Best seller item.', salePrice: 6499, price: 7999, image: null },
    { id: '3', name: 'Product C', description: 'Customer favorite.', salePrice: 2499, price: 2999, image: null },
    { id: '4', name: 'Product D', description: 'Premium quality.', salePrice: 7999, price: 9999, image: null },
  ];

  const LayoutIcon = layout.icon;

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* ===== HEADER - Matches Published Website ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 md:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo Section - Same as Published */}
            <div className="flex items-center gap-3 md:gap-4">
              {logo ? (
                <img src={logo} alt={businessName} className="h-10 w-10 md:h-14 md:w-14 rounded-xl object-cover shadow-md" />
              ) : (
                <div 
                  className="h-10 w-10 md:h-14 md:w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-2xl shadow-md"
                  style={{ backgroundColor: primary }}
                >
                  {businessName.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="flex items-center gap-2 md:gap-3">
                  <h1 className="font-bold text-lg md:text-xl lg:text-2xl text-gray-900">{businessName}</h1>
                  {/* VYORA Verified Badge */}
                  <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full" style={{ backgroundColor: primary + '15' }}>
                    <Check className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: primary }} />
                    <span className="text-[10px] md:text-xs font-semibold" style={{ color: primary }}>Verified</span>
                  </div>
                </div>
                {tagline && <p className="text-xs md:text-sm text-gray-500 mt-0.5 max-w-md line-clamp-1">{tagline}</p>}
              </div>
            </div>
            
            {/* Desktop Navigation - Centered with Background */}
            <nav className="hidden lg:flex items-center gap-1 bg-gray-50 rounded-full px-2 py-1.5">
              {layout.layout.showProducts && <a href="#" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Products</a>}
              {layout.layout.showServices && <a href="#" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Services</a>}
              <a href="#" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">About</a>
              <a href="#" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Contact</a>
            </nav>
            
            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Business Status Indicator */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500"></span>
                <span className="text-sm font-semibold">Open Now</span>
              </div>
              
              <Button 
                size="sm" 
                className="rounded-full px-5 h-10 font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: primary, color: 'white' }}
              >
                {layout.layout.ctaStyle === 'add-to-cart' ? 'Shop Now' :
                 layout.layout.ctaStyle === 'book-appointment' ? 'Book Now' :
                 layout.layout.ctaStyle === 'request-quote' ? 'Get Quote' :
                 'Contact Us'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section 
        className="py-20 lg:py-24"
        style={{ background: `linear-gradient(135deg, ${primary}10 0%, ${accent}10 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge 
                className="mb-4 px-4 py-1"
                style={{ backgroundColor: `${primary}15`, color: primary }}
              >
                {layout.businessType}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {tagline || businessName}
              </h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">4.9 (1,200+ reviews)</span>
              </div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">{description.slice(0, 150)}...</p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="rounded-full px-8 py-3 text-sm font-semibold"
                  style={{ backgroundColor: primary, color: 'white' }}
                >
                  {layout.layout.ctaStyle === 'add-to-cart' ? '🛒 Browse Products' :
                   layout.layout.ctaStyle === 'book-appointment' ? '📅 Book Appointment' :
                   layout.layout.ctaStyle === 'request-quote' ? '📋 Request Quote' :
                   '✨ Get Started'}
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full px-8 py-3 text-sm font-semibold"
                >
                  📞 Contact Us
                </Button>
              </div>
            </div>
            
            <div className="relative">
              {heroMedia.length > 0 ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img src={heroMedia[0]} alt={businessName} className="w-full h-[400px] object-cover" />
                </div>
              ) : (
                <div 
                  className="rounded-2xl overflow-hidden shadow-2xl h-[400px] flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primary}20 0%, ${accent}30 100%)` }}
                >
                  <div className="text-center p-8">
                    <div 
                      className="w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${primary}20` }}
                    >
                      <LayoutIcon className="w-12 h-12" style={{ color: primary }} />
                    </div>
                    <p className="font-semibold" style={{ color: primary }}>Your Hero Image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      {layout.layout.showServices && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Services</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Professional services tailored to your needs</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayServices.slice(0, 4).map((service: any, idx: number) => (
                <div key={service.id || idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {service.image ? (
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}20` }}>
                        <LayoutIcon className="w-8 h-8" style={{ color: primary }} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold" style={{ color: primary }}>₹{service.price?.toLocaleString()}</span>
                      <Button 
                        size="sm" 
                        className="rounded-lg"
                        style={{ backgroundColor: secondary, color: 'white' }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PRODUCTS SECTION ===== */}
      {layout.layout.showProducts && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Products</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Discover our premium collection</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.slice(0, 4).map((product: any, idx: number) => (
                <div key={product.id || idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                  <div className="h-56 bg-gray-50 flex items-center justify-center p-4">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}15` }}>
                        <ShoppingBag className="w-10 h-10" style={{ color: primary }} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold" style={{ color: primary }}>
                          ₹{(product.salePrice || product.price)?.toLocaleString()}
                        </span>
                        {product.price && product.salePrice && product.price > product.salePrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">₹{product.price?.toLocaleString()}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="rounded-lg"
                        style={{ backgroundColor: secondary, color: 'white' }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== ABOUT & TEAM ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">{description}</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Meet Our Team</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {teamMembers.slice(0, 3).map((member: any, idx: number) => (
                <div key={idx} className="text-center">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
                  >
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name?.charAt(0)
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm" style={{ color: primary }}>{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQs ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqs.slice(0, 3).map((faq: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-500 text-sm">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>
                  {businessName.charAt(0)}
                </div>
                <span className="text-xl font-bold">{businessName}</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400 text-sm mb-2">📞 {contactPhone}</p>
              <p className="text-gray-400 text-sm mb-2">📧 {contactEmail}</p>
              <p className="text-gray-400 text-sm">📍 {address}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {layout.layout.showProducts && <li><a href="#" className="hover:text-white">Products</a></li>}
                {layout.layout.showServices && <li><a href="#" className="hover:text-white">Services</a></li>}
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">Vyora.club</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LayoutSelector;
