import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Eye, Layout, Store, Scissors, Utensils, Dumbbell, Stethoscope, GraduationCap, Camera, Wrench, ShoppingBag, Building2, Sparkles, Car, Briefcase, Home, Hammer, Plane, HardHat, Truck, Calendar, Hotel } from "lucide-react";
import { cn } from "@/lib/utils";

// Category to Layout mapping - maps database categories to layout recommendations
export const categoryLayoutMap: Record<string, string[]> = {
  // Healthcare & Wellness
  "Healthcare": ["healthcare-wellness", "professional-services"],
  "Medical": ["healthcare-wellness", "professional-services"],
  "Clinic": ["healthcare-wellness", "professional-services"],
  "Hospital": ["healthcare-wellness", "professional-services"],
  "Dental": ["healthcare-wellness", "professional-services"],
  "Pharmacy": ["healthcare-wellness", "ecommerce-retail"],
  "Wellness": ["healthcare-wellness", "salon-spa-beauty"],
  "Ayurveda": ["healthcare-wellness", "salon-spa-beauty"],
  
  // Education & Training
  "Education": ["education-training", "professional-services"],
  "School": ["education-training", "professional-services"],
  "College": ["education-training", "professional-services"],
  "Coaching": ["education-training", "professional-services"],
  "Training": ["education-training", "professional-services"],
  "Institute": ["education-training", "professional-services"],
  "Academy": ["education-training", "fitness-sports"],
  
  // Home & Local Services
  "Home Services": ["home-local-services", "repair-maintenance"],
  "Cleaning": ["home-local-services", "repair-maintenance"],
  "Pest Control": ["home-local-services", "repair-maintenance"],
  "Laundry": ["home-local-services", "ecommerce-retail"],
  "Interior": ["home-local-services", "real-estate-property"],
  
  // Professional Services
  "Professional": ["professional-services", "b2b-corporate"],
  "Lawyer": ["professional-services", "b2b-corporate"],
  "CA": ["professional-services", "b2b-corporate"],
  "Accountant": ["professional-services", "b2b-corporate"],
  "Consultant": ["professional-services", "b2b-corporate"],
  "Insurance": ["professional-services", "b2b-corporate"],
  "Financial": ["professional-services", "b2b-corporate"],
  
  // Fitness & Sports
  "Gym": ["fitness-sports", "healthcare-wellness"],
  "Fitness": ["fitness-sports", "healthcare-wellness"],
  "Yoga": ["fitness-sports", "healthcare-wellness"],
  "Sports": ["fitness-sports", "education-training"],
  "Martial Arts": ["fitness-sports", "education-training"],
  "Dance": ["fitness-sports", "events-creative"],
  
  // Rental Services
  "Rental": ["rental-services", "real-estate-property"],
  "Car Rental": ["rental-services", "travel-hospitality"],
  "Bike Rental": ["rental-services", "travel-hospitality"],
  "Equipment Rental": ["rental-services", "construction"],
  "Party Rental": ["rental-services", "events-creative"],
  
  // Real Estate & Property
  "Real Estate": ["real-estate-property", "professional-services"],
  "Property": ["real-estate-property", "professional-services"],
  "Builder": ["real-estate-property", "construction"],
  "Developer": ["real-estate-property", "construction"],
  "PG": ["real-estate-property", "rental-services"],
  "Hostel": ["real-estate-property", "rental-services"],
  
  // Food, Restaurants & Cafes
  "Restaurant": ["food-restaurant-cafe", "ecommerce-retail"],
  "Cafe": ["food-restaurant-cafe", "ecommerce-retail"],
  "Bakery": ["food-restaurant-cafe", "ecommerce-retail"],
  "Food": ["food-restaurant-cafe", "ecommerce-retail"],
  "Catering": ["food-restaurant-cafe", "events-creative"],
  "Cloud Kitchen": ["food-restaurant-cafe", "ecommerce-retail"],
  
  // Salon, Spa & Beauty
  "Salon": ["salon-spa-beauty", "healthcare-wellness"],
  "Spa": ["salon-spa-beauty", "healthcare-wellness"],
  "Beauty": ["salon-spa-beauty", "healthcare-wellness"],
  "Hair": ["salon-spa-beauty", "healthcare-wellness"],
  "Makeup": ["salon-spa-beauty", "events-creative"],
  "Nail": ["salon-spa-beauty", "healthcare-wellness"],
  
  // E-commerce & Retail
  "Retail": ["ecommerce-retail", "b2b-corporate"],
  "Shop": ["ecommerce-retail", "home-local-services"],
  "Store": ["ecommerce-retail", "home-local-services"],
  "Boutique": ["ecommerce-retail", "salon-spa-beauty"],
  "Fashion": ["ecommerce-retail", "salon-spa-beauty"],
  "Electronics": ["ecommerce-retail", "repair-maintenance"],
  "Grocery": ["ecommerce-retail", "home-local-services"],
  
  // B2B & Corporate
  "B2B": ["b2b-corporate", "professional-services"],
  "Corporate": ["b2b-corporate", "professional-services"],
  "Manufacturing": ["b2b-corporate", "construction"],
  "Wholesale": ["b2b-corporate", "ecommerce-retail"],
  "Distributor": ["b2b-corporate", "ecommerce-retail"],
  
  // Repair & Maintenance
  "Repair": ["repair-maintenance", "home-local-services"],
  "Plumber": ["repair-maintenance", "home-local-services"],
  "Electrician": ["repair-maintenance", "home-local-services"],
  "AC Repair": ["repair-maintenance", "home-local-services"],
  "Mobile Repair": ["repair-maintenance", "ecommerce-retail"],
  "Car Service": ["repair-maintenance", "rental-services"],
  "Garage": ["repair-maintenance", "rental-services"],
  
  // Travel & Hospitality
  "Travel": ["travel-hospitality", "events-creative"],
  "Hotel": ["travel-hospitality", "food-restaurant-cafe"],
  "Resort": ["travel-hospitality", "food-restaurant-cafe"],
  "Tour": ["travel-hospitality", "events-creative"],
  "Taxi": ["travel-hospitality", "rental-services"],
  
  // Events & Creative
  "Events": ["events-creative", "salon-spa-beauty"],
  "Wedding": ["events-creative", "salon-spa-beauty"],
  "Photography": ["events-creative", "professional-services"],
  "Video": ["events-creative", "professional-services"],
  "DJ": ["events-creative", "entertainment"],
  "Entertainment": ["events-creative", "travel-hospitality"],
  "Banquet": ["events-creative", "food-restaurant-cafe"],
  
  // Construction
  "Construction": ["construction", "real-estate-property"],
  "Contractor": ["construction", "repair-maintenance"],
  "Architect": ["construction", "professional-services"],
  "Civil": ["construction", "professional-services"],
  "Building": ["construction", "real-estate-property"],
  
  // Default
  "Other": ["professional-services", "ecommerce-retail"],
  "General": ["professional-services", "ecommerce-retail"],
};

// 15 Business-type specific layouts - MNC Level Professional Designs
export const websiteLayouts = [
  // 1. Healthcare & Wellness
  {
    id: "healthcare-wellness",
    name: "Healthcare & Wellness",
    businessType: "Healthcare & Wellness",
    categoryKeywords: ["healthcare", "clinic", "hospital", "doctor", "dental", "medical", "pharmacy", "wellness", "ayurveda"],
    icon: Stethoscope,
    description: "Professional, trustworthy design for clinics, hospitals, pharmacies, and wellness centers. Emphasizes credibility and patient care.",
    features: ["Doctor Profiles", "Appointment Booking", "Services List", "Emergency Contact", "Insurance Info", "Patient Testimonials"],
    previewColors: { primary: "#0891b2", secondary: "#14b8a6", accent: "#0ea5e9" },
    layout: {
      heroStyle: "professional-clean",
      navPosition: "sticky-white",
      serviceDisplay: "profile-cards",
      showTeam: true,
      ctaStyle: "appointment-booking",
      footerStyle: "comprehensive"
    }
  },
  // 2. Education & Training
  {
    id: "education-training",
    name: "Education & Training",
    businessType: "Education & Training",
    categoryKeywords: ["education", "school", "college", "coaching", "tuition", "training", "institute", "academy", "classes"],
    icon: GraduationCap,
    description: "Inspiring design for schools, coaching centers, training institutes, and academies. Focus on courses and student success.",
    features: ["Course Catalog", "Faculty Showcase", "Student Testimonials", "Enrollment Form", "Achievements", "Study Resources"],
    previewColors: { primary: "#7c3aed", secondary: "#06b6d4", accent: "#f59e0b" },
    layout: {
      heroStyle: "inspiring-banner",
      navPosition: "academic-top",
      serviceDisplay: "detailed-cards",
      showTeam: true,
      ctaStyle: "enroll-now",
      footerStyle: "informative"
    }
  },
  // 3. Home & Local Services
  {
    id: "home-local-services",
    name: "Home & Local Services",
    businessType: "Home & Local Services",
    categoryKeywords: ["home", "cleaning", "pest", "laundry", "interior", "local", "domestic", "housekeeping"],
    icon: Home,
    description: "Reliable design for home cleaning, pest control, laundry, and local services. Trust-focused with quick booking.",
    features: ["Service Areas", "Quick Quote", "Pricing Plans", "Customer Reviews", "Guarantee Badge", "Emergency Services"],
    previewColors: { primary: "#059669", secondary: "#fbbf24", accent: "#10b981" },
    layout: {
      heroStyle: "trust-builder",
      navPosition: "utility-top",
      serviceDisplay: "icon-grid",
      showTeam: false,
      ctaStyle: "call-now",
      footerStyle: "trust-signals"
    }
  },
  // 4. Professional Services
  {
    id: "professional-services",
    name: "Professional Services",
    businessType: "Professional Services",
    categoryKeywords: ["professional", "lawyer", "ca", "accountant", "consultant", "insurance", "financial", "tax", "legal"],
    icon: Briefcase,
    description: "Sophisticated design for lawyers, accountants, consultants, and professional firms. Corporate and trustworthy.",
    features: ["Expert Profiles", "Service Portfolio", "Case Studies", "Client Testimonials", "Consultation Form", "Industry Expertise"],
    previewColors: { primary: "#1e3a5f", secondary: "#0ea5e9", accent: "#6366f1" },
    layout: {
      heroStyle: "corporate-clean",
      navPosition: "premium-sticky",
      serviceDisplay: "professional-cards",
      showTeam: true,
      ctaStyle: "consultation",
      footerStyle: "professional"
    }
  },
  // 5. Fitness & Sports
  {
    id: "fitness-sports",
    name: "Fitness & Sports",
    businessType: "Fitness & Sports",
    categoryKeywords: ["gym", "fitness", "yoga", "sports", "martial", "dance", "trainer", "workout", "crossfit"],
    icon: Dumbbell,
    description: "High-energy design for gyms, fitness centers, yoga studios, and sports academies. Membership-focused.",
    features: ["Class Schedule", "Membership Plans", "Trainer Profiles", "Equipment Gallery", "Trial Offer", "Transformation Stories"],
    previewColors: { primary: "#0f172a", secondary: "#f97316", accent: "#10b981" },
    layout: {
      heroStyle: "bold-action",
      navPosition: "dark-sticky",
      serviceDisplay: "schedule-grid",
      showTeam: true,
      ctaStyle: "join-now",
      footerStyle: "social-heavy"
    }
  },
  // 6. Rental Services
  {
    id: "rental-services",
    name: "Rental Services",
    businessType: "Rental Services",
    categoryKeywords: ["rental", "car rental", "bike rental", "equipment", "party rental", "furniture rental", "lease"],
    icon: Truck,
    description: "Flexible design for car rentals, equipment rentals, party supplies, and all rental businesses. Booking-focused.",
    features: ["Inventory Showcase", "Booking Calendar", "Pricing Tiers", "Availability Check", "Terms & Conditions", "Insurance Options"],
    previewColors: { primary: "#2563eb", secondary: "#fbbf24", accent: "#8b5cf6" },
    layout: {
      heroStyle: "inventory-showcase",
      navPosition: "sticky-top",
      serviceDisplay: "product-grid",
      showTeam: false,
      ctaStyle: "book-now",
      footerStyle: "detailed"
    }
  },
  // 7. Real Estate & Property
  {
    id: "real-estate-property",
    name: "Real Estate & Property",
    businessType: "Real Estate & Property",
    categoryKeywords: ["real estate", "property", "builder", "developer", "pg", "hostel", "apartment", "villa", "plot"],
    icon: Building2,
    description: "Premium design for real estate agents, property dealers, builders, and developers. Listing-focused luxury appeal.",
    features: ["Property Listings", "Virtual Tours", "Agent Profile", "EMI Calculator", "Area Guide", "Inquiry Form"],
    previewColors: { primary: "#1e3a5f", secondary: "#d4af37", accent: "#059669" },
    layout: {
      heroStyle: "property-showcase",
      navPosition: "premium-sticky",
      serviceDisplay: "featured-slider",
      showTeam: true,
      ctaStyle: "schedule-viewing",
      footerStyle: "professional"
    }
  },
  // 8. Food, Restaurants & Cafes
  {
    id: "food-restaurant-cafe",
    name: "Food, Restaurants & Cafes",
    businessType: "Food & Dining",
    categoryKeywords: ["restaurant", "cafe", "bakery", "food", "catering", "cloud kitchen", "sweet", "coffee", "ice cream"],
    icon: Utensils,
    description: "Mouth-watering design for restaurants, cafes, bakeries, and food businesses. Menu-first with ordering.",
    features: ["Menu Display", "Food Gallery", "Online Orders", "Table Booking", "Chef's Special", "Delivery Zones"],
    previewColors: { primary: "#dc2626", secondary: "#fbbf24", accent: "#22c55e" },
    layout: {
      heroStyle: "food-showcase",
      navPosition: "sticky-top",
      serviceDisplay: "menu-cards",
      showTeam: true,
      ctaStyle: "order-now",
      footerStyle: "contact-heavy"
    }
  },
  // 9. Salon, Spa & Beauty
  {
    id: "salon-spa-beauty",
    name: "Salon, Spa & Beauty",
    businessType: "Beauty & Wellness",
    categoryKeywords: ["salon", "spa", "beauty", "hair", "makeup", "nail", "skincare", "parlour", "barbershop"],
    icon: Scissors,
    description: "Elegant design for salons, spas, and beauty parlors. Service menu with online booking and stylist profiles.",
    features: ["Service Menu", "Online Booking", "Stylist Profiles", "Gallery", "Price List", "Transformation Photos"],
    previewColors: { primary: "#be185d", secondary: "#fbbf24", accent: "#f472b6" },
    layout: {
      heroStyle: "elegant-centered",
      navPosition: "transparent-overlay",
      serviceDisplay: "cards-premium",
      showTeam: true,
      ctaStyle: "booking-focus",
      footerStyle: "minimal"
    }
  },
  // 10. E-commerce & Retail
  {
    id: "ecommerce-retail",
    name: "E-commerce & Retail",
    businessType: "E-commerce & Retail",
    categoryKeywords: ["retail", "shop", "store", "boutique", "fashion", "electronics", "grocery", "ecommerce", "online store"],
    icon: ShoppingBag,
    description: "Conversion-focused design for retail stores, boutiques, and e-commerce. Product showcase with cart functionality.",
    features: ["Product Grid", "Category Navigation", "Featured Products", "Shopping Cart", "Wishlist", "Store Locator"],
    previewColors: { primary: "#2563eb", secondary: "#f97316", accent: "#06b6d4" },
    layout: {
      heroStyle: "product-showcase",
      navPosition: "sticky-top",
      serviceDisplay: "grid-4",
      showTeam: false,
      ctaStyle: "cart-prominent",
      footerStyle: "detailed"
    }
  },
  // 11. B2B & Corporate
  {
    id: "b2b-corporate",
    name: "B2B & Corporate",
    businessType: "B2B & Corporate",
    categoryKeywords: ["b2b", "corporate", "manufacturing", "wholesale", "distributor", "enterprise", "supplier", "industrial"],
    icon: Building2,
    description: "Professional corporate design for B2B companies, manufacturers, wholesalers, and enterprise businesses.",
    features: ["Product Catalog", "Bulk Inquiry", "Company Profile", "Certifications", "Partner Logos", "Request Quote"],
    previewColors: { primary: "#0f172a", secondary: "#3b82f6", accent: "#0ea5e9" },
    layout: {
      heroStyle: "corporate-modern",
      navPosition: "business-top",
      serviceDisplay: "enterprise-cards",
      showTeam: true,
      ctaStyle: "request-quote",
      footerStyle: "corporate"
    }
  },
  // 12. Repair & Maintenance
  {
    id: "repair-maintenance",
    name: "Repair & Maintenance",
    businessType: "Repair & Maintenance",
    categoryKeywords: ["repair", "plumber", "electrician", "ac", "mobile", "car service", "garage", "appliance", "maintenance"],
    icon: Wrench,
    description: "Trust-focused design for repair services, plumbers, electricians, and maintenance providers. Quick contact emphasized.",
    features: ["Service List", "Emergency Contact", "Price Estimates", "Before/After Gallery", "Service Guarantee", "Area Coverage"],
    previewColors: { primary: "#1e40af", secondary: "#f59e0b", accent: "#10b981" },
    layout: {
      heroStyle: "trust-builder",
      navPosition: "utility-top",
      serviceDisplay: "icon-grid",
      showTeam: true,
      ctaStyle: "call-now-urgent",
      footerStyle: "trust-signals"
    }
  },
  // 13. Travel & Hospitality
  {
    id: "travel-hospitality",
    name: "Travel & Hospitality",
    businessType: "Travel & Hospitality",
    categoryKeywords: ["travel", "hotel", "resort", "tour", "taxi", "tourism", "holiday", "vacation", "booking"],
    icon: Plane,
    description: "Wanderlust-inspiring design for travel agencies, hotels, resorts, and tour operators. Destination-focused.",
    features: ["Destination Gallery", "Package Tours", "Hotel Rooms", "Booking System", "Traveler Reviews", "Itinerary Builder"],
    previewColors: { primary: "#0369a1", secondary: "#fbbf24", accent: "#06b6d4" },
    layout: {
      heroStyle: "destination-showcase",
      navPosition: "transparent-overlay",
      serviceDisplay: "package-cards",
      showTeam: true,
      ctaStyle: "book-trip",
      footerStyle: "travel-info"
    }
  },
  // 14. Events & Creative
  {
    id: "events-creative",
    name: "Events & Creative",
    businessType: "Events & Creative",
    categoryKeywords: ["events", "wedding", "photography", "video", "dj", "entertainment", "banquet", "party", "creative"],
    icon: Camera,
    description: "Visual-first design for event planners, photographers, videographers, and creative professionals. Portfolio-focused.",
    features: ["Portfolio Gallery", "Event Packages", "Booking Calendar", "Client Stories", "Behind the Scenes", "Inquiry Form"],
    previewColors: { primary: "#171717", secondary: "#fafafa", accent: "#a855f7" },
    layout: {
      heroStyle: "fullscreen-gallery",
      navPosition: "minimal-overlay",
      serviceDisplay: "masonry-grid",
      showTeam: true,
      ctaStyle: "inquire-elegant",
      footerStyle: "minimal-dark"
    }
  },
  // 15. Construction
  {
    id: "construction",
    name: "Construction",
    businessType: "Construction",
    categoryKeywords: ["construction", "contractor", "architect", "civil", "building", "infrastructure", "engineering", "builder"],
    icon: HardHat,
    description: "Robust design for construction companies, contractors, architects, and civil engineers. Project portfolio focused.",
    features: ["Project Gallery", "Services List", "Equipment Fleet", "Certifications", "Client Testimonials", "Get Quote"],
    previewColors: { primary: "#b45309", secondary: "#fbbf24", accent: "#0f172a" },
    layout: {
      heroStyle: "project-showcase",
      navPosition: "industrial-top",
      serviceDisplay: "project-cards",
      showTeam: true,
      ctaStyle: "get-quote",
      footerStyle: "industrial"
    }
  }
];

// Function to find recommended layouts based on vendor category
export function getRecommendedLayouts(vendorCategory: string | undefined): string[] {
  if (!vendorCategory) return ["general-modern"];
  
  // Check direct match in category map
  const normalizedCategory = vendorCategory.trim();
  if (categoryLayoutMap[normalizedCategory]) {
    return categoryLayoutMap[normalizedCategory];
  }
  
  // Check for partial match in category keywords
  const lowerCategory = normalizedCategory.toLowerCase();
  for (const layout of websiteLayouts) {
    if (layout.categoryKeywords.some(keyword => lowerCategory.includes(keyword))) {
      return [layout.id, "general-modern"];
    }
  }
  
  // Check partial match in map keys
  for (const [key, layouts] of Object.entries(categoryLayoutMap)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return layouts;
    }
  }
  
  return ["general-modern", "retail-classic"];
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

  // Get recommended layouts based on vendor's business category
  const recommendedLayoutIds = useMemo(() => {
    return getRecommendedLayouts(vendorCategory);
  }, [vendorCategory]);

  // Sort layouts: recommended first, then others
  const sortedLayouts = useMemo(() => {
    const recommended = websiteLayouts.filter(l => recommendedLayoutIds.includes(l.id));
    const others = websiteLayouts.filter(l => !recommendedLayoutIds.includes(l.id));
    return [...recommended, ...others];
  }, [recommendedLayoutIds]);

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
          <Layout className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Choose Your Website Layout</CardTitle>
            <CardDescription className="mt-1">
          {vendorCategory ? (
                <>Based on "<span className="font-medium text-foreground">{vendorCategory}</span>", we recommend layouts optimized for your industry.</>
          ) : (
                <>Select a professional layout designed for your business type. All layouts are mobile-responsive and conversion-optimized.</>
          )}
        </CardDescription>
          </div>
        </div>
        
        {/* Layout Stats */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span><strong>{websiteLayouts.length}</strong> Professional Templates</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span><strong>100%</strong> Mobile Responsive</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>High-Converting Designs</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        {/* Recommended Section */}
        {vendorCategory && recommendedLayoutIds.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 text-sm">
                ✨ Recommended for You
              </Badge>
              <span className="text-sm text-muted-foreground">Best match for your business</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedLayouts.filter(l => recommendedLayoutIds.includes(l.id)).map((layout) => (
                <LayoutCard
                  key={layout.id}
                  layout={layout}
                  isSelected={selectedLayout === layout.id}
                  isRecommended={true}
                  onSelect={() => onLayoutChange(layout.id)}
                  onPreview={() => setPreviewLayout(layout)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Layouts Section */}
        <div>
          {vendorCategory && recommendedLayoutIds.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">All Industry Templates</span>
                <Badge variant="secondary" className="text-xs">{sortedLayouts.filter(l => !recommendedLayoutIds.includes(l.id)).length}</Badge>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(vendorCategory ? sortedLayouts.filter(l => !recommendedLayoutIds.includes(l.id)) : sortedLayouts).map((layout) => (
              <LayoutCard
                key={layout.id}
                layout={layout}
                isSelected={selectedLayout === layout.id}
                isRecommended={false}
                onSelect={() => onLayoutChange(layout.id)}
                onPreview={() => setPreviewLayout(layout)}
              />
            ))}
          </div>
        </div>

        {/* Layout Preview Dialog */}
        <Dialog open={!!previewLayout} onOpenChange={() => setPreviewLayout(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                {previewLayout?.name} - Layout Preview
                <Badge variant="secondary" className="ml-2">{previewLayout?.businessType}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 100px)' }}>
              {previewLayout && (
                <LayoutPreview 
                  layout={previewLayout} 
                  formData={formData}
                  services={services}
                  products={products}
                />
              )}
            </div>
            <div className="px-6 py-4 border-t bg-muted/50 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Click "Select This Layout" to apply this design to your website
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewLayout(null)}>
                  Close
                </Button>
                <Button 
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

// Layout Card Component - MNC Level Professional Design
function LayoutCard({ 
  layout, 
  isSelected, 
  isRecommended,
  onSelect, 
  onPreview 
}: { 
  layout: typeof websiteLayouts[0];
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const LayoutIcon = layout.icon;
  
  return (
    <div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer group",
        "hover:shadow-2xl hover:-translate-y-1",
        isSelected
          ? "border-2 ring-4 shadow-xl"
          : isRecommended
          ? "border-green-400 shadow-lg shadow-green-100 dark:shadow-green-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
      )}
      style={isSelected ? { borderColor: layout.previewColors.primary, '--tw-ring-color': `${layout.previewColors.primary}30` } as any : {}}
      onClick={onSelect}
    >
      {/* Recommended Badge */}
      {isRecommended && !isSelected && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5 shadow-lg">
            ✨ Recommended
          </Badge>
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: layout.previewColors.primary }}
          >
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Layout Preview Header - Professional Mockup */}
      <div 
        className="h-36 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${layout.previewColors.primary} 0%, ${layout.previewColors.accent} 100%)`
        }}
      >
        {/* Mini Website Mockup - Professional Design */}
        <div className="absolute inset-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-inner overflow-hidden">
          {/* Mini Header */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b bg-gray-50">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layout.previewColors.primary }} />
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-[50px]" />
            <div className="flex gap-1">
              <div className="w-8 h-2 bg-gray-200 rounded-sm" />
              <div className="w-8 h-2 bg-gray-200 rounded-sm" />
              <div className="w-8 h-2 bg-gray-200 rounded-sm" />
            </div>
          </div>
          {/* Mini Hero */}
          <div className="px-2 py-2">
            <div className="grid grid-cols-5 gap-1.5">
              <div className="col-span-3 space-y-1">
                <div className="h-2 rounded-full" style={{ backgroundColor: `${layout.previewColors.primary}40`, width: '80%' }} />
                <div className="h-1.5 bg-gray-200 rounded-full w-full" />
                <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
                <div className="flex gap-1 mt-2">
                  <div className="h-4 w-10 rounded" style={{ backgroundColor: layout.previewColors.secondary }} />
                  <div className="h-4 w-10 rounded border border-gray-300" />
          </div>
              </div>
              <div className="col-span-2 rounded-lg" style={{ backgroundColor: `${layout.previewColors.primary}20` }} />
            </div>
          </div>
          {/* Mini Cards */}
          <div className="px-2 grid grid-cols-4 gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-100 rounded h-6" />
            ))}
          </div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button 
            size="sm" 
            variant="secondary" 
            className="gap-1.5 shadow-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          </div>
      </div>

      {/* Layout Info */}
      <div className="p-4 bg-card">
        {/* Icon and Name */}
        <div className="flex items-start gap-3 mb-3">
            <div 
            className="p-2.5 rounded-xl shrink-0 shadow-sm"
            style={{ backgroundColor: `${layout.previewColors.primary}15` }}
            >
              <LayoutIcon 
              className="h-5 w-5" 
                style={{ color: layout.previewColors.primary }}
              />
            </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight mb-1 truncate">{layout.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {layout.description}
            </p>
          </div>
        </div>
        
        {/* Features - Compact Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {layout.features.slice(0, 4).map((feature) => (
            <span 
              key={feature}
              className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-medium"
            >
              {feature}
            </span>
          ))}
          {layout.features.length > 4 && (
            <span 
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${layout.previewColors.primary}15`, color: layout.previewColors.primary }}
            >
              +{layout.features.length - 4} more
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
        <Button
          type="button"
            variant={isSelected ? "default" : "outline"}
          size="sm"
            className="flex-1 gap-1.5 h-9 font-medium"
            style={isSelected ? { backgroundColor: layout.previewColors.primary, color: 'white' } : {}}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Selected
              </>
            ) : (
              <>
                <Layout className="h-3.5 w-3.5" />
                Select
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-3 h-9"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPreview();
          }}
        >
            <Eye className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  );
}

// Layout Preview Component - Clean, Premium MNC-level website preview like Shopify templates
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
  // Use form's selected colors (from color theme selector) instead of layout preset colors
  const primary = formData?.primaryColor || "#2563eb";
  const secondary = formData?.secondaryColor || "#f97316";
  const accent = formData?.accentColor || "#06b6d4";
  
  // Step 1: Business Info
  const businessName = formData?.businessName || "YourBrand";
  const tagline = formData?.tagline || "Your Modern Business Name";
  const description = formData?.description || "Our mission is to provide the highest quality products and services to our valued customers. Learn more about our journey, our team, and our commitment to excellence.";
  const logo = formData?.logo;
  
  // Step 2: Contact Info
  const contactPhone = formData?.contactPhone || "+91 98765 43210";
  const contactEmail = formData?.contactEmail || "contact@yourbrand.com";
  const address = formData?.address || "123 Main Street, Anytown, India";
  
  // Step 3: Business Hours
  const businessHours = formData?.businessHours?.length > 0 ? formData.businessHours : [
    { day: 'Monday - Friday', isOpen: true, slots: [{ open: '9:00 AM', close: '6:00 PM' }], breakStart: '1:00 PM', breakEnd: '2:00 PM' },
    { day: 'Saturday', isOpen: true, slots: [{ open: '10:00 AM', close: '4:00 PM' }], breakStart: '1:00 PM', breakEnd: '1:30 PM' },
    { day: 'Sunday', isOpen: false, slots: [] },
  ];
  
  // Step 4: Hero Media/Gallery
  const heroMedia = formData?.heroMedia?.length > 0 ? formData.heroMedia : [];
  
  // Step 5: Team Members
  const teamMembers = formData?.teamMembers?.length > 0 ? formData.teamMembers : [
    { name: 'John Doe', role: 'Founder & CEO', photo: null },
    { name: 'Jane Smith', role: 'Lead Designer', photo: null },
    { name: 'Alex Johnson', role: 'Marketing Head', photo: null },
    { name: 'Emily White', role: 'Operations Manager', photo: null },
  ];
  
  // Step 6: FAQs
  const faqs = formData?.faqs?.length > 0 ? formData.faqs : [
    { question: 'What is your return policy?', answer: 'We offer a 30-day return policy on all our products. If you are not satisfied with your purchase, you can return it for a full refund or exchange.' },
    { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 50 countries worldwide. International shipping typically takes 7-14 business days.' },
    { question: 'How can I track my order?', answer: 'Once your order is shipped, you will receive a tracking number via email. You can use this to track your order on our website.' },
  ];
  
  // Step 7: Testimonials
  const testimonials = formData?.testimonials?.length > 0 ? formData.testimonials : [];
  
  // Step 8 & 9: Services and Products (from catalog)
  const displayServices = services.length > 0 ? services : [
    { id: '1', name: 'Service One', description: 'A short, catchy description.', price: 1999, image: null },
    { id: '2', name: 'Service Two', description: 'A short, catchy description.', price: 2499, image: null },
    { id: '3', name: 'Service Three', description: 'A short, catchy description.', price: 1499, image: null },
    { id: '4', name: 'Consulting', description: 'Expert guidance for your business.', price: 4999, image: null },
  ];

  const displayProducts = products.length > 0 ? products : [
    { id: '1', name: 'Product A', description: 'A short, catchy description.', salePrice: 3999, price: null, image: null },
    { id: '2', name: 'Product B', description: 'A short, catchy description.', salePrice: 6499, price: null, image: null },
    { id: '3', name: 'Product C', description: 'A short, catchy description.', salePrice: 2499, price: null, image: null },
    { id: '4', name: 'Product D', description: 'A short, catchy description.', salePrice: 7999, price: null, image: null },
  ];
  
  // Offers data
  const offers = [
    { title: '20% Off All Services', description: 'Valid until end of month.', badge: '20% DISCOUNT', image: null, cta: 'Get Code', color: '#dcfce7' },
    { title: 'Premium Package Deal', description: 'Get our top services at special price.', badge: null, image: null, cta: 'View Details', color: '#fef3c7' },
    { title: 'New Product Launch!', description: 'Be the first to try our latest arrival.', badge: null, image: null, cta: 'Learn More', color: '#dbeafe' },
    { title: 'Student Discount', description: 'Show your ID to avail the offer.', badge: null, image: null, cta: 'View Details', color: '#fce7f3' },
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* ===== HEADER - Clean & Minimal ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {logo ? (
                <img src={logo} alt={businessName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primary }}
                >
                  {businessName.charAt(0)}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{businessName}</span>
                </div>
                )}
              </div>
            
            {/* Navigation - Center */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#offerings" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Our Offerings</a>
              <a href="#gallery" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
              <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQs</a>
            </nav>
            
            {/* CTA Button */}
              <Button 
                size="sm" 
              className="rounded-full px-6 font-medium shadow-sm"
              style={{ backgroundColor: secondary, color: 'white' }}
              >
              Inquire Now
              </Button>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION - Clean Split Layout ===== */}
      <section className="bg-gradient-to-br from-teal-50 via-cyan-50 to-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Your Modern<br />Business Name
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">4.9 (1,200 reviews)</span>
              </div>
              
              {/* Address */}
              <div className="flex items-center gap-2 text-gray-600 mb-8">
                <span className="text-gray-400">📍</span>
                <span className="text-sm">{address}</span>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="rounded-full px-6 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: primary, color: 'white' }}
                >
                  📍 Directions
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full px-6 py-2.5 text-sm font-medium border-gray-300"
                >
                  📞 Contact Us
                </Button>
                  <Button 
                  className="rounded-full px-6 py-2.5 text-sm font-medium bg-green-500 hover:bg-green-600 text-white"
                  >
                  💬 WhatsApp
                  </Button>
              </div>
            </div>
            
            {/* Right - Hero Image */}
            <div className="relative">
              {heroMedia.length > 0 ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={heroMedia[0]} 
                    alt={businessName} 
                    className="w-full h-[400px] object-cover"
                  />
                  </div>
              ) : (
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-teal-100 to-cyan-200 h-[400px] flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white/50 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">🏢</span>
              </div>
                    <p className="text-teal-700 font-medium">Your Hero Image</p>
          </div>
        </div>
              )}
              {/* Decorative pendant lights */}
              <div className="absolute -top-8 right-1/4 w-4 h-16 bg-gradient-to-b from-amber-200 to-amber-400 rounded-b-full opacity-60"></div>
              <div className="absolute -top-8 right-1/3 w-4 h-12 bg-gradient-to-b from-amber-200 to-amber-400 rounded-b-full opacity-40"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OFFERS AND COUPONS ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Offers and Coupons</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offers.map((offer, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all bg-white">
                <div 
                  className="h-36 flex items-center justify-center relative"
                  style={{ backgroundColor: offer.color }}
                >
                  {offer.badge && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-600 text-white text-xs">{offer.badge}</Badge>
          </div>
                  )}
                  {offer.image ? (
                    <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{idx === 0 ? '🎉' : idx === 1 ? '⭐' : idx === 2 ? '🆕' : '🎓'}</span>
                  )}
              </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{offer.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{offer.description}</p>
                  <Button 
                    size="sm" 
                    className="w-full rounded-lg text-xs"
                    style={{ backgroundColor: secondary, color: 'white' }}
                  >
                    {offer.cta}
                  </Button>
            </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OUR SERVICES ===== */}
      <section id="offerings" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Services</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">Discover the range of professional services we offer to help you achieve your goals.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayServices.slice(0, 4).map((service: any, idx: number) => (
              <div key={service.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {service.image ? (
                    <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-300">
                      <layout.icon className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: primary }}>₹{service.price?.toLocaleString()}</span>
                    <Button 
                      size="sm" 
                      className="rounded-lg text-xs px-4"
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

      {/* ===== OUR PRODUCTS ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Products</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.slice(0, 4).map((product: any, idx: number) => (
              <div key={product.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: primary }}>
                        ₹{(product.salePrice || product.price)?.toLocaleString()}
                      </span>
                      {product.price && product.salePrice && product.price > product.salePrice && (
                        <span className="text-xs text-gray-400 line-through">₹{product.price?.toLocaleString()}</span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-lg text-xs px-4"
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

      {/* ===== ABOUT US & TEAM ===== */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* About Text */}
            <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              {description}
            </p>
            </div>
          
          {/* Our Team */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Our Team</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {teamMembers.slice(0, 4).map((member: any, idx: number) => (
                <div key={idx} className="text-center">
                <div 
                    className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-md overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
                >
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name?.charAt(0)
                  )}
                </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{member.name}</h4>
                  <p className="text-xs" style={{ color: primary }}>{member.role}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BUSINESS HOURS ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Business Hours</h2>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="grid grid-cols-2 gap-8">
              {/* Working Hours */}
                  <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Working Hours</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="text-gray-900">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="text-gray-900">10:00 AM - 4:00 PM</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="text-red-500 font-medium">Closed</span>
              </div>
          </div>
        </div>

              {/* Break Time */}
            <div>
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Break Time</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="text-gray-900">1:00 PM - 2:00 PM</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="text-gray-900">1:00 PM - 1:30 PM</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="text-red-500 font-medium">Closed</span>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQs ===== */}
      <section id="faq" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-3">
            {faqs.slice(0, 3).map((faq: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                  <span className="text-gray-400">▼</span>
                </button>
                <div className="px-6 pb-4">
                  <p className="text-gray-500 text-sm">{faq.answer}</p>
          </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER - Clean & Minimal ===== */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
              </p>
              
            {/* Footer Links */}
            <nav className="flex items-center gap-6 text-sm">
              <a href="#offerings" className="text-gray-600 hover:text-gray-900 transition-colors">Our Offerings</a>
              <a href="#gallery" className="text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQs</a>
            </nav>
              </div>
              
          {/* Vyora Branding */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <a 
              href="https://vyora.club" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span>This website is created with</span>
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Vyora.club</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LayoutSelector;
