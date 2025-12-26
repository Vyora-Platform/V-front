import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Plus, X, Save, ArrowLeft, ArrowRight, Check, Eye, Clock, 
  Calendar, MapPin, Package, Image as ImageIcon, Upload, Trash2,
  ChevronLeft, ChevronRight, Wifi, Car, Thermometer, Bath, Users, 
  GlassWater, Shield, Zap, HeartPulse, UserCheck, CreditCard, 
  SprayCan, Stethoscope, Building2, MessageCircle, Lock, Sparkles,
  Home, FileText, IndianRupee, Layers, Camera
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ServiceDescriptionPage from "@/components/ServiceDescriptionPage";
import type { Category, Subcategory, MasterService, VendorCatalogue } from "@shared/schema";

// Duration types
const DURATION_TYPES = [
  { value: "fixed", label: "Fixed Duration", example: "e.g., 30 min, 1 hour" },
  { value: "variable", label: "Variable Duration Range", example: "e.g., 30-60 min" },
  { value: "long", label: "Long Duration (Day/Week/Month)", example: "e.g., 2 days, 1 week" },
  { value: "session", label: "Session Count", example: "e.g., 5 sessions, 10 classes" },
  { value: "project", label: "Multi-Day Projects", example: "e.g., 3-5 days project" },
];

// Pricing types
const PRICING_TYPES = [
  { value: "per-service", label: "Per Service (One-time)" },
  { value: "price-range", label: "Price Range (Min-Max)" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "per-session", label: "Per Session / Visit" },
  { value: "per-person", label: "Per Person / Per Head" },
  { value: "package", label: "Package Pricing" },
];

// GST Slabs
const GST_SLABS = [
  { value: "0", label: "0% (Exempt)" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
  { value: "custom", label: "Custom GST Rate" },
];

// Time slot durations
const TIME_SLOT_DURATIONS = [
  { value: "15", label: "15 Minutes" },
  { value: "30", label: "30 Minutes" },
  { value: "45", label: "45 Minutes" },
  { value: "60", label: "60 Minutes" },
  { value: "90", label: "90 Minutes" },
  { value: "120", label: "2 Hours" },
];

// Days of week
const DAYS_OF_WEEK = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
];

// Amenities list with better icons
const AMENITIES_LIST = [
  { id: "wifi", label: "Free Wi-Fi", icon: Wifi, color: "text-blue-500" },
  { id: "parking", label: "Parking Space", icon: Car, color: "text-slate-600" },
  { id: "ac", label: "Air Conditioning", icon: Thermometer, color: "text-cyan-500" },
  { id: "washroom", label: "Clean Washrooms", icon: Bath, color: "text-teal-500" },
  { id: "waiting", label: "Waiting Area", icon: Users, color: "text-indigo-500" },
  { id: "water", label: "Drinking Water", icon: GlassWater, color: "text-sky-500" },
  { id: "cctv", label: "CCTV / Security", icon: Shield, color: "text-red-500" },
  { id: "power", label: "Power Backup", icon: Zap, color: "text-yellow-500" },
  { id: "staff", label: "Staff Assistance", icon: UserCheck, color: "text-green-500" },
  { id: "payment", label: "Online Payment", icon: CreditCard, color: "text-violet-500" },
  { id: "housekeeping", label: "Housekeeping", icon: SprayCan, color: "text-pink-500" },
  { id: "firstaid", label: "First Aid", icon: HeartPulse, color: "text-rose-500" },
  { id: "lift", label: "Lift / Elevator", icon: Building2, color: "text-gray-600" },
  { id: "consultation", label: "Free Consultation", icon: MessageCircle, color: "text-emerald-500" },
  { id: "locker", label: "Locker Facility", icon: Lock, color: "text-amber-600" },
];

// Inventory type examples
const INVENTORY_EXAMPLES = {
  limited: "Examples: Rooms, seats, vehicles, tools, dresses, electronics, tables, equipment",
  unlimited: "Examples: Home service, coaching, memberships, appointments, consultations",
};

interface ServiceListingFormProps {
  initialData?: Partial<MasterService | VendorCatalogue>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit" | "duplicate";
  userType: "admin" | "vendor";
  onSaveDraft?: (data: any) => void;
}

// Generate time slots based on duration
const generateTimeSlots = (duration: number): string[] => {
  const slots: string[] = [];
  const startHour = 10;
  const endHour = 22;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      if (hour + (minute + duration) / 60 > endHour) break;
      
      const startTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
      const endMinute = minute + duration;
      let endHourActual = hour + Math.floor(endMinute / 60);
      const endMinuteActual = endMinute % 60;
      const endTime = `${endHourActual > 12 ? endHourActual - 12 : endHourActual}:${endMinuteActual.toString().padStart(2, '0')} ${endHourActual >= 12 ? 'PM' : 'AM'}`;
      
      slots.push(`${startTime} - ${endTime}`);
    }
  }
  return slots;
};

export default function ServiceListingForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
  userType,
  onSaveDraft,
}: ServiceListingFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Fetch categories and subcategories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  // ============== STEP 1: Basic Service Information ==============
  const [categoryId, setCategoryId] = useState(initialData.categoryId || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [subcategoryId, setSubcategoryId] = useState(initialData.subcategoryId || "");
  const [subcategory, setSubcategory] = useState(initialData.subcategory || "");
  const [serviceName, setServiceName] = useState(initialData.name || "");
  const [durationType, setDurationType] = useState((initialData as any)?.durationType || "fixed");
  const [durationValue, setDurationValue] = useState((initialData as any)?.durationValue || "");
  const [durationUnit, setDurationUnit] = useState((initialData as any)?.durationUnit || "minutes");
  const [durationMin, setDurationMin] = useState((initialData as any)?.durationMin || "");
  const [durationMax, setDurationMax] = useState((initialData as any)?.durationMax || "");
  const [sessionCount, setSessionCount] = useState((initialData as any)?.sessionCount || "");

  // ============== STEP 2: Pricing & Availability ==============
  const [basePrice, setBasePrice] = useState((initialData as any)?.basePrice || (initialData as any)?.price || "");
  const [offerPrice, setOfferPrice] = useState(initialData.offerPrice || "");
  const [gstSlab, setGstSlab] = useState(
    initialData.taxPercentage && [0, 5, 12, 18, 28].includes(initialData.taxPercentage)
      ? String(initialData.taxPercentage)
      : initialData.taxPercentage ? "custom" : "18"
  );
  const [customGstRate, setCustomGstRate] = useState(
    initialData.taxPercentage && ![0, 5, 12, 18, 28].includes(initialData.taxPercentage)
      ? initialData.taxPercentage
      : 0
  );
  const [gstIncluded, setGstIncluded] = useState(initialData.gstIncluded || false);
  const [pricingType, setPricingType] = useState((initialData as any)?.pricingType || "per-service");
  const [priceMin, setPriceMin] = useState((initialData as any)?.priceMin || "");
  const [priceMax, setPriceMax] = useState((initialData as any)?.priceMax || "");
  const [packagePricing, setPackagePricing] = useState<{name: string, sessions: number, price: number}[]>(
    (initialData as any)?.packagePricing || []
  );
  
  // Delivery modes
  const [deliveryModes, setDeliveryModes] = useState<string[]>((initialData as any)?.deliveryModes || ["business-location"]);
  const [homeServiceChargeType, setHomeServiceChargeType] = useState<"free" | "paid">((initialData as any)?.homeServiceChargeType || "free");
  const [homeServiceCharges, setHomeServiceCharges] = useState<{label: string, amount: number, taxSlab: string}[]>(
    (initialData as any)?.homeServiceCharges || []
  );
  
  // Service days - all prefilled by default
  const [serviceDays, setServiceDays] = useState<string[]>(
    initialData.availableDays?.length ? initialData.availableDays : DAYS_OF_WEEK.map(d => d.value)
  );
  
  // Time slots
  const [timeSlotDuration, setTimeSlotDuration] = useState((initialData as any)?.timeSlotDuration || "30");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(initialData.availableTimeSlots || []);
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>((initialData as any)?.customTimeSlots || []);

  // ============== STEP 3: Inventory Type ==============
  const [inventoryType, setInventoryType] = useState<"limited" | "unlimited">((initialData as any)?.inventoryType || "unlimited");
  const [inventoryItems, setInventoryItems] = useState<{
    name: string;
    identifier: string;
    variants: {name: string, value: string}[];
    available: boolean;
  }[]>((initialData as any)?.inventoryItems || []);
  const [newInventoryName, setNewInventoryName] = useState("");
  const [newInventoryIdentifier, setNewInventoryIdentifier] = useState("");

  // ============== STEP 4: Description & Details ==============
  const [description, setDescription] = useState(initialData.description || initialData.detailedDescription || "");
  const [inclusions, setInclusions] = useState<string[]>(initialData.inclusions || []);
  const [exclusions, setExclusions] = useState<string[]>(initialData.exclusions || []);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>((initialData as any)?.amenities || []);
  const [customAmenities, setCustomAmenities] = useState<string[]>((initialData as any)?.customAmenities || []);
  const [policies, setPolicies] = useState<{title: string, content: string}[]>((initialData as any)?.policies || []);
  
  // Temp inputs
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [newPolicyTitle, setNewPolicyTitle] = useState("");
  const [newPolicyContent, setNewPolicyContent] = useState("");

  // ============== STEP 5: Media Upload ==============
  const [images, setImages] = useState<string[]>(initialData.images || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Filter subcategories based on selected category
  const filteredSubcategories = categoryId
    ? allSubcategories.filter(sub => sub.categoryId === categoryId)
    : [];

  // Scroll to top when step changes
  useEffect(() => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setCategoryId("");
    } else {
      const selectedCategory = categories.find(cat => cat.id === value);
      if (selectedCategory) {
        setCategoryId(value);
        setCategory(selectedCategory.name);
        setSubcategoryId("");
        setSubcategory("");
      }
    }
  };

  // Handle subcategory change
  const handleSubcategoryChange = (value: string) => {
    if (value === "custom") {
      setSubcategoryId("");
    } else {
      const selectedSubcategory = allSubcategories.find(sub => sub.id === value);
      if (selectedSubcategory) {
        setSubcategoryId(value);
        setSubcategory(selectedSubcategory.name);
      }
    }
  };

  // Build form data for submission
  const buildFormData = useCallback(() => {
    const finalGstRate = gstSlab === "custom" ? customGstRate : Number(gstSlab);
    
    return {
      name: serviceName,
      category,
      categoryId: categoryId || undefined,
      subcategory: subcategory || undefined,
      subcategoryId: subcategoryId || undefined,
      durationType,
      durationValue,
      durationUnit,
      durationMin,
      durationMax,
      sessionCount,
      serviceType: "service",
      icon: "💼",
      
      ...(userType === "admin" ? { basePrice: Number(basePrice) } : { price: Number(basePrice) }),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      pricingType,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      packagePricing,
      taxPercentage: finalGstRate,
      gstIncluded,
      deliveryModes,
      homeServiceChargeType,
      homeServiceCharges,
      availableDays: serviceDays,
      timeSlotDuration,
      availableTimeSlots: [...selectedTimeSlots, ...customTimeSlots],
      customTimeSlots,
      
      inventoryType,
      inventoryItems,
      
      description,
      shortDescription: description.substring(0, 150),
      detailedDescription: description,
      inclusions,
      exclusions,
      amenities: selectedAmenities,
      customAmenities,
      policies,
      
      images,
      
      benefits: [],
      features: [],
      highlights: [],
      tags: [],
      bookingRequired: deliveryModes.includes("home-service"),
      freeTrialAvailable: false,
    };
  }, [
    serviceName, category, categoryId, subcategory, subcategoryId, durationType, durationValue,
    durationUnit, durationMin, durationMax, sessionCount, basePrice, offerPrice, pricingType,
    priceMin, priceMax, packagePricing, gstSlab, customGstRate, gstIncluded, deliveryModes,
    homeServiceChargeType, homeServiceCharges, serviceDays, timeSlotDuration, selectedTimeSlots,
    customTimeSlots, inventoryType, inventoryItems, description, inclusions, exclusions,
    selectedAmenities, customAmenities, policies, images, userType
  ]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const formData = buildFormData();
      localStorage.setItem('service_draft', JSON.stringify({
        ...formData,
        currentStep,
        lastSaved: new Date().toISOString(),
      }));
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [buildFormData, currentStep]);

  // Load draft on mount
  useEffect(() => {
    if (mode === "create" && !initialData.name) {
      const savedDraft = localStorage.getItem('service_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.name) {
            const restore = window.confirm("You have a saved draft. Would you like to restore it?");
            if (restore) {
              setServiceName(draft.name || "");
              setCategory(draft.category || "");
              setCategoryId(draft.categoryId || "");
              setSubcategory(draft.subcategory || "");
              setSubcategoryId(draft.subcategoryId || "");
              setDurationType(draft.durationType || "fixed");
              setDurationValue(draft.durationValue || "");
              setBasePrice(draft.basePrice || draft.price || "");
              setOfferPrice(draft.offerPrice || "");
              setDescription(draft.description || "");
              setInclusions(draft.inclusions || []);
              setExclusions(draft.exclusions || []);
              setServiceDays(draft.availableDays || DAYS_OF_WEEK.map(d => d.value));
              setSelectedTimeSlots(draft.availableTimeSlots || []);
              setImages(draft.images || []);
              if (draft.currentStep) setCurrentStep(draft.currentStep);
            }
          }
        } catch (e) {
          console.error("Failed to parse draft:", e);
        }
      }
    }
  }, [mode, initialData.name]);

  // Handle cancel with draft save
  const handleCancel = () => {
    const formData = buildFormData();
    if (formData.name) {
      localStorage.setItem('service_draft', JSON.stringify({
        ...formData,
        currentStep,
        lastSaved: new Date().toISOString(),
        status: 'draft',
      }));
      toast({
        title: "Draft Saved",
        description: "Your service has been saved as a draft. You can resume later.",
      });
    }
    onCancel();
  };

  // Handle form submission
  const handleSubmit = () => {
    const formData = buildFormData();
    
    if (!formData.name) {
      toast({ title: "Service name is required", variant: "destructive" });
      setCurrentStep(1);
      return;
    }
    if (!formData.category) {
      toast({ title: "Category is required", variant: "destructive" });
      setCurrentStep(1);
      return;
    }
    if (!formData.basePrice && !formData.price) {
      toast({ title: "Base price is required", variant: "destructive" });
      setCurrentStep(2);
      return;
    }

    localStorage.removeItem('service_draft');
    onSubmit(formData);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentCount = images.length + imageFiles.length;
      
      if (currentCount + files.length > 5) {
        toast({
          title: "Maximum 5 images allowed",
          description: `You can only upload ${5 - currentCount} more image(s)`,
          variant: "destructive",
        });
        return;
      }

      setImageFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= images.length - 1) {
      setCurrentImageIndex(Math.max(0, images.length - 2));
    }
  };

  // Add inventory item
  const addInventoryItem = () => {
    if (newInventoryName && newInventoryIdentifier) {
      setInventoryItems(prev => [...prev, {
        name: newInventoryName,
        identifier: newInventoryIdentifier,
        variants: [],
        available: true,
      }]);
      setNewInventoryName("");
      setNewInventoryIdentifier("");
    }
  };

  // Step indicator with icons
  const steps = [
    { number: 1, title: "Basic Info", shortTitle: "Basic", icon: FileText },
    { number: 2, title: "Pricing & Availability", shortTitle: "Pricing", icon: IndianRupee },
    { number: 3, title: "Inventory", shortTitle: "Inventory", icon: Layers },
    { number: 4, title: "Details", shortTitle: "Details", icon: Sparkles },
    { number: 5, title: "Media", shortTitle: "Media", icon: Camera },
  ];

  // Generated time slots
  const availableTimeSlots = generateTimeSlots(Number(timeSlotDuration));

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div 
      ref={formContainerRef}
      className="flex flex-col h-full min-h-0 overflow-y-auto"
    >
      {/* Mobile Header - Fixed */}
      <div className="md:hidden sticky top-0 z-20 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={currentStep > 1 ? goToPreviousStep : handleCancel}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{currentStep > 1 ? 'Back' : 'Cancel'}</span>
          </button>
          <span className="text-sm font-medium">Step {currentStep} of 5</span>
          <button 
            onClick={() => setShowPreview(true)}
            className="text-primary text-sm font-medium"
          >
            Preview
          </button>
        </div>
        
        {/* Mobile Progress Bar */}
        <div className="flex gap-1">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`h-1 flex-1 rounded-full transition-all ${
                currentStep >= step.number 
                  ? currentStep === step.number ? 'bg-primary' : 'bg-green-500'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block mb-6 pt-2">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : currentStep > step.number
                      ? "bg-green-500 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {currentStep > step.number ? (
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      currentStep === step.number ? 'bg-white/20' : 'bg-muted'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  )}
                  <span className="text-sm font-medium hidden lg:inline">{step.title}</span>
                  <span className="text-sm font-medium lg:hidden">{step.shortTitle}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${
                    currentStep > step.number ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 md:px-0 pb-32 md:pb-6 space-y-6">
        
        {/* Step 1: Basic Service Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-1">Basic Service Information</h2>
              <p className="text-muted-foreground text-sm">Define your service category and duration</p>
            </div>

            <Card className="border-0 shadow-sm md:border md:shadow-none">
              <CardContent className="p-4 md:p-6 space-y-6">
                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Service Industry / Category *</Label>
                    <Select value={categoryId || "custom"} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                        <SelectItem value="custom">Others (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                    {!categoryId && (
                      <Input
                        className="h-12 md:h-10 mt-2"
                        placeholder="Enter custom category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subcategory</Label>
                    {categoryId ? (
                      <>
                        <Select value={subcategoryId || "custom"} onValueChange={handleSubcategoryChange}>
                          <SelectTrigger className="h-12 md:h-10">
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSubcategories.map(sub => (
                              <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                            ))}
                            <SelectItem value="custom">Others (Custom)</SelectItem>
                          </SelectContent>
                        </Select>
                        {!subcategoryId && (
                          <Input
                            className="h-12 md:h-10 mt-2"
                            placeholder="Enter custom subcategory"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                          />
                        )}
                      </>
                    ) : (
                      <Input
                        className="h-12 md:h-10"
                        placeholder="Enter custom subcategory"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Service Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service Name *</Label>
                  <Input
                    className="h-12 md:h-10"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g., Premium Haircut, Deep Tissue Massage"
                  />
                </div>

                {/* Service Duration */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Service Duration *</Label>
                  <Select value={durationType} onValueChange={setDurationType}>
                    <SelectTrigger className="h-12 md:h-10">
                      <SelectValue placeholder="Select duration type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.example}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {durationType === "fixed" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Duration value"
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                      />
                      <Select value={durationUnit} onValueChange={setDurationUnit}>
                        <SelectTrigger className="h-12 md:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {durationType === "variable" && (
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Min"
                        value={durationMin}
                        onChange={(e) => setDurationMin(e.target.value)}
                      />
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Max"
                        value={durationMax}
                        onChange={(e) => setDurationMax(e.target.value)}
                      />
                      <Select value={durationUnit} onValueChange={setDurationUnit}>
                        <SelectTrigger className="h-12 md:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {durationType === "long" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Duration value"
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                      />
                      <Select value={durationUnit} onValueChange={setDurationUnit}>
                        <SelectTrigger className="h-12 md:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {durationType === "session" && (
                    <Input
                      type="number"
                      className="h-12 md:h-10"
                      placeholder="Number of sessions (e.g., 5, 10)"
                      value={sessionCount}
                      onChange={(e) => setSessionCount(e.target.value)}
                    />
                  )}

                  {durationType === "project" && (
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Min days"
                        value={durationMin}
                        onChange={(e) => setDurationMin(e.target.value)}
                      />
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Max days"
                        value={durationMax}
                        onChange={(e) => setDurationMax(e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground">days project</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Pricing & Availability */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-1">Pricing & Availability</h2>
              <p className="text-muted-foreground text-sm">Set prices, days and time slots</p>
            </div>

            <Card className="border-0 shadow-sm md:border md:shadow-none">
              <CardContent className="p-4 md:p-6 space-y-6">
                {/* Base Price & Offer Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Base Price (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="h-12 md:h-10 pl-8"
                        placeholder="999"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Regular service price in Rupees</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Offer Price (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="h-12 md:h-10 pl-8"
                        placeholder="749"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Discounted price (optional)</p>
                  </div>
                </div>

                {/* GST */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">GST Rate</Label>
                    <Select value={gstSlab} onValueChange={setGstSlab}>
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Select GST slab" />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_SLABS.map(slab => (
                          <SelectItem key={slab.value} value={slab.value}>{slab.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {gstSlab === "custom" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Custom GST (%)</Label>
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        value={customGstRate}
                        onChange={(e) => setCustomGstRate(Number(e.target.value))}
                        placeholder="Enter rate"
                      />
                    </div>
                  )}

                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center h-12 md:h-10 gap-3 p-3 rounded-lg bg-muted/50">
                      <Switch
                        id="gst-included"
                        checked={gstIncluded}
                        onCheckedChange={setGstIncluded}
                      />
                      <Label htmlFor="gst-included" className="text-sm cursor-pointer">GST Included</Label>
                    </div>
                  </div>
                </div>

                {/* Pricing Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pricing Type</Label>
                  <Select value={pricingType} onValueChange={setPricingType}>
                    <SelectTrigger className="h-12 md:h-10">
                      <SelectValue placeholder="Select pricing type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {pricingType === "price-range" && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Min price"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                      />
                      <Input
                        type="number"
                        className="h-12 md:h-10"
                        placeholder="Max price"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                      />
                    </div>
                  )}

                  {pricingType === "package" && (
                    <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-xl">
                      <Label className="text-sm font-medium">Package Options</Label>
                      <div className="flex flex-wrap gap-2">
                        {packagePricing.map((pkg, index) => (
                          <Badge key={index} variant="secondary" className="py-1.5 px-3">
                            {pkg.name} - {pkg.sessions} sessions - ₹{pkg.price}
                            <X 
                              className="h-3 w-3 ml-2 cursor-pointer" 
                              onClick={() => setPackagePricing(prev => prev.filter((_, i) => i !== index))}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Package name" id="pkg-name" className="h-10" />
                        <Input type="number" placeholder="Sessions" id="pkg-sessions" className="h-10" />
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Price" id="pkg-price" className="h-10" />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-3 shrink-0 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-sm"
                            onClick={() => {
                              const name = (document.getElementById('pkg-name') as HTMLInputElement)?.value;
                              const sessions = Number((document.getElementById('pkg-sessions') as HTMLInputElement)?.value);
                              const price = Number((document.getElementById('pkg-price') as HTMLInputElement)?.value);
                              if (name && sessions && price) {
                                setPackagePricing(prev => [...prev, { name, sessions, price }]);
                                (document.getElementById('pkg-name') as HTMLInputElement).value = '';
                                (document.getElementById('pkg-sessions') as HTMLInputElement).value = '';
                                (document.getElementById('pkg-price') as HTMLInputElement).value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Delivery Modes */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Delivery Modes</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (deliveryModes.includes("business-location")) {
                          setDeliveryModes(prev => prev.filter(m => m !== "business-location"));
                        } else {
                          setDeliveryModes(prev => [...prev, "business-location"]);
                        }
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        deliveryModes.includes("business-location")
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        deliveryModes.includes("business-location") ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">At Business Location</p>
                        <p className="text-xs text-muted-foreground">Customers visit your location</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (deliveryModes.includes("home-service")) {
                          setDeliveryModes(prev => prev.filter(m => m !== "home-service"));
                        } else {
                          setDeliveryModes(prev => [...prev, "home-service"]);
                        }
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        deliveryModes.includes("home-service")
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        deliveryModes.includes("home-service") ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        <Home className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Home Service</p>
                        <p className="text-xs text-muted-foreground">Service at customer's location</p>
                      </div>
                    </button>
                  </div>

                  {/* Home Service Charges */}
                  {deliveryModes.includes("home-service") && (
                    <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <Label>Home Service Charges:</Label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="homeServiceCharge"
                              checked={homeServiceChargeType === "free"}
                              onChange={() => setHomeServiceChargeType("free")}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Free</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="homeServiceCharge"
                              checked={homeServiceChargeType === "paid"}
                              onChange={() => setHomeServiceChargeType("paid")}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Additional Charges</span>
                          </label>
                        </div>
                      </div>

                      {homeServiceChargeType === "paid" && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {homeServiceCharges.map((charge, index) => (
                              <Badge key={index} variant="outline" className="py-1.5">
                                {charge.label}: ₹{charge.amount} ({charge.taxSlab}% GST)
                                <X 
                                  className="h-3 w-3 ml-2 cursor-pointer" 
                                  onClick={() => setHomeServiceCharges(prev => prev.filter((_, i) => i !== index))}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <Input placeholder="Label" id="charge-label" className="h-10" />
                            <Input type="number" placeholder="Amount" id="charge-amount" className="h-10" />
                            <Select defaultValue="18">
                              <SelectTrigger id="charge-tax" className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="12">12%</SelectItem>
                                <SelectItem value="18">18%</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 px-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-sm"
                              onClick={() => {
                                const label = (document.getElementById('charge-label') as HTMLInputElement)?.value;
                                const amount = Number((document.getElementById('charge-amount') as HTMLInputElement)?.value);
                                const taxSlab = (document.getElementById('charge-tax') as HTMLSelectElement)?.value || "18";
                                if (label && amount) {
                                  setHomeServiceCharges(prev => [...prev, { label, amount, taxSlab }]);
                                  (document.getElementById('charge-label') as HTMLInputElement).value = '';
                                  (document.getElementById('charge-amount') as HTMLInputElement).value = '';
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Servicing Days */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Servicing Days</Label>
                    <p className="text-xs text-muted-foreground mt-1">Tap to toggle day availability</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          if (serviceDays.includes(day.value)) {
                            setServiceDays(prev => prev.filter(d => d !== day.value));
                          } else {
                            setServiceDays(prev => [...prev, day.value]);
                          }
                        }}
                        className={`w-12 h-12 md:w-14 md:h-10 rounded-xl font-medium transition-all ${
                          serviceDays.includes(day.value)
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Time Slots */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Service Time Slots</Label>
                    <Select value={timeSlotDuration} onValueChange={setTimeSlotDuration}>
                      <SelectTrigger className="w-36 h-9">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOT_DURATIONS.map(duration => (
                          <SelectItem key={duration.value} value={duration.value}>{duration.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-3 bg-muted/20 rounded-xl scrollbar-thin">
                    {availableTimeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          if (selectedTimeSlots.includes(slot)) {
                            setSelectedTimeSlots(prev => prev.filter(s => s !== slot));
                          } else {
                            setSelectedTimeSlots(prev => [...prev, slot]);
                          }
                        }}
                        className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                          selectedTimeSlots.includes(slot)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {/* Custom Time Slots */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Add Custom Time Slot</Label>
                    <div className="flex gap-2">
                      {customTimeSlots.map((slot, index) => (
                        <Badge key={index} variant="outline">
                          {slot}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => setCustomTimeSlots(prev => prev.filter((_, i) => i !== index))}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., 6:00 AM - 7:00 AM"
                        id="custom-slot"
                        className="h-10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-3 shrink-0 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-sm"
                        onClick={() => {
                          const slot = (document.getElementById('custom-slot') as HTMLInputElement)?.value;
                          if (slot) {
                            setCustomTimeSlots(prev => [...prev, slot]);
                            (document.getElementById('custom-slot') as HTMLInputElement).value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Inventory Type */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-1">Inventory Type</h2>
              <p className="text-muted-foreground text-sm">Define service capacity limits</p>
            </div>

            <Card className="border-0 shadow-sm md:border md:shadow-none">
              <CardContent className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Limited Inventory */}
                  <button
                    type="button"
                    onClick={() => setInventoryType("limited")}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      inventoryType === "limited"
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        inventoryType === "limited" ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        <Package className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-lg">Limited Inventory</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Services with fixed capacity or countable units
                    </p>
                    <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-lg">
                      {INVENTORY_EXAMPLES.limited}
                    </p>
                  </button>

                  {/* Unlimited Inventory */}
                  <button
                    type="button"
                    onClick={() => setInventoryType("unlimited")}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      inventoryType === "unlimited"
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        inventoryType === "unlimited" ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-lg">Unlimited Inventory</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Services without fixed capacity limits
                    </p>
                    <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-lg">
                      {INVENTORY_EXAMPLES.unlimited}
                    </p>
                  </button>
                </div>

                {/* Limited Inventory Items */}
                {inventoryType === "limited" && (
                  <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Inventory Items</Label>
                      <Badge variant="secondary">{inventoryItems.length} items</Badge>
                    </div>

                    {inventoryItems.length > 0 && (
                      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                        {inventoryItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-background rounded-xl border">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-muted-foreground mx-2">•</span>
                              <span className="text-sm text-muted-foreground">{item.identifier}</span>
                              {item.variants.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {item.variants.map((v, vi) => (
                                    <Badge key={vi} variant="secondary" className="text-xs">
                                      {v.name}: {v.value}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.available}
                                onCheckedChange={(checked) => {
                                  setInventoryItems(prev =>
                                    prev.map((it, i) =>
                                      i === index ? { ...it, available: checked } : it
                                    )
                                  );
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setInventoryItems(prev => prev.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="e.g., Floor 1 Room 5"
                        value={newInventoryName}
                        onChange={(e) => setNewInventoryName(e.target.value)}
                        className="h-12 md:h-10"
                      />
                      <Input
                        placeholder="e.g., R105"
                        value={newInventoryIdentifier}
                        onChange={(e) => setNewInventoryIdentifier(e.target.value)}
                        className="h-12 md:h-10"
                      />
                      <Button 
                        type="button" 
                        onClick={addInventoryItem} 
                        variant="outline"
                        className="h-12 md:h-10 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Add Item
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      💡 Example: For a hotel, add "Floor 1 Room 5" with identifier "R105". For a library, add "Row A Seat 10" with identifier "A-10".
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Description & Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-1">Description & Details</h2>
              <p className="text-muted-foreground text-sm">Add detailed service information</p>
            </div>

            <Card className="border-0 shadow-sm md:border md:shadow-none">
              <CardContent className="p-4 md:p-6 space-y-6">
                {/* Service Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service Description *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your service in detail. Include what customers can expect..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      What's Included
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={newInclusion}
                        onChange={(e) => setNewInclusion(e.target.value)}
                        placeholder="e.g., Consultation, Materials"
                        className="h-11"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newInclusion.trim()) {
                              setInclusions(prev => [...prev, newInclusion.trim()]);
                              setNewInclusion("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-4 shrink-0 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => {
                          if (newInclusion.trim()) {
                            setInclusions(prev => [...prev, newInclusion.trim()]);
                            setNewInclusion("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inclusions.map((item, i) => (
                        <Badge key={i} className="bg-green-50 text-green-700 border-green-200 py-1.5 gap-1">
                          <Check className="h-3 w-3" />
                          {item}
                          <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setInclusions(prev => prev.filter((_, idx) => idx !== i))} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <X className="h-4 w-4 text-red-500" />
                      Not Included
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={newExclusion}
                        onChange={(e) => setNewExclusion(e.target.value)}
                        placeholder="e.g., Transportation, Extra hours"
                        className="h-11"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newExclusion.trim()) {
                              setExclusions(prev => [...prev, newExclusion.trim()]);
                              setNewExclusion("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-4 shrink-0 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => {
                          if (newExclusion.trim()) {
                            setExclusions(prev => [...prev, newExclusion.trim()]);
                            setNewExclusion("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exclusions.map((item, i) => (
                        <Badge key={i} className="bg-red-50 text-red-700 border-red-200 py-1.5 gap-1">
                          <X className="h-3 w-3" />
                          {item}
                          <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setExclusions(prev => prev.filter((_, idx) => idx !== i))} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Amenities */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Amenities</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {AMENITIES_LIST.map(amenity => {
                      const Icon = amenity.icon;
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAmenities(prev => prev.filter(a => a !== amenity.id));
                            } else {
                              setSelectedAmenities(prev => [...prev, amenity.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                          }`}
                        >
                          <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-primary' : amenity.color}`} />
                          <span className="text-xs font-medium line-clamp-2">{amenity.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amenities */}
                  <div className="flex gap-2">
                    <Input
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      placeholder="Add custom amenity"
                      className="h-11"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-4 shrink-0 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        if (newAmenity.trim()) {
                          setCustomAmenities(prev => [...prev, newAmenity.trim()]);
                          setNewAmenity("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {customAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customAmenities.map((amenity, i) => (
                        <Badge key={i} variant="secondary" className="py-1.5">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {amenity}
                          <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setCustomAmenities(prev => prev.filter((_, idx) => idx !== i))} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Policies */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Policies</Label>
                  
                  {policies.length > 0 && (
                    <div className="space-y-2">
                      {policies.map((policy, i) => (
                        <div key={i} className="p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{policy.title}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPolicies(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{policy.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 p-4 bg-muted/20 rounded-xl">
                    <Input
                      value={newPolicyTitle}
                      onChange={(e) => setNewPolicyTitle(e.target.value)}
                      placeholder="Policy title (e.g., Cancellation Policy)"
                      className="h-11"
                    />
                    <Textarea
                      value={newPolicyContent}
                      onChange={(e) => setNewPolicyContent(e.target.value)}
                      placeholder="Policy details..."
                      rows={3}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        if (newPolicyTitle.trim() && newPolicyContent.trim()) {
                          setPolicies(prev => [...prev, { title: newPolicyTitle.trim(), content: newPolicyContent.trim() }]);
                          setNewPolicyTitle("");
                          setNewPolicyContent("");
                        }
                      }}
                    >
                      Add Policy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Media Upload */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-1">Media Upload</h2>
              <p className="text-muted-foreground text-sm">Add images to showcase your service (max 5)</p>
            </div>

            <Card className="border-0 shadow-sm md:border md:shadow-none">
              <CardContent className="p-4 md:p-6 space-y-6">
                {/* Image Gallery */}
                {images.length > 0 && (
                  <div className="space-y-4">
                    {/* Main Image with Scroll */}
                    <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden">
                      <img
                        src={images[currentImageIndex]}
                        alt={`Service image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Navigation Arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(currentImageIndex)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                            currentImageIndex === index
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-muted-foreground/30"
                          }`}
                        >
                          <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                {images.length < 5 && (
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/20">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-medium mb-1">Tap to upload images</p>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG, WebP • Max 5MB each • {5 - images.length} remaining
                      </p>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={goToPreviousStep}
              className="flex-1 h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < 5 ? (
            <Button 
              type="button" 
              onClick={goToNextStep}
              className="flex-1 h-12"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 h-12"
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Publish" : mode === "duplicate" ? "Save as New" : "Update"}
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Navigation Buttons */}
      <div className="hidden md:flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button type="button" variant="ghost" onClick={goToPreviousStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          {currentStep < 5 ? (
            <Button type="button" onClick={goToNextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Publish Service" : mode === "duplicate" ? "Save as New" : "Update Service"}
            </Button>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <ServiceDescriptionPage
            service={buildFormData()}
            isPreview={true}
            onClose={() => setShowPreview(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
