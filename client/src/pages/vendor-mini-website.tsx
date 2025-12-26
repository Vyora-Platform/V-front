import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { 
  Eye, Save, Globe, Phone, Store, Package, CheckCircle2, AlertCircle,
  ChevronRight, ChevronLeft, Users, HelpCircle, Star, Tag, Info, Clock, MapPin,
  Upload, X, Plus, ImageIcon, Palette, Lock
} from "lucide-react";
import { FileUpload, MultiFileUpload } from "@/components/file-upload";
import { ColorThemeSelector } from "@/components/ColorThemeSelector";
import { LayoutSelector, websiteLayouts } from "@/components/LayoutSelector";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MiniWebsite, VendorCatalogue, VendorProduct } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { LoadingSpinner } from "@/components/AuthGuard";

// Days of the week for business hours
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Comprehensive form schema
const miniWebsiteFormSchema = z.object({
  // Step 1: Website Name (Subdomain)
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  businessName: z.string().min(2).max(100),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  logo: z.string().optional(),
  
  // Step 2: Contact Info
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().max(500).optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  
  // Step 3: Business Hours
  businessHours: z.array(z.object({
    day: z.string(),
    isOpen: z.boolean(),
    slots: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })).default([{ open: "09:00", close: "18:00" }]),
  })).optional(),
  
  // Branding & Theme (removed from steps, using defaults)
  primaryColor: z.string().default("#0f766e"),
  secondaryColor: z.string().default("#14b8a6"),
  accentColor: z.string().default("#0d9488"),
  heroMedia: z.array(z.string()).default([]),
  
  // Step 4: Team & About
  teamMembers: z.array(z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string().optional(),
    photo: z.string().optional(),
  })).default([]),
  
  // Step 5: FAQs
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number(),
  })).default([]),
  
  // Step 6: Testimonials
  testimonials: z.array(z.object({
    customerName: z.string(),
    customerLocation: z.string().optional(),
    rating: z.number().min(1).max(5),
    reviewText: z.string(),
    order: z.number(),
  })).default([]),
  
  // Step 7: Coupons
  selectedCouponIds: z.array(z.string()).default([]),
  
  // Step 8: Catalog
  selectedServiceIds: z.array(z.string()).default([]),
  selectedProductIds: z.array(z.string()).default([]),
  
  // Step 9: E-commerce Settings
  ecommerceEnabled: z.boolean().default(true),
  ecommerceMode: z.enum(["cart", "quotation", "both"]).default("both"),
  allowGuestCheckout: z.boolean().default(false),
  requirePhone: z.boolean().default(true),
  requireAddress: z.boolean().default(true),
  showPrices: z.boolean().default(true),
  currency: z.string().default("INR"),
  paymentMethods: z.array(z.object({
    type: z.enum(["cod"]),
    enabled: z.boolean(),
    instructions: z.string().optional(),
  })).default([
    { type: "cod", enabled: true },
  ]),
  minOrderValue: z.number().default(0),
  taxRate: z.number().default(0),
  notificationEmails: z.array(z.string()).default([]),
  // Home Delivery for Products
  homeDeliveryAvailable: z.boolean().default(false),
  homeDeliveryCharges: z.number().default(0).optional(),
  homeDeliveryTime: z.string().optional(),
  // Home Service for Services
  homeServiceAvailable: z.boolean().default(false),
  homeServiceCharges: z.number().default(0).optional(),
  homeServiceTime: z.string().optional(),
  
  // Layout Selection
  layoutId: z.string().default("hybrid-business"),
  
  // Social Media Links (optional)
  socialMedia: z.object({
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
  }).default({ facebook: "", instagram: "", youtube: "", twitter: "" }),
  
  // Trust Numbers (displayed below hero)
  trustNumbers: z.object({
    yearsInBusiness: z.number().default(0),
    happyCustomers: z.number().default(0),
    starRating: z.number().min(0).max(5).default(0),
    repeatCustomers: z.number().default(0),
  }).default({ yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 }),
});

type FormValues = z.infer<typeof miniWebsiteFormSchema>;

const STEPS = [
  { id: 1, name: "Website Name", icon: Globe },
  { id: 2, name: "Business Info", icon: Store },
  { id: 3, name: "Contact", icon: Phone },
  { id: 4, name: "Business Hours", icon: Clock },
  { id: 5, name: "Gallery", icon: ImageIcon },
  { id: 6, name: "Team & About", icon: Users },
  { id: 7, name: "FAQs", icon: HelpCircle },
  { id: 8, name: "Testimonials", icon: Star },
  { id: 9, name: "E-commerce", icon: Package },
  { id: 10, name: "Trust Numbers", icon: Star },
  { id: 11, name: "Social Media", icon: Globe },
  { id: 12, name: "Website Layout", icon: Store },
  { id: 13, name: "Color Theme", icon: Palette },
  { id: 14, name: "Review & Publish", icon: CheckCircle2 },
];

// LocalStorage keys - include vendorId for multi-vendor support
const getStorageKey = (vendorId: string, suffix: string) => `vendor_website_builder_${vendorId}_${suffix}`;

export default function VendorMiniWebsite() {
  const { toast } = useToast();
  const location = window.location;
  const isCreateMode = location.pathname.includes('/create');
  
  // Get step from URL query parameter
  const urlParams = new URLSearchParams(location.search);
  const stepFromUrl = urlParams.get('step');
  const initialStep = stepFromUrl ? parseInt(stepFromUrl, 10) : 1;
  const validStep = initialStep >= 1 && initialStep <= STEPS.length ? initialStep : 1;
  
  const [currentStep, setCurrentStep] = useState(validStep);
  const [showPreview, setShowPreview] = useState(false);
  
  // Auto-save indicator state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Subdomain availability state
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainMessage, setSubdomainMessage] = useState<string>("");
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  // Track saved subdomain from existing website - LOCKED once set
  const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);
  const [subdomainLocked, setSubdomainLocked] = useState(false);
  
  // Get real vendor ID from localStorage first (before useAuth)
  const { vendorId } = useAuth();
  
  // Pro subscription check - block save/publish for non-Pro users
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<'save' | 'publish'>('save');
  
  // Storage keys with vendorId
  const STORAGE_KEY_FORM_DATA = vendorId ? getStorageKey(vendorId, 'form_data') : 'vendor_website_builder_form_data';
  const STORAGE_KEY_COMPLETED_STEPS = vendorId ? getStorageKey(vendorId, 'completed_steps') : 'vendor_website_builder_completed_steps';
  const STORAGE_KEY_SUBDOMAIN = vendorId ? getStorageKey(vendorId, 'locked_subdomain') : 'vendor_website_builder_locked_subdomain';
  
  // Track completed steps - persisted in localStorage
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED_STEPS);
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  
  // Load locked subdomain from localStorage on mount
  useEffect(() => {
    if (vendorId) {
      const lockedSub = localStorage.getItem(STORAGE_KEY_SUBDOMAIN);
      if (lockedSub) {
        setSavedSubdomain(lockedSub);
        setSubdomainLocked(true);
        setSubdomainAvailable(true);
        setSubdomainMessage("Your website name (locked)");
      }
    }
  }, [vendorId, STORAGE_KEY_SUBDOMAIN]);
  
  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    if (vendorId) {
      localStorage.setItem(STORAGE_KEY_COMPLETED_STEPS, JSON.stringify([...completedSteps]));
    }
  }, [completedSteps, vendorId, STORAGE_KEY_COMPLETED_STEPS]);
  
  // Update step when URL query parameter changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const stepFromUrl = urlParams.get('step');
    if (stepFromUrl) {
      const newStep = parseInt(stepFromUrl, 10);
      if (newStep >= 1 && newStep <= STEPS.length) {
        setCurrentStep(newStep);
      }
    }
  }, [location.search]);

  // Fetch existing mini-website (always fetch to check if one exists)
  const { data: miniWebsite, isLoading: loadingWebsite } = useQuery<MiniWebsite>({
    queryKey: [`/api/vendors/${vendorId}/mini-website`],
    enabled: !!vendorId, // Always fetch when vendor ID is available
  });

  // Fetch vendor details for autofill (in both create and edit modes)
  const { data: vendor } = useQuery<any>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch vendor services and products
  const { data: services = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  // Get saved form data from localStorage
  const getSavedFormData = (): Partial<FormValues> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FORM_DATA);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedFormData = getSavedFormData();

  // Initialize form with saved data or empty defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(miniWebsiteFormSchema),
    defaultValues: {
      subdomain: savedFormData?.subdomain || "",
      businessName: savedFormData?.businessName || "",
      tagline: savedFormData?.tagline || "",
      description: savedFormData?.description || "",
      logo: savedFormData?.logo || "",
      contactEmail: savedFormData?.contactEmail || "",
      contactPhone: savedFormData?.contactPhone || "",
      address: savedFormData?.address || "",
      googleMapsUrl: savedFormData?.googleMapsUrl || "",
      businessHours: savedFormData?.businessHours || DAYS.map(day => ({ 
        day, 
        isOpen: day !== "Sunday",
        slots: [{ open: "09:00", close: "18:00" }]
      })),
      primaryColor: savedFormData?.primaryColor || "#0f766e",
      secondaryColor: savedFormData?.secondaryColor || "#14b8a6",
      accentColor: savedFormData?.accentColor || "#0d9488",
      heroMedia: savedFormData?.heroMedia || [],
      teamMembers: savedFormData?.teamMembers || [],
      faqs: savedFormData?.faqs || [],
      testimonials: savedFormData?.testimonials || [],
      selectedCouponIds: savedFormData?.selectedCouponIds || [],
      selectedServiceIds: savedFormData?.selectedServiceIds || [],
      selectedProductIds: savedFormData?.selectedProductIds || [],
      ecommerceEnabled: savedFormData?.ecommerceEnabled ?? true,
      ecommerceMode: savedFormData?.ecommerceMode || "both",
      allowGuestCheckout: savedFormData?.allowGuestCheckout ?? false,
      requirePhone: savedFormData?.requirePhone ?? true,
      requireAddress: savedFormData?.requireAddress ?? true,
      showPrices: savedFormData?.showPrices ?? true,
      currency: savedFormData?.currency || "INR",
      paymentMethods: savedFormData?.paymentMethods || [
        { type: "cod", enabled: true },
      ],
      minOrderValue: savedFormData?.minOrderValue || 0,
      taxRate: savedFormData?.taxRate || 0,
      notificationEmails: savedFormData?.notificationEmails || [],
      homeDeliveryAvailable: savedFormData?.homeDeliveryAvailable ?? false,
      homeDeliveryCharges: savedFormData?.homeDeliveryCharges || 0,
      homeDeliveryTime: savedFormData?.homeDeliveryTime || "",
      homeServiceAvailable: savedFormData?.homeServiceAvailable ?? false,
      homeServiceCharges: savedFormData?.homeServiceCharges || 0,
      homeServiceTime: savedFormData?.homeServiceTime || "",
      layoutId: savedFormData?.layoutId || "hybrid-business",
      socialMedia: savedFormData?.socialMedia || { facebook: "", instagram: "", youtube: "", twitter: "" },
      trustNumbers: savedFormData?.trustNumbers || { yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 },
    },
  });

  // Combined localStorage save with debouncing for performance
  useEffect(() => {
    let localSaveTimeout: NodeJS.Timeout;
    const subscription = form.watch((data) => {
      // Debounce localStorage writes to prevent excessive writes
      clearTimeout(localSaveTimeout);
      localSaveTimeout = setTimeout(() => {
        if (vendorId) {
          try {
            localStorage.setItem(STORAGE_KEY_FORM_DATA, JSON.stringify(data));
          } catch (e) {
            console.warn("Failed to save to localStorage:", e);
          }
        }
      }, 500); // 500ms debounce for localStorage
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(localSaveTimeout);
    };
  }, [form, vendorId, STORAGE_KEY_FORM_DATA]);
  
  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = form.getValues();
      if (vendorId) {
        try {
          localStorage.setItem(STORAGE_KEY_FORM_DATA, JSON.stringify(data));
        } catch (e) {
          console.warn("Failed to save to localStorage on unload:", e);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form, vendorId, STORAGE_KEY_FORM_DATA]);

  // Check subdomain availability function (called on button click)
  // ONLY check if subdomain is NOT locked
  const checkSubdomainAvailability = async () => {
    // If subdomain is locked, don't re-check
    if (subdomainLocked) {
      setSubdomainAvailable(true);
      setSubdomainMessage("Your website name (locked)");
      return;
    }
    
    const subdomain = form.getValues("subdomain");
    
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      setSubdomainMessage("Website name must be at least 3 characters");
      return;
    }

    // Validate format first
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      setSubdomainAvailable(false);
      setSubdomainMessage("Use only lowercase letters, numbers, and hyphens (can't start/end with hyphen)");
      return;
    }

    setCheckingSubdomain(true);
    setSubdomainMessage("");
    try {
      const apiUrl = getApiUrl(`/api/check-subdomain/${subdomain}?vendorId=${vendorId || ''}`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setSubdomainAvailable(data.available);
      setSubdomainMessage(data.reason || (data.available ? "This website name is available!" : "This website name is already taken"));
      
      // If available, lock it permanently
      if (data.available && vendorId) {
        setSavedSubdomain(subdomain);
        setSubdomainLocked(true);
        localStorage.setItem(STORAGE_KEY_SUBDOMAIN, subdomain);
      }
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setSubdomainAvailable(null);
      setSubdomainMessage("Unable to check availability. Please try again.");
    } finally {
      setCheckingSubdomain(false);
    }
  };

  // Reset availability when subdomain changes - ONLY if not locked
  const watchedSubdomain = form.watch("subdomain");
  useEffect(() => {
    // Don't reset if subdomain is locked
    if (subdomainLocked && watchedSubdomain === savedSubdomain) {
      return;
    }
    // Reset availability state when user types a different subdomain
    if (!subdomainLocked) {
      setSubdomainAvailable(null);
      setSubdomainMessage("");
    }
  }, [watchedSubdomain, subdomainLocked, savedSubdomain]);

  // Autofill form with vendor details when creating new website (only if no existing website)
  useEffect(() => {
    if (isCreateMode && vendor && !miniWebsite && !loadingWebsite) {
      console.log("🔄 Auto-filling new website with vendor details...");
      console.log("Vendor data:", vendor);
      
      // Generate subdomain from business name
      const generatedSubdomain = vendor.businessName
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50) || "";
      
      form.reset({
        subdomain: generatedSubdomain,
        businessName: vendor.businessName || "",
        tagline: "",
        description: vendor.description || "",
        logo: vendor.logo || "",
        contactEmail: vendor.email || "",
        contactPhone: vendor.phone || vendor.whatsappNumber || "",
        address: vendor.address || `${vendor.street || ""}, ${vendor.city || ""}, ${vendor.state || ""} - ${vendor.pincode || ""}`.trim(),
        googleMapsUrl: "",
        businessHours: DAYS.map(day => ({ 
          day, 
          isOpen: day !== "Sunday",
          slots: [{ open: "09:00", close: "18:00" }]
        })),
        primaryColor: "#0f766e",
        secondaryColor: "#14b8a6",
        accentColor: "#0d9488",
        heroMedia: vendor.banner ? [vendor.banner] : [],
        teamMembers: [], // Vendor must create team members manually
        faqs: [],
        testimonials: [],
        selectedCouponIds: [],
        selectedServiceIds: [],
        selectedProductIds: [],
        ecommerceEnabled: true,
        ecommerceMode: "both",
        allowGuestCheckout: false,
        requirePhone: true,
        requireAddress: true,
        showPrices: true,
        currency: "INR",
        paymentMethods: [
          { type: "cod", enabled: true },
        ],
        minOrderValue: 0,
        taxRate: 0,
        notificationEmails: [vendor.email || ""],
        homeDeliveryAvailable: false,
        homeDeliveryCharges: 0,
        homeDeliveryTime: "",
        homeServiceAvailable: false,
        homeServiceCharges: 0,
        homeServiceTime: "",
        layoutId: "hybrid-business",
        socialMedia: { facebook: "", instagram: "", youtube: "", twitter: "" },
        trustNumbers: { yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 },
      });
      
      console.log("✅ Auto-filled new website form");
    }
  }, [isCreateMode, vendor, form, miniWebsite, loadingWebsite]);

  // Rehydrate form when mini-website data loads (if website exists, use it even in create mode)
  useEffect(() => {
    if (miniWebsite && vendor) {
      console.log("🔄 Prefilling form with existing website data...");
      
      const businessInfo = miniWebsite.businessInfo as any;
      const contactInfo = miniWebsite.contactInfo as any;
      const branding = miniWebsite.branding as any;
      const team = miniWebsite.team as any;
      const faqs = miniWebsite.faqs as any;
      const testimonials = miniWebsite.testimonials as any;
      const coupons = miniWebsite.coupons as any;
      const ecommerce = miniWebsite.ecommerce as any;
      
      // Save the original subdomain for edit validation and LOCK it
      if (miniWebsite.subdomain) {
        setSavedSubdomain(miniWebsite.subdomain);
        setSubdomainLocked(true);
        setSubdomainAvailable(true);
        setSubdomainMessage("Your website name (locked)");
        // Persist to localStorage
        if (vendorId) {
          localStorage.setItem(STORAGE_KEY_SUBDOMAIN, miniWebsite.subdomain);
        }
      }
      
      form.reset({
        subdomain: miniWebsite.subdomain || "",
        businessName: businessInfo?.businessName || vendor.businessName || "",
        tagline: businessInfo?.tagline || "",
        description: businessInfo?.about || vendor.description || "",
        logo: businessInfo?.logo || vendor.logo || "",
        contactEmail: contactInfo?.email || vendor.email || "",
        contactPhone: contactInfo?.phone || vendor.phone || vendor.whatsappNumber || "",
        address: contactInfo?.address || vendor.address || "",
        googleMapsUrl: contactInfo?.googleMapsUrl || "",
        businessHours: contactInfo?.workingHours || DAYS.map(day => ({ 
          day, 
          isOpen: day !== "Sunday",
          slots: [{ open: "09:00", close: "18:00" }]
        })),
        primaryColor: branding?.primaryColor || "#0f766e",
        secondaryColor: branding?.secondaryColor || "#14b8a6",
        accentColor: branding?.accentColor || "#0d9488",
        heroMedia: branding?.heroMedia || (vendor.banner ? [vendor.banner] : []),
        teamMembers: team || [], // Vendor must create team members manually
        faqs: faqs || [],
        testimonials: testimonials || [],
        selectedCouponIds: Array.isArray(coupons) ? coupons.map((c: any) => c.id || c).filter(Boolean) : [],
        selectedServiceIds: (miniWebsite.selectedCatalog as any)?.services || [],
        selectedProductIds: (miniWebsite.selectedCatalog as any)?.products || [],
        // E-commerce settings
        ecommerceEnabled: ecommerce?.enabled !== undefined ? ecommerce.enabled : true,
        ecommerceMode: ecommerce?.mode || "both",
        allowGuestCheckout: ecommerce?.allowGuestCheckout !== undefined ? ecommerce.allowGuestCheckout : false,
        requirePhone: ecommerce?.requirePhone !== undefined ? ecommerce.requirePhone : true,
        requireAddress: ecommerce?.requireAddress !== undefined ? ecommerce.requireAddress : true,
        showPrices: ecommerce?.showPrices !== undefined ? ecommerce.showPrices : true,
        currency: ecommerce?.currency || "INR",
        paymentMethods: ecommerce?.paymentMethods || [
          { type: "cod", enabled: true },
        ],
        minOrderValue: ecommerce?.minOrderValue || 0,
        taxRate: ecommerce?.taxRate || 0,
        notificationEmails: ecommerce?.notificationEmails || (vendor.email ? [vendor.email] : []),
        homeDeliveryAvailable: ecommerce?.homeDeliveryAvailable || false,
        homeDeliveryCharges: ecommerce?.homeDeliveryCharges || 0,
        homeDeliveryTime: ecommerce?.homeDeliveryTime || "",
        homeServiceAvailable: ecommerce?.homeServiceAvailable || false,
        homeServiceCharges: ecommerce?.homeServiceCharges || 0,
        homeServiceTime: ecommerce?.homeServiceTime || "",
        layoutId: branding?.layoutId || "hybrid-business",
        socialMedia: (miniWebsite as any).socialMedia || { facebook: "", instagram: "", youtube: "", twitter: "" },
        trustNumbers: (miniWebsite as any).trustNumbers || { yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 },
      });
      
      console.log("✅ Prefilled form with existing website data");
    }
  }, [miniWebsite, vendor, form]);

  // Helper function to build save payload
  const buildSavePayload = (data: FormValues) => ({
    subdomain: data.subdomain,
    businessInfo: {
      businessName: data.businessName,
      tagline: data.tagline,
      about: data.description,
      category: "General",
      logo: data.logo,
    },
    contactInfo: {
      email: data.contactEmail || "contact@example.com",
      phone: data.contactPhone || "+91 00000 00000",
      address: data.address || "Not provided",
      city: "Not specified",
      state: "Not specified",
      pincode: "000000",
      googleMapsUrl: data.googleMapsUrl,
      workingHours: data.businessHours,
    },
    branding: {
      themeTemplate: "modern",
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      fontFamily: "Inter",
      heroLayout: "centered",
      heroMedia: data.heroMedia,
      layoutId: data.layoutId,
    },
    selectedCatalog: {
      services: data.selectedServiceIds,
      products: data.selectedProductIds,
    },
    team: data.teamMembers,
    faqs: data.faqs,
    testimonials: data.testimonials,
    selectedCouponIds: data.selectedCouponIds || [],
    features: {
      showReviews: true,
      showGallery: true,
      showTeam: data.teamMembers.length > 0,
      showWorkingHours: true,
      showCatalog: true,
      enableWhatsAppChat: true,
      enableCallButton: true,
      showOffers: (data.selectedCouponIds || []).length > 0,
    },
    ecommerce: {
      enabled: data.ecommerceEnabled !== undefined ? data.ecommerceEnabled : true,
      mode: data.ecommerceMode || "both",
      allowGuestCheckout: data.allowGuestCheckout !== undefined ? data.allowGuestCheckout : false,
      requirePhone: data.requirePhone !== undefined ? data.requirePhone : true,
      requireAddress: data.requireAddress !== undefined ? data.requireAddress : true,
      showPrices: data.showPrices !== undefined ? data.showPrices : true,
      currency: data.currency || "INR",
      paymentMethods: data.paymentMethods || [
        { type: "cod", enabled: true },
      ],
      minOrderValue: data.minOrderValue || 0,
      taxRate: data.taxRate || 0,
      notificationEmails: data.notificationEmails || [],
      homeDeliveryAvailable: data.homeDeliveryAvailable || false,
      homeDeliveryCharges: data.homeDeliveryCharges || 0,
      homeDeliveryTime: data.homeDeliveryTime || "",
      homeServiceAvailable: data.homeServiceAvailable || false,
      homeServiceCharges: data.homeServiceCharges || 0,
      homeServiceTime: data.homeServiceTime || "",
    },
    socialMedia: data.socialMedia || { facebook: "", instagram: "", youtube: "", twitter: "" },
    trustNumbers: data.trustNumbers || { yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 },
  });

  // Silent save mutation (for auto-save on Next - no toast)
  const silentSaveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = buildSavePayload(data);
      return await apiRequest("POST", `/api/vendors/${vendorId}/mini-website`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/mini-website`] });
      setLastSaved(new Date());
      setIsSaving(false);
      // No toast - silent save
    },
    onError: (error: any) => {
      console.error("Auto-save failed:", error);
      setIsSaving(false);
      // Silent fail - don't interrupt user
    },
  });
  
  // Debounced auto-save to backend (3 second delay for better performance)
  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;
    let lastSaveTime = 0;
    const MIN_SAVE_INTERVAL = 5000; // Minimum 5 seconds between saves
    
    const subscription = form.watch((data) => {
      // Debounced auto-save to backend with rate limiting
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const now = Date.now();
        // Only save if minimum interval has passed and required fields exist
        if (data.subdomain && data.businessName && vendorId && 
            !silentSaveMutation.isPending && 
            (now - lastSaveTime) > MIN_SAVE_INTERVAL) {
          lastSaveTime = now;
          setIsSaving(true);
          silentSaveMutation.mutate(data as FormValues);
        }
      }, 3000); // 3 second debounce for backend save
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(saveTimeout);
    };
  }, [form, vendorId, silentSaveMutation]);

  // Save mini-website mutation (with toast - for explicit Save Draft)
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = buildSavePayload(data);
      return await apiRequest("POST", `/api/vendors/${vendorId}/mini-website`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/mini-website`] });
      toast({
        title: "✓ Saved",
        description: "Your changes have been saved.",
        duration: 2000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/vendors/${vendorId}/mini-website/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/mini-website`] });
      const subdomain = form.getValues("subdomain");
      const siteUrl = getSiteUrl(subdomain);
      toast({
        title: "🎉 Published!",
        description: `Your site is now live at ${siteUrl}`,
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish mini-website.",
        variant: "destructive",
        duration: 2500,
      });
    },
  });

  // Get site URL based on environment
  const getSiteUrl = (subdomain: string) => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return `http://localhost:${window.location.port}/${subdomain}`;
    }
    return `${window.location.origin}/${subdomain}`;
  };

  // Open preview in new tab
  const handlePreview = () => {
    const subdomain = form.getValues("subdomain");
    if (!subdomain) {
      toast({
        title: "No subdomain",
        description: "Please set a subdomain first.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    const siteUrl = getSiteUrl(subdomain);
    window.open(siteUrl, '_blank');
  };

  // Validate step requirements - ALL STEPS ARE MANDATORY
  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const values = form.getValues();
    const errors: string[] = [];

    switch (step) {
      case 1: // Website Name (Subdomain)
        if (!values.subdomain || !values.subdomain.trim()) errors.push("Website name is required");
        else if (values.subdomain.length < 3) errors.push("Website name must be at least 3 characters");
        else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(values.subdomain)) {
          errors.push("Use only lowercase letters, numbers, and hyphens");
        }
        // If subdomain is LOCKED, no availability check needed
        if (subdomainLocked) {
          // Already locked and confirmed - no errors
        } else if (values.subdomain && values.subdomain.length >= 3) {
          // Not locked - must check availability
          if (subdomainAvailable === null) {
            errors.push("Please check & lock website name first");
          } else if (subdomainAvailable === false) {
            errors.push("This website name is not available");
          }
        }
        break;
      case 2: // Business Info
        if (!values.businessName || !values.businessName.trim()) errors.push("Business Name is required");
        if (!values.tagline || !values.tagline.trim()) errors.push("Tagline is required");
        if (!values.description || !values.description.trim()) errors.push("Description is required");
        break;
      case 3: // Contact
        if (!values.contactEmail || !values.contactEmail.trim()) errors.push("Contact Email is required");
        if (!values.contactPhone || !values.contactPhone.trim()) errors.push("Contact Phone is required");
        if (!values.address || !values.address.trim()) errors.push("Address is required");
        break;
      case 4: // Business Hours - At least one day must be open
        const businessHours = values.businessHours || [];
        const hasOpenDay = businessHours.some(day => day.isOpen);
        if (!hasOpenDay) {
          errors.push("At least one business day must be open");
        }
        break;
      case 5: // Gallery - At least 1 image required
        const heroMedia = values.heroMedia || [];
        if (heroMedia.length < 1) {
          errors.push("At least 1 gallery image is required");
        }
        break;
      case 6: // Team & About - At least 1 team member
        const teamMembers = values.teamMembers || [];
        if (teamMembers.length < 1) {
          errors.push("At least 1 team member is required");
        }
        break;
      case 7: // FAQs - At least 1 FAQ
        const faqs = values.faqs || [];
        if (faqs.length < 1) {
          errors.push("At least 1 FAQ is required");
        }
        break;
      case 8: // Testimonials - REQUIRED: minimum 3
        const testimonials = values.testimonials || [];
        if (testimonials.length < 3) {
          errors.push(`At least 3 testimonials are required. You have ${testimonials.length}.`);
        }
        break;
      case 9: // E-commerce - validation handled by form schema
        break;
      case 10: // Trust Numbers - optional, skippable
        break;
      case 11: // Social Media - optional, skippable
        break;
      case 12: // Website Layout - must select a layout
        if (!values.layoutId || !values.layoutId.trim()) {
          errors.push("Please select a website layout");
        }
        break;
      case 13: // Color Theme - colors are pre-selected, valid by default
        break;
      case 14: // Review & Publish - no validation needed
        break;
    }

    return { isValid: errors.length === 0, errors };
  };

  // Check if a step can be navigated to (all previous steps must be completed)
  const canNavigateToStep = (targetStep: number): boolean => {
    // Can always go to step 1
    if (targetStep === 1) return true;
    
    // Can go to current step
    if (targetStep === currentStep) return true;
    
    // Can go to any completed step
    if (completedSteps.has(targetStep)) return true;
    
    // Can go to the next step after the last completed step
    for (let i = 1; i < targetStep; i++) {
      if (!completedSteps.has(i)) {
        return false;
      }
    }
    return true;
  };

  // Handle clicking on a step in the stepper
  const handleStepClick = (stepId: number) => {
    if (canNavigateToStep(stepId)) {
      // Validate current step before navigating away
      if (stepId !== currentStep) {
        const validation = validateStep(currentStep);
        if (validation.isValid) {
          // Mark current step as completed
          setCompletedSteps(prev => new Set([...prev, currentStep]));
          // Save form data
          const data = form.getValues();
          silentSaveMutation.mutate(data);
        }
      }
      setCurrentStep(stepId);
    } else {
      // Find the first incomplete step
      let firstIncomplete = 1;
      for (let i = 1; i < stepId; i++) {
        if (!completedSteps.has(i)) {
          firstIncomplete = i;
          break;
        }
      }
      toast({
        title: "Complete Previous Steps",
        description: `Please complete Step ${firstIncomplete} (${STEPS[firstIncomplete - 1].name}) first.`,
        variant: "destructive",
        duration: 2500,
      });
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      // Validate current step
      const validation = validateStep(currentStep);
      
      if (!validation.isValid) {
        toast({
          title: "Missing Required Fields",
          description: validation.errors.join(", "),
          variant: "destructive",
          duration: 2500,
        });
        return;
      }

      // PRO SUBSCRIPTION CHECK - Block save for non-Pro users
      const actionCheck = canPerformAction('save');
      if (!actionCheck.allowed) {
        console.log('[PRO_GUARD] Auto-save on next step blocked - User is not Pro');
        setBlockedAction('save');
        setShowUpgradeModal(true);
        return;
      }

      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      // Advance to next step IMMEDIATELY (instant navigation)
      setCurrentStep(currentStep + 1);
      
      // Auto-save progress in background (silent - no toast)
      const data = form.getValues();
      silentSaveMutation.mutate(data);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    // PRO SUBSCRIPTION CHECK - Block save for non-Pro users
    const actionCheck = canPerformAction('save');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] Save draft blocked - User is not Pro');
      setBlockedAction('save');
      setShowUpgradeModal(true);
      return;
    }
    
    // Check minimum required fields for draft
    const values = form.getValues();
    if (!values.subdomain || !values.businessName) {
      toast({
        title: "Cannot Save Draft",
        description: "At minimum, Subdomain and Business Name are required to save a draft.",
        variant: "destructive",
        duration: 2500,
      });
      return;
    }

    const data = form.getValues();
    saveMutation.mutate(data);
  };

  const handlePublish = async () => {
    // PRO SUBSCRIPTION CHECK - Block publish for non-Pro users
    const actionCheck = canPerformAction('publish');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] Publish blocked - User is not Pro');
      setBlockedAction('publish');
      setShowUpgradeModal(true);
      return;
    }
    
    // Validate all required steps for publishing (steps 1-13, excluding final review step 14)
    const allErrors: string[] = [];
    for (let step = 1; step <= 13; step++) {
      const validation = validateStep(step);
      if (!validation.isValid) {
        allErrors.push(`Step ${step} (${STEPS[step - 1].name}): ${validation.errors.join(", ")}`);
      }
    }

    if (allErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please complete all required steps. ${allErrors[0]}`,
        variant: "destructive",
        duration: 3500,
      });
      return;
    }
    
    // Mark all steps as completed
    const allSteps = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    setCompletedSteps(allSteps);
    
    // Clear localStorage after successful publish
    localStorage.removeItem(STORAGE_KEY_FORM_DATA);
    localStorage.removeItem(STORAGE_KEY_COMPLETED_STEPS);
    
    // Save first, then publish
    const data = form.getValues();
    await saveMutation.mutateAsync(data);
    await publishMutation.mutateAsync();
  };

  if (!isCreateMode && loadingWebsite) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Fixed Header with Back Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-gray-100"
                data-testid="button-back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-xl font-bold text-gray-900 truncate" data-testid="heading-builder">
                  Website Builder
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isSaving ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      Saving...
                    </span>
                  ) : lastSaved ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            
            {/* Right: Step Counter + Preview */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-primary">{currentStep}</span>
                <span>/</span>
                <span>{STEPS.length}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm font-medium"
                data-testid="button-live-preview"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
            </div>
          </div>
          
          {/* Progress Bar - Always Visible */}
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out" 
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Horizontal Step Navigation - Scrollable with Rectangular Outline */}
      <nav className="sticky top-14 md:top-16 z-20 bg-white border-b">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide px-4 md:px-6 py-2.5 md:py-3 gap-2">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.has(step.id);
              const isActive = currentStep === step.id;
              const canNavigate = canNavigateToStep(step.id);
              const isLocked = !canNavigate && !isCompleted && !isActive;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={isLocked}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 
                    text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
                    ${isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : isCompleted
                      ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                      : isLocked
                      ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-400"
                    }
                  `}
                >
                  <StepIcon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : isCompleted ? "text-blue-600" : "text-gray-500"}`} />
                  <span>{step.name}</span>
                  {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area - No Fixed Heights, Full Scrolling */}
      <main className="max-w-[1440px] mx-auto">
        <div className="px-4 md:px-6 py-4 md:py-6 pb-40 md:pb-32">
          <Form {...form}>
            <form className="space-y-4 md:space-y-6">
                {/* Step 1: Choose Your Website Name - Optimized */}
                {currentStep === 1 && (
                  <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-5 py-6 md:px-8 md:py-8 text-center text-white">
                      <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
                        <Globe className="h-8 w-8 md:h-10 md:w-10 text-white" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold mb-2">Choose Your Website Name</h2>
                      <p className="text-sm md:text-base text-white/90">
                        {subdomainLocked 
                          ? "Your website name is permanently locked."
                          : "This will be your unique online address."
                        }
                      </p>
                    </div>
                    <CardContent className="p-5 md:p-8 space-y-5">
                      <FormField
                        control={form.control}
                        name="subdomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              Website Name
                              {subdomainLocked && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-green-100 text-green-700">
                                  <Lock className="h-3 w-3" />
                                  Locked
                                </Badge>
                              )}
                            </FormLabel>
                            <div className="space-y-4">
                              <div className="flex flex-col gap-3">
                                <div className="relative">
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      value={field.value?.toLowerCase().replace(/[^a-z0-9-]/g, '') || ''}
                                      onChange={(e) => {
                                        if (!subdomainLocked) {
                                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                          field.onChange(value);
                                        }
                                      }}
                                      data-testid="input-subdomain"
                                      placeholder="yourbusiness"
                                      disabled={subdomainLocked}
                                      className={`h-14 text-lg font-medium pr-12 rounded-xl ${
                                        subdomainLocked ? 'bg-green-50 border-green-300 cursor-not-allowed' :
                                        subdomainAvailable === true ? 'border-green-500 focus-visible:ring-green-500' : 
                                        subdomainAvailable === false ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200'
                                      }`}
                                      autoComplete="off"
                                    />
                                  </FormControl>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {subdomainLocked ? (
                                      <Lock className="h-5 w-5 text-green-600" />
                                    ) : !checkingSubdomain && subdomainAvailable === true ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : !checkingSubdomain && subdomainAvailable === false ? (
                                      <AlertCircle className="h-5 w-5 text-red-500" />
                                    ) : null}
                                  </div>
                                </div>
                                {!subdomainLocked && (
                                  <Button
                                    type="button"
                                    onClick={checkSubdomainAvailability}
                                    disabled={checkingSubdomain || !field.value || field.value.length < 3}
                                    className="w-full sm:w-auto h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
                                  >
                                    {checkingSubdomain ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Checking...
                                      </>
                                    ) : (
                                      "Check & Lock Name"
                                    )}
                                  </Button>
                                )}
                              </div>
                                
                                {/* Subdomain preview */}
                                <div className={`p-4 rounded-xl border-2 ${subdomainLocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    {subdomainLocked ? "Your Website Address" : "Preview"}
                                  </p>
                                  <p className={`text-base md:text-lg font-mono font-bold break-all ${subdomainLocked ? 'text-green-700' : 'text-gray-900'}`}>
                                    {getSiteUrl(field.value || 'yourbusiness')}
                                  </p>
                                </div>
                                
                                {/* Locked confirmation message */}
                                {subdomainLocked && (
                                  <div className="p-3 bg-green-100 border border-green-300 rounded-xl">
                                    <p className="text-sm text-green-800 flex items-center gap-2 font-medium">
                                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                      Permanently reserved for you. Cannot be changed.
                                    </p>
                                  </div>
                                )}
                                
                                {/* Availability message - only show if not locked */}
                                {!subdomainLocked && subdomainMessage && (
                                  <p className={`text-sm flex items-center gap-1 ${
                                    subdomainAvailable === true ? 'text-green-600' : 
                                    subdomainAvailable === false ? 'text-red-600' : 'text-amber-600'
                                  }`}>
                                    {subdomainAvailable === true ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : subdomainAvailable === false ? (
                                      <AlertCircle className="h-4 w-4" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4" />
                                    )}
                                    {subdomainMessage}
                                  </p>
                                )}
                                
                                {/* Prompt to check availability - only if new or changed AND not locked */}
                                {!subdomainLocked && field.value && field.value.length >= 3 && subdomainAvailable === null && !subdomainMessage && (
                                  <p className="text-sm text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    Click "Check & Lock" to verify and lock this name
                                  </p>
                                )}
                                
                                {/* Show saved indicator for unchanged subdomain */}
                                {savedSubdomain && field.value === savedSubdomain && (
                                  <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    This is your current website name
                                  </p>
                                )}
                                
                                <FormMessage />
                              </div>
                              <FormDescription className="mt-3 p-3 bg-gray-50 rounded-xl">
                                <span className="block text-xs text-gray-500 mb-1">
                                  ✓ Use 3-50 characters
                                </span>
                                <span className="block text-xs text-gray-500 mb-1">
                                  ✓ Only lowercase letters, numbers, and hyphens
                                </span>
                                <span className="block text-xs text-gray-500">
                                  ✓ Cannot start or end with a hyphen
                                </span>
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Business Info - Optimized */}
                {currentStep === 2 && (
                  <Card className="rounded-2xl border-0 shadow-sm bg-white">
                    <CardHeader className="p-5 md:p-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Store className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg md:text-xl font-semibold">Business Information</CardTitle>
                          <CardDescription className="text-sm text-gray-500">Core details about your business</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6 pt-0 space-y-5">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Business Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-business-name" 
                                className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter your business name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Tagline <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-tagline" 
                                placeholder="A catchy phrase about your business"
                                className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">About Your Business <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                data-testid="input-description" 
                                rows={5} 
                                placeholder="Tell visitors about your business, what you do, and what makes you special..."
                                className="text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Business Logo <span className="text-gray-400 font-normal">(Optional)</span></FormLabel>
                            <FormControl>
                              <FileUpload
                                value={field.value}
                                onChange={field.onChange}
                                category="logo"
                                circular
                                allowAnyFile
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500 mt-1">Recommended: Square image, at least 200x200px</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Contact Info - Optimized */}
                {currentStep === 3 && (
                  <Card className="rounded-2xl border-0 shadow-sm bg-white">
                    <CardHeader className="p-5 md:p-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Phone className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg md:text-xl font-semibold">Contact Information</CardTitle>
                          <CardDescription className="text-sm text-gray-500">How customers can reach you</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6 pt-0 space-y-5">
                      {/* Email & Phone in Grid on Desktop */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email" 
                                  data-testid="input-contact-email" 
                                  placeholder="your@email.com"
                                  className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  data-testid="input-contact-phone" 
                                  placeholder="+91 98765 43210"
                                  className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Complete Address <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                data-testid="input-address" 
                                rows={3} 
                                placeholder="Shop No., Building Name, Street, Area, City, State - Pincode"
                                className="text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="googleMapsUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              Google Maps Link <span className="text-gray-400 font-normal">(Optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                data-testid="input-google-maps" 
                                placeholder="https://maps.google.com/..."
                                className="h-12 text-base rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500 mt-1">
                              Paste your Google Maps link. If not provided, we'll use your address for directions.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Business Hours - Optimized */}
                {currentStep === 4 && (
                  <Card className="rounded-2xl border-0 shadow-sm bg-white">
                    <CardHeader className="p-5 md:p-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                          <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg md:text-xl font-semibold">Business Hours</CardTitle>
                          <CardDescription className="text-sm text-gray-500">Set your weekly operating schedule</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6 pt-0 space-y-3">
                      {!(form.watch("businessHours") || []).some((day: any) => day.isOpen) && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-sm text-amber-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            At least one business day must be open.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {form.watch("businessHours")?.map((dayHours, dayIndex) => {
                          const day = dayHours.day;
                          const isOpen = form.watch(`businessHours.${dayIndex}.isOpen`);
                          const slots = form.watch(`businessHours.${dayIndex}.slots`) || [];
                          
                          return (
                            <div key={day} className={`p-3 md:p-4 border rounded-xl transition-colors ${isOpen ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-center gap-3">
                                <FormField
                                  control={form.control}
                                  name={`businessHours.${dayIndex}.isOpen`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          data-testid={`checkbox-${day.toLowerCase()}`}
                                          className="h-5 w-5"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="w-20 md:w-24 font-medium text-sm text-gray-900">{day}</span>
                                {!isOpen && <span className="text-sm text-gray-500">Closed</span>}
                              </div>
                              
                              {isOpen && (
                                <div className="mt-3 space-y-2 pl-0 md:pl-8">
                                  {slots.map((slot, slotIndex) => (
                                    <div key={slotIndex} className="flex flex-wrap items-center gap-2">
                                      <Input
                                        type="time"
                                        value={slot.open}
                                        onChange={(e) => {
                                          const newSlots = [...slots];
                                          newSlots[slotIndex] = { ...newSlots[slotIndex], open: e.target.value };
                                          form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                        }}
                                        className="flex-1 min-w-[100px] h-10 md:h-11 rounded-lg text-sm"
                                        data-testid={`input-open-${day.toLowerCase()}-${slotIndex}`}
                                      />
                                      <span className="text-gray-400 text-sm">to</span>
                                      <Input
                                        type="time"
                                        value={slot.close}
                                        onChange={(e) => {
                                          const newSlots = [...slots];
                                          newSlots[slotIndex] = { ...newSlots[slotIndex], close: e.target.value };
                                          form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                        }}
                                        className="flex-1 min-w-[100px] h-10 md:h-11 rounded-lg text-sm"
                                        data-testid={`input-close-${day.toLowerCase()}-${slotIndex}`}
                                      />
                                      {slots.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-10 w-10 text-red-500 hover:bg-red-50"
                                          onClick={() => {
                                            const newSlots = slots.filter((_, i) => i !== slotIndex);
                                            form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                          }}
                                          data-testid={`button-remove-slot-${day.toLowerCase()}-${slotIndex}`}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  {slots.length < 3 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-1 text-xs h-9 rounded-lg w-full"
                                      onClick={() => {
                                        const newSlots = [...slots, { open: "14:00", close: "18:00" }];
                                        form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                      }}
                                      data-testid={`button-add-slot-${day.toLowerCase()}`}
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
                                    Add Break
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 6: Gallery Only */}
                {currentStep === 5 && <GalleryOnlyStep form={form} />}

                {/* Step 6: Team & About */}
                {currentStep === 6 && <TeamMembersStep form={form} />}

                {/* Step 7: FAQs */}
                {currentStep === 7 && <FAQsStep form={form} />}

                {/* Step 8: Testimonials */}
                {currentStep === 8 && <TestimonialsStep form={form} />}

                {/* Step 9: E-commerce Settings */}
                {currentStep === 9 && <EcommerceSettingsStep form={form} />}

                {/* Step 10: Trust Numbers */}
                {currentStep === 10 && <TrustNumbersStep form={form} />}

                {/* Step 11: Social Media Links */}
                {currentStep === 11 && <SocialMediaStep form={form} />}

                {/* Step 12: Website Layout */}
                {currentStep === 12 && (
                  <LayoutSelector
                    selectedLayout={form.watch("layoutId") || "hybrid-business"}
                    onLayoutChange={(layoutId) => form.setValue("layoutId", layoutId, { shouldValidate: true, shouldDirty: true })}
                    formData={form.watch()}
                    services={services}
                    products={products}
                    vendorCategory={vendor?.category || vendor?.businessCategory || vendor?.businessType}
                  />
                )}

                {/* Step 13: Color Theme */}
                {currentStep === 13 && <ColorThemeStep form={form} />}

                {/* Step 14: Review & Publish */}
                {currentStep === 14 && (
                  <div className="space-y-6">
                    {/* Website URL Card - Prominent */}
                    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="h-5 w-5 text-primary" />
                              <p className="font-semibold text-lg">Your Website URL</p>
                            </div>
                            <a 
                              href={getSiteUrl(form.watch("subdomain") || "yoursite")} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-mono text-lg break-all"
                            >
                              {getSiteUrl(form.watch("subdomain") || "yoursite")}
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handlePreview}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Website Sections Overview */}
                    <Card className="rounded-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Website Sections Overview</CardTitle>
                        <CardDescription>All sections that will appear on your published website</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Section Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {/* Logo */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              {form.watch("logo") ? (
                                <img src={form.watch("logo")} alt="Logo" className="h-8 w-8 rounded object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                  <Package className="h-4 w-4" />
                                </div>
                              )}
                              <span className="font-medium text-sm">Logo</span>
                            </div>
                            <Badge variant={form.watch("logo") ? "default" : "secondary"} className="text-xs">
                              {form.watch("logo") ? "✓ Added" : "Not added"}
                            </Badge>
                          </div>

                          {/* Header/Navigation */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Store className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Header</span>
                            </div>
                            <Badge variant="default" className="text-xs">✓ Auto-generated</Badge>
                          </div>

                          {/* Hero Section */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Hero Section</span>
                            </div>
                            <Badge variant={(form.watch("heroMedia") || []).length > 0 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("heroMedia") || []).length} images
                            </Badge>
                          </div>

                          {/* Trust Numbers */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Trust Numbers</span>
                            </div>
                            {(() => {
                              const tn = form.watch("trustNumbers") || {};
                              const count = [tn.yearsInBusiness, tn.happyCustomers, tn.starRating, tn.repeatCustomers].filter(v => v > 0).length;
                              return <Badge variant={count > 0 ? "default" : "secondary"} className="text-xs">{count}/4 set</Badge>;
                            })()}
                          </div>

                          {/* Services */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Services</span>
                            </div>
                            <Badge variant={(form.watch("selectedServiceIds") || []).length > 0 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("selectedServiceIds") || []).length} selected
                            </Badge>
                          </div>

                          {/* Products */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Products</span>
                            </div>
                            <Badge variant={(form.watch("selectedProductIds") || []).length > 0 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("selectedProductIds") || []).length} selected
                            </Badge>
                          </div>

                          {/* Coupons */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Tag className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Coupons</span>
                            </div>
                            <Badge variant={(form.watch("selectedCouponIds") || []).length > 0 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("selectedCouponIds") || []).length} active
                            </Badge>
                          </div>

                          {/* About Us */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">About Us</span>
                            </div>
                            <Badge variant={form.watch("description") ? "default" : "secondary"} className="text-xs">
                              {form.watch("description") ? "✓ Added" : "Not added"}
                            </Badge>
                          </div>

                          {/* Team */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Team</span>
                            </div>
                            <Badge variant={(form.watch("teamMembers") || []).length > 0 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("teamMembers") || []).length} members
                            </Badge>
                          </div>

                          {/* Testimonials */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Testimonials</span>
                            </div>
                            <Badge variant={(form.watch("testimonials") || []).length >= 3 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("testimonials") || []).length} reviews
                            </Badge>
                          </div>

                          {/* FAQs */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">FAQs</span>
                            </div>
                            <Badge variant={(form.watch("faqs") || []).length > 0 ? "default" : "secondary"} className="text-xs">
                              {(form.watch("faqs") || []).length} questions
                            </Badge>
                          </div>

                          {/* Social Media */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Social Links</span>
                            </div>
                            {(() => {
                              const sm = form.watch("socialMedia") || {};
                              const count = [sm.facebook, sm.instagram, sm.youtube, sm.twitter].filter(v => v).length;
                              return <Badge variant={count > 0 ? "default" : "secondary"} className="text-xs">{count} links</Badge>;
                            })()}
                          </div>

                          {/* Footer */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Store className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Footer</span>
                            </div>
                            <Badge variant="default" className="text-xs">✓ Auto-generated</Badge>
                          </div>

                          {/* Color Theme */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Palette className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">Theme</span>
                            </div>
                            <div className="flex gap-1">
                              <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: form.watch("primaryColor") || "#0f766e" }} />
                              <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: form.watch("secondaryColor") || "#14b8a6" }} />
                              <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: form.watch("accentColor") || "#0d9488" }} />
                            </div>
                          </div>

                          {/* E-commerce */}
                          <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-sm">E-commerce</span>
                            </div>
                            <Badge variant={form.watch("ecommerceEnabled") ? "default" : "secondary"} className="text-xs">
                              {form.watch("ecommerceEnabled") ? "✓ Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>

                        {/* Business Details Summary */}
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="font-medium mb-3">Business Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                              <Store className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">{form.watch("businessName") || "Not set"}</p>
                                <p className="text-muted-foreground text-xs">{form.watch("tagline") || "No tagline"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                              <Phone className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <p className="font-medium">{form.watch("contactPhone") || "Not set"}</p>
                                <p className="text-muted-foreground text-xs">{form.watch("contactEmail") || "No email"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons - Clean Layout Without Card on Mobile */}
                    <div className="mt-6 mb-8 space-y-4">
                      {/* Navigation Row */}
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          data-testid="button-previous-review"
                          className="h-11 text-sm"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous Step
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          Step {STEPS.length} of {STEPS.length}
                        </div>
                      </div>

                      {/* Action Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSaveDraft}
                          disabled={saveMutation.isPending}
                          data-testid="button-save-draft"
                          className="h-12 text-sm"
                        >
                          <Save className="h-5 w-5 mr-2" />
                          Save Draft
                          {!isPro && <Lock className="h-3.5 w-3.5 ml-1.5 opacity-60" />}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePreview}
                          data-testid="button-preview"
                          className="h-12 text-sm"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          Preview Site
                        </Button>
                      </div>

                      {/* Publish Button */}
                      <Button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishMutation.isPending || saveMutation.isPending}
                        data-testid="button-publish"
                        className="w-full h-14 text-base md:text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                      >
                        <Globe className="h-5 w-5 mr-2" />
                        {publishMutation.isPending ? "Publishing..." : "Publish Website"}
                        {!isPro && <Lock className="h-4 w-4 ml-2 opacity-70" />}
                      </Button>

                      <p className="text-center text-xs md:text-sm text-muted-foreground pb-4">
                        Once published, your website will be live at the URL above
                      </p>
                    </div>
                  </div>
                )}

            </form>
          </Form>
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar - E-commerce Style - Always visible on mobile */}
      {currentStep < STEPS.length && (
        <div 
          className="fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-white border-t-2 border-gray-200"
          style={{ 
            boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <div className="max-w-[1440px] mx-auto">
            {/* Navigation Buttons - ABOVE step counting on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 bg-white">
              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                data-testid="button-previous"
                className={`
                  h-11 sm:h-12 px-3 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border-2 flex-shrink-0
                  ${currentStep === 1 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-gray-50 hover:border-blue-400 active:scale-[0.98]'
                  }
                `}
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              {/* Desktop: Step Info */}
              <div className="hidden md:flex flex-1 items-center justify-center gap-2 text-sm">
                <span className="text-gray-500">Step</span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
                  {currentStep}
                </span>
                <span className="text-gray-500">of {STEPS.length}:</span>
                <span className="font-semibold text-gray-900">{STEPS[currentStep - 1]?.name}</span>
              </div>
              
              {/* Mobile: Spacer */}
              <div className="flex-1 md:hidden" />
            
              {/* Save & Continue Button - Prominent on mobile */}
              <Button
                type="button"
                onClick={handleNext}
                data-testid="button-next"
                className="h-11 sm:h-12 px-4 sm:px-8 text-xs sm:text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/30 flex-shrink-0"
              >
                <span className="sm:hidden">Save & Next</span>
                <span className="hidden sm:inline">Save & Continue</span>
                {!isPro && <Lock className="h-3.5 w-3.5 ml-1 opacity-70" />}
                {isPro && <ChevronRight className="h-4 w-4 ml-1 sm:ml-1.5" />}
              </Button>
            </div>
            
            {/* Mobile Step Progress Bar - BELOW navigation buttons */}
            <div className="md:hidden bg-gray-50 px-4 py-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {STEPS[currentStep - 1]?.name}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Dialog - Matches Published Website */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 md:px-6 py-3 md:py-4 border-b shrink-0 bg-gradient-to-r from-blue-50 to-purple-50">
            <DialogTitle className="flex items-center justify-between gap-2 text-base md:text-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span>Live Preview</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Matches Published Site
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="hidden sm:inline">Scroll to see full website</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto bg-white" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            <LivePreview formData={form.watch()} services={services} products={products} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pro Subscription Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.location.href = '/vendor/account';
        }}
      />
    </div>
  );
}

// Gallery Only Step Component (Step 5) - Optimized
function GalleryOnlyStep({ form }: { form: any }) {
  const handleImagesChange = async (urls: string[]) => {
    form.setValue("heroMedia", urls, { shouldValidate: true, shouldDirty: true });
  };
  
  const heroMedia = form.watch("heroMedia") || [];

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-white">
      <CardHeader className="p-5 md:p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg md:text-xl font-semibold">Gallery Images</CardTitle>
            <CardDescription className="text-sm text-gray-500">Showcase your business with beautiful images</CardDescription>
          </div>
          <Badge variant={heroMedia.length >= 1 ? "default" : "destructive"} className="text-xs">
            {heroMedia.length}/10
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6 pt-0 space-y-4">
        {heroMedia.length < 1 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              At least 1 gallery image is required.
            </p>
          </div>
        )}

        <MultiFileUpload
          values={heroMedia}
          onChange={handleImagesChange}
          category="hero"
          maxFiles={10}
          className="w-full"
          allowAnyFile={true}
        />

        <p className="text-xs text-gray-500">
          Recommended: 1200x800px or larger. Supports JPG, PNG, WebP.
        </p>

        {/* Preview Grid - Responsive */}
        {heroMedia.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {heroMedia.map((url: string, index: number) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = heroMedia.filter((_: string, i: number) => i !== index);
                      form.setValue("heroMedia", newImages, { shouldValidate: true, shouldDirty: true });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Catalog Step Component - MNC Level Optimization
function CatalogStep({ form, services, products }: { form: any; services: VendorCatalogue[]; products: VendorProduct[] }) {
  const selectedServiceIds = form.watch("selectedServiceIds") || [];
  const selectedProductIds = form.watch("selectedProductIds") || [];
  
  const toggleService = (serviceId: string, checked: boolean) => {
    const current = form.getValues("selectedServiceIds") || [];
    if (checked) {
      form.setValue("selectedServiceIds", [...current, serviceId], { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("selectedServiceIds", current.filter((id: string) => id !== serviceId), { shouldValidate: true, shouldDirty: true });
    }
  };
  
  const toggleProduct = (productId: string, checked: boolean) => {
    const current = form.getValues("selectedProductIds") || [];
    if (checked) {
      form.setValue("selectedProductIds", [...current, productId], { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("selectedProductIds", current.filter((id: string) => id !== productId), { shouldValidate: true, shouldDirty: true });
    }
  };
  
  const selectAllServices = () => {
    form.setValue("selectedServiceIds", services.map(s => s.id), { shouldValidate: true, shouldDirty: true });
  };
  
  const selectAllProducts = () => {
    form.setValue("selectedProductIds", products.map(p => p.id), { shouldValidate: true, shouldDirty: true });
  };
  
  const deselectAllServices = () => {
    form.setValue("selectedServiceIds", [], { shouldValidate: true, shouldDirty: true });
  };
  
  const deselectAllProducts = () => {
    form.setValue("selectedProductIds", [], { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-white">
      <CardHeader className="p-5 md:p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Package className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg md:text-xl font-semibold">Select Catalog Items</CardTitle>
            <CardDescription className="text-sm text-gray-500">Choose what to display on your website</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6 pt-0 space-y-5">
        {selectedServiceIds.length === 0 && selectedProductIds.length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              At least 1 service or product must be selected.
            </p>
          </div>
        )}
        
        {/* Services Section - Fully visible on all devices */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-medium text-base">Services</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedServiceIds.length}/{services.length} selected
              </Badge>
              {services.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllServices}
                    className="text-xs h-7 px-2"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllServices}
                    className="text-xs h-7 px-2"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
          {services.length > 0 ? (
            <div className="border rounded-lg p-3 md:p-4 space-y-2 max-h-[50vh] md:max-h-80 overflow-y-auto bg-muted/30 overscroll-contain">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className="flex items-start gap-3 p-3 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border"
                >
                  <Checkbox
                    checked={selectedServiceIds.includes(service.id)}
                    onCheckedChange={(checked) => toggleService(service.id, !!checked)}
                    data-testid={`checkbox-service-${service.id}`}
                    className="mt-0.5 h-5 w-5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">{service.name}</span>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                    )}
                    {service.basePrice && (
                      <p className="text-xs font-medium text-primary mt-1">₹{service.basePrice}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                No services available. Add services in the Services Catalogue module first.
              </p>
            </div>
          )}
        </div>

        {/* Products Section - Fully visible on all devices */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-medium text-base">Products</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedProductIds.length}/{products.length} selected
              </Badge>
              {products.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllProducts}
                    className="text-xs h-7 px-2"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAllProducts}
                    className="text-xs h-7 px-2"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
          {products.length > 0 ? (
            <div className="border rounded-lg p-3 md:p-4 space-y-2 max-h-[50vh] md:max-h-80 overflow-y-auto bg-muted/30 overscroll-contain">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-start gap-3 p-3 hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border"
                >
                  <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onCheckedChange={(checked) => toggleProduct(product.id, !!checked)}
                    data-testid={`checkbox-product-${product.id}`}
                    className="mt-0.5 h-5 w-5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">{product.name}</span>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                    )}
                    {product.sellingPrice && (
                      <p className="text-xs font-medium text-primary mt-1">₹{product.sellingPrice}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                No products available. Add products in the Products Catalogue module first.
              </p>
            </div>
          )}
        </div>
        
        {services.length === 0 && products.length === 0 && (
          <div className="border rounded-lg p-6 bg-muted/30 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">No catalog items available</p>
            <p className="text-xs text-muted-foreground">
              Please add services or products in their respective catalogue modules first.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Trust Numbers Step Component - Display trust metrics below hero
function TrustNumbersStep({ form }: { form: any }) {
  const trustNumbers = form.watch("trustNumbers") || { yearsInBusiness: 0, happyCustomers: 0, starRating: 0, repeatCustomers: 0 };
  
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Trust Numbers
        </CardTitle>
        <CardDescription>
          Add credibility metrics that will be displayed below your hero section. You can skip this step if you prefer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="trustNumbers.yearsInBusiness"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Years in Business
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    placeholder="e.g., 5"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>How many years have you been in business?</FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="trustNumbers.happyCustomers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <span className="text-2xl">😊</span>
                  Happy Customers
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    placeholder="e.g., 1000"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Approximate number of happy customers</FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="trustNumbers.starRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  Star Rating
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    max={5}
                    step={0.1}
                    placeholder="e.g., 4.8"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Your average star rating (0-5)</FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="trustNumbers.repeatCustomers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Repeat Customers %
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    max={100}
                    placeholder="e.g., 85"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Percentage of repeat customers</FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        {/* Preview */}
        <div className="border rounded-xl p-4 bg-muted/30">
          <p className="text-sm font-medium mb-3">Preview (displayed below hero section):</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-background rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-primary">{trustNumbers.yearsInBusiness}+</p>
              <p className="text-xs text-muted-foreground">Years in Business</p>
            </div>
            <div className="p-3 bg-background rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-primary">{trustNumbers.happyCustomers}+</p>
              <p className="text-xs text-muted-foreground">Happy Customers</p>
            </div>
            <div className="p-3 bg-background rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                {trustNumbers.starRating} <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </p>
              <p className="text-xs text-muted-foreground">Star Rating</p>
            </div>
            <div className="p-3 bg-background rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-primary">{trustNumbers.repeatCustomers}%+</p>
              <p className="text-xs text-muted-foreground">Repeat Customers</p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          💡 Leave fields as 0 to hide them on your website
        </p>
      </CardContent>
    </Card>
  );
}

// Social Media Links Step Component
function SocialMediaStep({ form }: { form: any }) {
  const socialMedia = form.watch("socialMedia") || { facebook: "", instagram: "", youtube: "", twitter: "" };
  
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Social Media Links
        </CardTitle>
        <CardDescription>
          Add your social media links. Only filled links will appear in your website footer with their official logos. You can skip this step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="socialMedia.facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://facebook.com/yourbusiness"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialMedia.instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                Instagram
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://instagram.com/yourbusiness"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialMedia.youtube"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://youtube.com/@yourbusiness"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialMedia.twitter"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Twitter / X
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://twitter.com/yourbusiness"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* Preview */}
        <div className="border rounded-xl p-4 bg-muted/30">
          <p className="text-sm font-medium mb-3">Preview (displayed in footer):</p>
          <div className="flex items-center gap-4 justify-center">
            {socialMedia.facebook && (
              <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            )}
            {socialMedia.instagram && (
              <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white hover:opacity-80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
              </a>
            )}
            {socialMedia.youtube && (
              <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:opacity-80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            )}
            {socialMedia.twitter && (
              <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white hover:opacity-80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {!socialMedia.facebook && !socialMedia.instagram && !socialMedia.youtube && !socialMedia.twitter && (
              <p className="text-sm text-muted-foreground">No social media links added yet</p>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          💡 Only filled links will appear in your website footer
        </p>
      </CardContent>
    </Card>
  );
}

// Color Theme Step Component (Step 15 - Before Publish)
function ColorThemeStep({ form }: { form: any }) {
  // Handle color theme change
  const handleThemeChange = (theme: { primary: string; secondary: string; accent: string }) => {
    form.setValue("primaryColor", theme.primary, { shouldValidate: true, shouldDirty: true });
    form.setValue("secondaryColor", theme.secondary, { shouldValidate: true, shouldDirty: true });
    form.setValue("accentColor", theme.accent, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Your Color Theme
          </CardTitle>
          <CardDescription>
            Select a color theme for your website. This will define the overall look and feel of your mini-website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColorThemeSelector
            selectedTheme={{
              primary: form.watch("primaryColor") || "#0f766e",
              secondary: form.watch("secondaryColor") || "#14b8a6",
              accent: form.watch("accentColor") || "#0d9488",
            }}
            onThemeChange={handleThemeChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Legacy Gallery & Design Step Component (kept for backwards compatibility)
function GalleryStep({ form }: { form: any }) {
  const handleImagesChange = async (urls: string[]) => {
    form.setValue("heroMedia", urls, { shouldValidate: true, shouldDirty: true });
  };

  // Handle color theme change
  const handleThemeChange = (theme: { primary: string; secondary: string; accent: string }) => {
    form.setValue("primaryColor", theme.primary, { shouldValidate: true, shouldDirty: true });
    form.setValue("secondaryColor", theme.secondary, { shouldValidate: true, shouldDirty: true });
    form.setValue("accentColor", theme.accent, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      {/* Color Theme Selector */}
      <ColorThemeSelector
        selectedTheme={{
          primary: form.watch("primaryColor") || "#0f766e",
          secondary: form.watch("secondaryColor") || "#14b8a6",
          accent: form.watch("accentColor") || "#0d9488",
        }}
        onThemeChange={handleThemeChange}
      />

      {/* Gallery Images Card */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gallery Images
          </CardTitle>
          <CardDescription>
            Upload up to 10 images to showcase your business. These will be displayed in your website gallery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-base">Business Gallery</h4>
              <Badge variant="secondary">
                {(form.watch("heroMedia") || []).length}/10 images
              </Badge>
            </div>

            <MultiFileUpload
              values={form.watch("heroMedia") || []}
              onChange={handleImagesChange}
              category="hero"
              maxFiles={10}
              className="w-full"
              allowAnyFile={true}
            />

            <p className="text-sm text-muted-foreground">
              Upload high-quality images of your business, products, or services. Recommended size: 1200x800px or larger.
            </p>

            {/* Preview Grid */}
            {(form.watch("heroMedia") || []).length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-3">Preview</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(form.watch("heroMedia") || []).map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentImages = form.watch("heroMedia") || [];
                          const newImages = currentImages.filter((_: string, i: number) => i !== index);
                          form.setValue("heroMedia", newImages, { shouldValidate: true, shouldDirty: true });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Team Members Step - Optimized
function TeamMembersStep({ form }: { form: any }) {
  const [newMember, setNewMember] = useState({ name: "", role: "", bio: "", photo: "" });
  const teamMembers = form.watch("teamMembers") || [];

  const addTeamMember = () => {
    if (newMember.name && newMember.role) {
      const currentTeamMembers = form.watch("teamMembers") || [];
      form.setValue("teamMembers", [...currentTeamMembers, newMember]);
      setNewMember({ name: "", role: "", bio: "", photo: "" });
    }
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-white">
      <CardHeader className="p-5 md:p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-pink-50 flex items-center justify-center">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-pink-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg md:text-xl font-semibold">Team Members</CardTitle>
            <CardDescription className="text-sm text-gray-500">Introduce your team to visitors</CardDescription>
          </div>
          <Badge variant={teamMembers.length >= 1 ? "default" : "destructive"} className="text-xs">
            {teamMembers.length} added
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6 pt-0 space-y-5">
        {teamMembers.length < 1 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              At least 1 team member is required.
            </p>
          </div>
        )}
        
        {/* Add New Member Form */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Add Team Member</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Full Name *"
              data-testid="input-team-name"
              className="h-11 rounded-xl"
            />
            <Input
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              placeholder="Role / Designation *"
              data-testid="input-team-role"
              className="h-11 rounded-xl"
            />
          </div>
          <Textarea
            value={newMember.bio}
            onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
            placeholder="Short bio (optional)"
            data-testid="input-team-bio"
            rows={2}
            className="rounded-xl resize-none"
          />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Photo (optional)</label>
            <FileUpload
              value={newMember.photo}
              onChange={(url) => setNewMember({ ...newMember, photo: url })}
              category="team"
              circular
              allowAnyFile
            />
          </div>
          <Button 
            type="button" 
            onClick={addTeamMember} 
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700" 
            data-testid="button-add-team"
            disabled={!newMember.name || !newMember.role}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Team Members List */}
        {teamMembers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Added Members ({teamMembers.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamMembers.map((member: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{member.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500 truncate">{member.role}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      const members = teamMembers.filter((_: any, i: number) => i !== index);
                      form.setValue("teamMembers", members);
                    }}
                    data-testid={`button-remove-team-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Common FAQs with suggested answers
const COMMON_FAQS = [
  {
    question: "What are your business hours?",
    answers: [
      "We are open Monday to Saturday from 9 AM to 6 PM. We are closed on Sundays.",
      "Our business hours are Monday to Friday 10 AM to 7 PM, and Saturday 10 AM to 5 PM. We're closed on Sundays."
    ]
  },
  {
    question: "Do you offer home delivery?",
    answers: [
      "Yes, we offer home delivery for all products. Delivery charges and timeframes are mentioned on each product page.",
      "Yes, we provide home delivery services. Delivery charges vary based on location and are calculated at checkout."
    ]
  },
  {
    question: "What payment methods do you accept?",
    answers: [
      "We accept Cash on Delivery (COD) for all orders. Payment is made when you receive your order.",
      "Currently, we only accept Cash on Delivery. You can pay when your order is delivered to your doorstep."
    ]
  },
  {
    question: "What is your return/refund policy?",
    answers: [
      "We offer returns within 7 days of delivery if the product is unused and in original condition. Refunds are processed within 5-7 business days.",
      "You can return products within 10 days of purchase. Items must be in original packaging and unused. Refunds are processed within 3-5 business days."
    ]
  },
  {
    question: "How can I contact customer support?",
    answers: [
      "You can reach us via phone, email, or WhatsApp. Our contact details are available on the contact page. We typically respond within 24 hours.",
      "Contact us through phone, email, or the contact form on our website. Our customer support team is available Monday to Saturday, 9 AM to 6 PM."
    ]
  },
  {
    question: "Do you provide warranties or guarantees?",
    answers: [
      "Yes, we provide warranties on all our products. Warranty terms vary by product and are clearly mentioned in the product description. We stand behind the quality of our products.",
      "We offer a satisfaction guarantee on all our products and services. If you're not satisfied with your purchase, contact us within the warranty period for assistance."
    ]
  },
  {
    question: "How long does shipping take?",
    answers: [
      "Standard shipping typically takes 3-5 business days within the city and 5-7 business days for out-of-city orders. Express delivery options are available for faster delivery.",
      "Delivery times vary based on your location. Local deliveries are usually completed within 2-3 days, while outstation orders may take 5-10 business days."
    ]
  },
  {
    question: "Can I track my order?",
    answers: [
      "Yes, once your order is confirmed, you'll receive a tracking number via SMS and email. You can use this to track your order status in real-time.",
      "Absolutely! We provide order tracking for all shipments. You'll receive updates via WhatsApp and email at each stage of the delivery process."
    ]
  },
  {
    question: "Do you offer bulk discounts?",
    answers: [
      "Yes, we offer special pricing for bulk orders. Please contact us directly with your requirements, and we'll provide a customized quote based on quantity.",
      "We provide attractive discounts on bulk purchases. The discount percentage increases with order quantity. Contact our sales team for detailed pricing information."
    ]
  },
  {
    question: "What areas do you serve?",
    answers: [
      "We currently serve [City Name] and surrounding areas. We're continuously expanding our service area. Contact us to check if we deliver to your location.",
      "We provide services across [City Name] and nearby regions. For delivery to other cities, please contact us to discuss availability and shipping options."
    ]
  }
];

// Common Testimonials with suggested content
const COMMON_TESTIMONIALS = [
  {
    customerName: "Rajesh Kumar",
    customerLocation: "Mumbai",
    rating: 5,
    reviewText: "Excellent service! The product quality exceeded my expectations. Highly recommend this business to everyone."
  },
  {
    customerName: "Priya Sharma",
    customerLocation: "Delhi",
    rating: 5,
    reviewText: "Very satisfied with my purchase. Fast delivery and great customer support. Will definitely order again!"
  },
  {
    customerName: "Amit Patel",
    customerLocation: "Bangalore",
    rating: 5,
    reviewText: "Outstanding quality and professional service. The team was very helpful throughout the process. 5 stars!"
  },
  {
    customerName: "Sneha Reddy",
    customerLocation: "Hyderabad",
    rating: 5,
    reviewText: "Best experience ever! The product arrived on time and in perfect condition. Very happy with my purchase."
  },
  {
    customerName: "Vikram Singh",
    customerLocation: "Pune",
    rating: 5,
    reviewText: "Great value for money. The quality is top-notch and the service is exceptional. Highly recommended!"
  },
  {
    customerName: "Anjali Mehta",
    customerLocation: "Chennai",
    rating: 5,
    reviewText: "Amazing service! The team went above and beyond to ensure customer satisfaction. Truly impressed!"
  },
  {
    customerName: "Rahul Verma",
    customerLocation: "Kolkata",
    rating: 5,
    reviewText: "Professional service and excellent product quality. The delivery was prompt and packaging was perfect."
  },
  {
    customerName: "Kavita Nair",
    customerLocation: "Ahmedabad",
    rating: 5,
    reviewText: "Very happy with the service. The product quality is excellent and the customer support is responsive."
  },
  {
    customerName: "Suresh Iyer",
    customerLocation: "Jaipur",
    rating: 5,
    reviewText: "Outstanding experience from start to finish. Great quality products and reliable service. Will come back!"
  },
  {
    customerName: "Meera Joshi",
    customerLocation: "Surat",
    rating: 5,
    reviewText: "Excellent business! The products are of great quality and the service is professional. Highly satisfied!"
  }
];

// FAQs Step Component
function FAQsStep({ form }: { form: any }) {
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [selectedCommonFaqs, setSelectedCommonFaqs] = useState<Set<number>>(new Set());

  const addFaq = () => {
    if (newFaq.question && newFaq.answer) {
      const faqs = form.watch("faqs") || [];
      form.setValue("faqs", [...faqs, { ...newFaq, order: faqs.length }]);
      setNewFaq({ question: "", answer: "" });
    }
  };

  const addCommonFaq = (faqIndex: number, answerIndex: number) => {
    const selectedFaq = COMMON_FAQS[faqIndex];
    const faqs = form.watch("faqs") || [];
    form.setValue("faqs", [...faqs, { 
      question: selectedFaq.question, 
      answer: selectedFaq.answers[answerIndex],
      order: faqs.length 
    }], { shouldValidate: true, shouldDirty: true });
    setSelectedCommonFaqs(new Set([...selectedCommonFaqs, faqIndex]));
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const faqs = (form.watch("faqs") || []).map((faq: any, i: number) => 
      i === index ? { ...faq, [field]: value } : faq
    );
    form.setValue("faqs", faqs, { shouldValidate: true, shouldDirty: true });
  };

  const isFaqAdded = (faqIndex: number) => {
    const faqs = form.watch("faqs") || [];
    const commonFaq = COMMON_FAQS[faqIndex];
    return faqs.some((faq: any) => faq.question === commonFaq.question);
  };

  const currentFaqs = form.watch("faqs") || [];

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          FAQs
        </CardTitle>
        <CardDescription>
          Add frequently asked questions. You can select from common FAQs or create your own.
          <span className="block mt-1 text-xs text-amber-600">
            * At least 1 FAQ is required to proceed
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentFaqs.length < 1 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              At least 1 FAQ is required.
            </p>
          </div>
        )}
        {/* Custom FAQ Creation - Moved Above Suggested FAQs */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Create Custom FAQ</h4>
            <div className="space-y-3">
              <Input
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="Question"
                data-testid="input-faq-question"
              />
              <Textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Answer"
                data-testid="input-faq-answer"
                rows={3}
              />
              <Button type="button" onClick={addFaq} className="w-full" data-testid="button-add-faq">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom FAQ
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Or Select from Suggested FAQs</h4>
          <p className="text-sm text-muted-foreground mb-3">Choose from common questions (Select one answer for each)</p>
          <div className="space-y-3">
            {COMMON_FAQS.map((faq, faqIndex) => {
              const isAdded = isFaqAdded(faqIndex);
              return (
                <div key={faqIndex} className="border rounded-lg p-4 space-y-3">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {faq.answers.map((answer, answerIndex) => (
                      <Button
                        key={answerIndex}
                        type="button"
                        variant={isAdded ? "outline" : "default"}
                        size="sm"
                        onClick={() => !isAdded && addCommonFaq(faqIndex, answerIndex)}
                        disabled={isAdded}
                        className="text-left h-auto py-2 px-3 text-xs whitespace-normal"
                      >
                        {answer}
                      </Button>
                    ))}
                  </div>
                  {isAdded && (
                    <p className="text-xs text-green-600">✓ Added to your FAQs</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {form.watch("faqs") && Array.isArray(form.watch("faqs")) && form.watch("faqs").length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-medium">Your FAQs ({form.watch("faqs").length})</h4>
            {(form.watch("faqs") || []).map((faq: any, index: number) => (
              <div key={index} className="p-3 border rounded-md space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Input
                    value={faq.question || ""}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Question"
                    className="flex-1 text-sm font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const faqs = (form.watch("faqs") || []).filter((_: any, i: number) => i !== index);
                      form.setValue("faqs", faqs, { shouldValidate: true, shouldDirty: true });
                    }}
                    data-testid={`button-remove-faq-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={faq.answer || ""}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                  placeholder="Answer"
                  className="text-sm"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Testimonials Step Component
function TestimonialsStep({ form }: { form: any }) {
  const { toast } = useToast();
  const [newTestimonial, setNewTestimonial] = useState({
    customerName: "",
    customerLocation: "",
    rating: 5,
    reviewText: "",
  });

  const addTestimonial = () => {
    if (!newTestimonial.customerName || !newTestimonial.customerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    if (!newTestimonial.reviewText || !newTestimonial.reviewText.trim()) {
      toast({
        title: "Validation Error",
        description: "Review text is required",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const testimonials = form.watch("testimonials") || [];
    const newTestimonialData = { 
      ...newTestimonial,
      customerName: newTestimonial.customerName.trim(),
      reviewText: newTestimonial.reviewText.trim(),
      order: testimonials.length 
    };
    
    form.setValue("testimonials", [...testimonials, newTestimonialData], { 
      shouldValidate: true, 
      shouldDirty: true 
    });
    
    setNewTestimonial({
      customerName: "",
      customerLocation: "",
      rating: 5,
      reviewText: "",
    });

    toast({
      title: "✓ Testimonial Added",
      description: "Testimonial has been added successfully",
      duration: 2000,
    });
  };

  const addCommonTestimonial = (testimonialIndex: number) => {
    const selectedTestimonial = COMMON_TESTIMONIALS[testimonialIndex];
    const testimonials = form.watch("testimonials") || [];
    form.setValue("testimonials", [...testimonials, { 
      ...selectedTestimonial,
      order: testimonials.length 
    }], { shouldValidate: true, shouldDirty: true });
    
    toast({
      title: "✓ Testimonial Added",
      description: "You can customize it below.",
      duration: 2000,
    });
  };

  const updateTestimonial = (index: number, field: 'customerName' | 'customerLocation' | 'reviewText' | 'rating', value: string | number) => {
    const testimonials = (form.watch("testimonials") || []).map((testimonial: any, i: number) => 
      i === index ? { ...testimonial, [field]: value } : testimonial
    );
    form.setValue("testimonials", testimonials, { shouldValidate: true, shouldDirty: true });
  };

  const testimonials = form.watch("testimonials") || [];
  const remaining = Math.max(0, 3 - testimonials.length);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Testimonials
        </CardTitle>
        <CardDescription>
          Add at least 3 testimonials to proceed. {testimonials.length >= 3 ? "✓ Requirement met" : `You need ${remaining} more testimonial${remaining !== 1 ? 's' : ''}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {testimonials.length < 3 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              At least 3 testimonials are required. You have {testimonials.length} of 3.
            </p>
          </div>
        )}

        {/* Custom Testimonial Creation */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Create Custom Testimonial</h4>
            <div className="space-y-3">
          <Input
            value={newTestimonial.customerName}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, customerName: e.target.value })}
            placeholder="Customer Name"
            data-testid="input-testimonial-name"
          />
          <Input
            value={newTestimonial.customerLocation}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, customerLocation: e.target.value })}
            placeholder="Location (optional)"
            data-testid="input-testimonial-location"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Rating:</label>
            <Select
              value={newTestimonial.rating.toString()}
              onValueChange={(value) => setNewTestimonial({ ...newTestimonial, rating: parseInt(value) })}
            >
              <SelectTrigger className="w-24" data-testid="select-testimonial-rating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} ⭐
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={newTestimonial.reviewText}
            onChange={(e) => setNewTestimonial({ ...newTestimonial, reviewText: e.target.value })}
            placeholder="Review Text"
            data-testid="input-testimonial-text"
            rows={3}
          />
              <Button type="button" onClick={addTestimonial} className="w-full" data-testid="button-add-testimonial">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Testimonial
              </Button>
            </div>
          </div>
        </div>

        {/* Suggested Testimonials */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Or Select from Suggested Testimonials</h4>
          <p className="text-sm text-muted-foreground mb-3">Choose from common testimonials (You can customize them after adding)</p>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {COMMON_TESTIMONIALS.map((testimonial, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCommonTestimonial(index)}
                className="h-auto min-h-[120px] p-4 text-left justify-start hover:bg-accent transition-colors"
              >
                <div className="flex-1 w-full space-y-2">
                  <div>
                    <p className="font-medium text-sm leading-tight">{testimonial.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{testimonial.customerLocation}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-xs">{"⭐".repeat(testimonial.rating)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">{testimonial.reviewText}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Editable Testimonials List */}
        {form.watch("testimonials") && Array.isArray(form.watch("testimonials")) && form.watch("testimonials").length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Your Testimonials ({form.watch("testimonials").length})</h4>
            {(form.watch("testimonials") || []).map((testimonial: any, index: number) => (
              <div key={index} className="p-4 border rounded-md space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Customer Name</label>
                    <Input
                      value={testimonial.customerName || ""}
                      onChange={(e) => updateTestimonial(index, 'customerName', e.target.value)}
                      placeholder="Customer Name"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                    <Input
                      value={testimonial.customerLocation || ""}
                      onChange={(e) => updateTestimonial(index, 'customerLocation', e.target.value)}
                      placeholder="Location (optional)"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Rating:</label>
                  <Select
                    value={testimonial.rating?.toString() || "5"}
                    onValueChange={(value) => updateTestimonial(index, 'rating', parseInt(value))}
                  >
                    <SelectTrigger className="w-24 h-8" data-testid={`select-testimonial-rating-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} ⭐
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Review Text</label>
                  <Textarea
                    value={testimonial.reviewText || ""}
                    onChange={(e) => updateTestimonial(index, 'reviewText', e.target.value)}
                    placeholder="Review Text"
                    className="text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const testimonials = (form.watch("testimonials") || []).filter((_: any, i: number) => i !== index);
                      form.setValue("testimonials", testimonials, { shouldValidate: true, shouldDirty: true });
                    }}
                    data-testid={`button-remove-testimonial-${index}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Coupons Step Component
function CouponsStep({ form }: { form: any }) {
  const { vendorId } = useAuth();

  // Fetch existing coupons from the coupons module
  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors", vendorId, "coupons"],
    enabled: !!vendorId,
  });

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Coupons & Offers
        </CardTitle>
        <CardDescription>Select coupons and offers to display on your mini-website</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {coupons.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium">Available Coupons</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center gap-2 p-3 border rounded-md">
                  <Checkbox
                    checked={(form.watch("selectedCouponIds") || []).includes(coupon.id)}
                    onCheckedChange={(checked) => {
                      const current = form.watch("selectedCouponIds") || [];
                      if (checked) {
                        form.setValue("selectedCouponIds", [...current, coupon.id]);
                      } else {
                        form.setValue("selectedCouponIds", current.filter(id => id !== coupon.id));
                      }
                    }}
                    data-testid={`checkbox-coupon-${coupon.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{coupon.code}</Badge>
                      <span className="font-medium text-sm">{coupon.description || "Coupon"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {coupon.discountType === "percentage" 
                        ? `${coupon.discountValue}% OFF` 
                        : `₹${coupon.discountValue} OFF`}
                      {coupon.minOrderAmount > 0 && ` • Min. order: ₹${coupon.minOrderAmount}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No coupons available.</p>
            <p className="text-xs mt-1">Create coupons in the Coupons & Offers module first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Live Preview Component - Clean Premium Design matching LayoutSelector preview
function LivePreview({ 
  formData, 
  services: allServices = [], 
  products: allProducts = [] 
}: { 
  formData: FormValues;
  services?: VendorCatalogue[];
  products?: VendorProduct[];
}) {
  const { vendorId } = useAuth();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  const primaryColor = formData.primaryColor || "#2563eb";
  const secondaryColor = formData.secondaryColor || "#f97316";
  const accentColor = formData.accentColor || "#06b6d4";
  
  // Get selected layout configuration
  const selectedLayout = websiteLayouts.find(l => l.id === formData.layoutId) || websiteLayouts[0];

  // Filter services and products based on selection
  const services = allServices.filter((s) => (formData.selectedServiceIds || []).includes(s.id));
  const products = allProducts.filter((p) => (formData.selectedProductIds || []).includes(p.id));

  // Fetch selected coupons
  const { data: allCoupons = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors", vendorId, "coupons"],
    enabled: !!vendorId && (formData.selectedCouponIds || []).length > 0,
  });
  
  const coupons = allCoupons.filter((c) => (formData.selectedCouponIds || []).includes(c.id));

  // Default offers if no coupons
  const defaultOffers = [
    { title: '20% Off All Services', description: 'Valid until end of month.', badge: '20% DISCOUNT', cta: 'Get Code', color: '#dcfce7' },
    { title: 'Premium Package Deal', description: 'Get our top services at special price.', badge: null, cta: 'View Details', color: '#fef3c7' },
    { title: 'New Product Launch!', description: 'Be the first to try our latest arrival.', badge: null, cta: 'Learn More', color: '#dbeafe' },
    { title: 'Student Discount', description: 'Show your ID to avail the offer.', badge: null, cta: 'View Details', color: '#fce7f3' },
  ];

  // Fullscreen Image Modal
  const FullscreenModal = () => {
    if (!fullscreenImage) return null;
    return (
      <div 
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-pointer"
        onClick={() => setFullscreenImage(null)}
      >
        <button 
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          onClick={() => setFullscreenImage(null)}
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={fullscreenImage} 
          alt="Fullscreen" 
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      <FullscreenModal />
      {/* ===== HEADER - Matches Published Website ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="w-full px-4 md:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo Section - Same as Published Website */}
            <div className="flex items-center gap-3 md:gap-4">
              {formData.logo ? (
                <img src={formData.logo} alt={formData.businessName || "Logo"} className="h-10 w-10 md:h-14 md:w-14 rounded-xl object-cover shadow-md" />
              ) : (
                <div 
                  className="h-10 w-10 md:h-14 md:w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-2xl shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {formData.businessName?.charAt(0)?.toUpperCase() || "Y"}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="flex items-center gap-2 md:gap-3">
                  <h1 className="font-bold text-lg md:text-xl lg:text-2xl text-gray-900">{formData.businessName || "Your Business"}</h1>
                  {/* VYORA Verified Badge - Same as Published */}
                  <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full" style={{ backgroundColor: primaryColor + '15' }}>
                    <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: primaryColor }} />
                    <span className="text-[10px] md:text-xs font-semibold" style={{ color: primaryColor }}>Verified</span>
                  </div>
                </div>
                {formData.tagline && <p className="text-xs md:text-sm text-gray-500 mt-0.5 max-w-md line-clamp-1">{formData.tagline}</p>}
              </div>
            </div>
            
            {/* Navigation - Hidden on mobile */}
            {/* Desktop Navigation - Centered with Background - Same as Published */}
            <nav className="hidden lg:flex items-center gap-1 bg-gray-50 rounded-full px-2 py-1.5">
              <a href="#products" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Products</a>
              <a href="#services" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Services</a>
              <a href="#gallery" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Gallery</a>
              <a href="#about" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">About</a>
              <a href="#contact" className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all">Contact</a>
            </nav>
            
            {/* Right Actions - Same as Published */}
            <div className="flex items-center gap-3">
              {/* Business Status Indicator - Only on desktop */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500"></span>
                <span className="text-sm font-semibold">Open Now</span>
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                className="hidden md:inline-flex rounded-full px-5 h-10 font-semibold text-sm border-2 hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Phone className="w-4 h-4 mr-1.5" />
                Call Now
              </Button>
              <Button 
                size="sm"
                className="rounded-full px-5 h-10 font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                Get Quote
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION - Premium Split Layout ===== */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30" style={{ 
          background: `radial-gradient(circle at 30% 20%, ${primaryColor}15 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${accentColor}10 0%, transparent 40%)`
        }} />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-20 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 md:mb-6" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                {formData.tagline || "Welcome to our business"}
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-[1.1] tracking-tight">
                {formData.businessName || "Your Business Name"}
              </h1>
              
              <p className="text-gray-600 text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {formData.description?.substring(0, 150) || "Discover our premium products and services. We are committed to delivering exceptional quality and outstanding customer experience."}
                {formData.description && formData.description.length > 150 && "..."}
              </p>
              
              {/* Rating & Location */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mb-6 md:mb-8 justify-center lg:justify-start">
                {(formData.trustNumbers?.starRating || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 md:w-5 md:h-5 ${i <= (formData.trustNumbers?.starRating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{formData.trustNumbers?.starRating || "5.0"}</span>
                    <span className="text-xs text-gray-500">({formData.trustNumbers?.happyCustomers || "500"}+ reviews)</span>
                  </div>
                )}
                {formData.address && (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-xs md:text-sm">{formData.address.substring(0, 40)}{formData.address.length > 40 && "..."}</span>
                  </div>
                )}
              </div>
              
              {/* CTA Buttons - Equal Size */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button 
                  className="rounded-full h-11 md:h-12 px-6 md:px-8 text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}
                  onClick={() => formData.googleMapsUrl && window.open(formData.googleMapsUrl, '_blank')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full h-11 md:h-12 px-6 md:px-8 text-sm font-semibold border-2 hover:bg-gray-50 transition-all"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onClick={() => formData.contactPhone && window.open(`tel:${formData.contactPhone}`, '_self')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
                <Button 
                  className="rounded-full h-11 md:h-12 px-6 md:px-8 text-sm font-semibold shadow-lg hover:shadow-xl transition-all bg-[#25D366] hover:bg-[#20BD5A]"
                  onClick={() => formData.contactPhone && window.open(`https://wa.me/${formData.contactPhone?.replace(/\D/g, '')}`, '_blank')}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </Button>
              </div>
            </div>
            
            {/* Right - Hero Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 md:w-32 md:h-32 rounded-full opacity-20" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 md:w-24 md:h-24 rounded-full opacity-20" style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }} />
                
                {formData.heroMedia && Array.isArray(formData.heroMedia) && formData.heroMedia.length > 0 ? (
                  <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative">
                    <img 
                      src={formData.heroMedia[0]} 
                      alt={formData.businessName || "Business"} 
                      className="w-full h-[280px] md:h-[400px] lg:h-[480px] object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                      onClick={() => setFullscreenImage(formData.heroMedia[0])}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div 
                    className="rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl h-[280px] md:h-[400px] lg:h-[480px] flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}
                  >
                    <div className="text-center p-8">
                      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}30)` }}>
                        <ImageIcon className="w-10 h-10 md:w-12 md:h-12" style={{ color: primaryColor }} />
                      </div>
                      <p className="font-semibold text-sm md:text-base" style={{ color: primaryColor }}>Your Hero Image</p>
                      <p className="text-xs text-gray-500 mt-1">Upload in Gallery step</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST NUMBERS SECTION ===== */}
      <section className="relative py-8 md:py-12 border-y" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}05)` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Years in Business */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}>
                  <Clock className="w-6 h-6 md:w-7 md:h-7" style={{ color: primaryColor }} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1" style={{ color: primaryColor }}>
                {formData.trustNumbers?.yearsInBusiness || "5"}+
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Years in Business</div>
            </div>
            
            {/* Happy Customers */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}>
                  <Users className="w-6 h-6 md:w-7 md:h-7" style={{ color: primaryColor }} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1" style={{ color: primaryColor }}>
                {formData.trustNumbers?.happyCustomers || "1000"}+
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Happy Customers</div>
            </div>
            
            {/* Star Rating */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}>
                  <Star className="w-6 h-6 md:w-7 md:h-7 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1 flex items-center justify-center gap-1" style={{ color: primaryColor }}>
                {formData.trustNumbers?.starRating || "4.9"}
                <Star className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Star Rating</div>
            </div>
            
            {/* Repeat Customers */}
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:scale-110 transition-transform" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}>
                  <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" style={{ color: primaryColor }} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1" style={{ color: primaryColor }}>
                {formData.trustNumbers?.repeatCustomers || "85"}%
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-medium">Repeat Customers</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ===== OFFERS AND COUPONS ===== */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}>
              <Tag className="w-3.5 h-3.5" />
              Special Deals
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Offers & Coupons</h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">Don't miss out on our exclusive deals and discounts</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {coupons.length > 0 ? (
              coupons.slice(0, 4).map((coupon: any, idx: number) => (
                <div key={coupon.id} className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white hover:-translate-y-1">
                  <div 
                    className="h-28 md:h-36 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${idx === 0 ? '#dcfce7' : idx === 1 ? '#fef3c7' : idx === 2 ? '#dbeafe' : '#fce7f3'}, ${idx === 0 ? '#bbf7d0' : idx === 1 ? '#fde68a' : idx === 2 ? '#bfdbfe' : '#fbcfe8'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    {coupon.discountType === 'percentage' && (
                      <div className="absolute top-3 left-3">
                        <Badge className="text-[10px] md:text-xs font-bold px-2.5 py-1 shadow-md" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}>
                          {coupon.discountValue}% OFF
                        </Badge>
                      </div>
                    )}
                    <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">{idx === 0 ? '🎉' : idx === 1 ? '⭐' : idx === 2 ? '🆕' : '🎓'}</span>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-1.5 text-sm md:text-base line-clamp-1">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{coupon.description || "Limited time special offer"}</p>
                    <Button 
                      size="sm" 
                      className="w-full rounded-xl text-xs md:text-sm h-9 md:h-10 font-semibold shadow-md hover:shadow-lg transition-all"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}
                    >
                      Get Code
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              defaultOffers.map((offer, idx) => (
                <div key={idx} className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white hover:-translate-y-1">
                  <div 
                    className="h-28 md:h-36 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${offer.color}, ${offer.color}dd)` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                    {offer.badge && (
                      <div className="absolute top-3 left-3">
                        <Badge className="text-[10px] md:text-xs font-bold px-2.5 py-1 shadow-md" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}>{offer.badge}</Badge>
                      </div>
                    )}
                    <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">{idx === 0 ? '🎉' : idx === 1 ? '⭐' : idx === 2 ? '🆕' : '🎓'}</span>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-1.5 text-sm md:text-base line-clamp-1">{offer.title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{offer.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full rounded-xl text-xs md:text-sm h-9 md:h-10 font-semibold shadow-md hover:shadow-lg transition-all"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}
                    >
                      {offer.cta}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===== OUR PRODUCTS ===== */}
      {(products.length > 0 || true) && (
        <section id="products" className="py-12 md:py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                <Package className="w-3.5 h-3.5" />
                Shop Now
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Our Products</h2>
              <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">Explore our curated collection of premium products</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {(products.length > 0 ? products : [
                { id: '1', name: 'Premium Product A', description: 'High-quality product with exceptional features and modern design.', salePrice: 3999, price: 4999 },
                { id: '2', name: 'Exclusive Product B', description: 'Limited edition product crafted with precision and care.', salePrice: 6499, price: 7999 },
                { id: '3', name: 'Essential Product C', description: 'Everyday essentials designed for your comfort and convenience.', salePrice: 2499 },
                { id: '4', name: 'Signature Product D', description: 'Our signature offering that defines quality and excellence.', salePrice: 7999, price: 9999 },
              ]).slice(0, 4).map((product: any, idx: number) => (
                <div key={product.id || idx} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                  <div className="relative h-36 md:h-48 lg:h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    {product.price && product.salePrice && product.price > product.salePrice && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5">
                          {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                        </Badge>
                      </div>
                    )}
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}15)` }}>
                        <Package className="w-12 h-12 md:w-16 md:h-16" style={{ color: `${primaryColor}40` }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-1.5 text-sm md:text-base line-clamp-1">{product.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-base md:text-lg" style={{ color: primaryColor }}>
                          ₹{(product.salePrice || product.price)?.toLocaleString()}
                        </span>
                        {product.price && product.salePrice && product.price > product.salePrice && (
                          <span className="text-[10px] md:text-xs text-gray-400 line-through">₹{product.price?.toLocaleString()}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="rounded-xl text-xs h-9 px-4 font-semibold shadow-md hover:shadow-lg transition-all"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View All Button */}
            <div className="text-center mt-8 md:mt-10">
              <Button 
                variant="outline" 
                className="rounded-full h-11 px-8 font-semibold border-2 hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                View All Products
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ===== OUR SERVICES ===== */}
      {(services.length > 0 || true) && (
        <section id="services" className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                <Store className="w-3.5 h-3.5" />
                What We Offer
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Our Services</h2>
              <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">Professional services tailored to meet your unique needs</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {(services.length > 0 ? services : [
                { id: '1', name: 'Premium Consultation', shortDescription: 'Expert advice and personalized recommendations for your specific needs.', price: 1999 },
                { id: '2', name: 'Professional Service', shortDescription: 'High-quality service delivered by our experienced professionals.', price: 2499 },
                { id: '3', name: 'Custom Solutions', shortDescription: 'Tailored solutions designed specifically for your requirements.', price: 1499 },
                { id: '4', name: 'VIP Package', shortDescription: 'Exclusive package with premium features and priority support.', price: 4999 },
              ]).slice(0, 4).map((service: any, idx: number) => (
                <div key={service.id || idx} className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                  <div className="h-32 md:h-44 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}12)` }}>
                    {service.images && service.images.length > 0 ? (
                      <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                        {selectedLayout?.icon ? <selectedLayout.icon className="w-8 h-8 md:w-10 md:h-10" style={{ color: primaryColor }} /> : <Store className="w-8 h-8 md:w-10 md:h-10" style={{ color: primaryColor }} />}
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-1.5 text-sm md:text-base line-clamp-1">{service.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{service.shortDescription || service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400">Starting from</span>
                        <span className="font-extrabold text-base md:text-lg" style={{ color: primaryColor }}>₹{service.price?.toLocaleString()}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="rounded-xl text-xs h-9 px-4 font-semibold shadow-md hover:shadow-lg transition-all"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`, color: 'white' }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View All Button */}
            <div className="text-center mt-8 md:mt-10">
              <Button 
                variant="outline" 
                className="rounded-full h-11 px-8 font-semibold border-2 hover:bg-gray-50"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                View All Services
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ===== GALLERY ===== */}
      <section id="gallery" className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <ImageIcon className="w-3.5 h-3.5" />
              Visual Gallery
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Our Gallery</h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">Take a visual tour of our work and space</p>
          </div>
          
          {formData.heroMedia && Array.isArray(formData.heroMedia) && formData.heroMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {formData.heroMedia.slice(0, 8).map((url: string, idx: number) => (
                <div 
                  key={idx} 
                  className={`group relative rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
                  onClick={() => setFullscreenImage(url)}
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    style={{ minHeight: idx === 0 ? '300px' : '150px' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[1,2,3,4].map((_, idx) => (
                <div key={idx} className="rounded-xl md:rounded-2xl overflow-hidden h-[150px] md:h-[200px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}15)` }}>
                  <ImageIcon className="w-10 h-10" style={{ color: `${primaryColor}40` }} />
                </div>
              ))}
            </div>
          )}
          <p className="text-center text-xs text-gray-400 mt-4">Click on any image to view fullscreen</p>
        </div>
      </section>

      {/* ===== ABOUT US & TEAM ===== */}
      <section id="about" className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Info className="w-3.5 h-3.5" />
              Who We Are
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">About Us</h2>
          </div>
          
          {/* About Content */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4" style={{ color: primaryColor }}>Our Story</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                {formData.description || "Welcome to our business! We are dedicated to providing exceptional products and services that exceed your expectations. Our team of professionals is committed to delivering quality, innovation, and outstanding customer experience in everything we do."}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Quality First</h4>
                    <p className="text-xs text-gray-500">Premium products & services</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                    <Users className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Customer Focus</h4>
                    <p className="text-xs text-gray-500">Your satisfaction matters</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                    <Star className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Excellence</h4>
                    <p className="text-xs text-gray-500">Best-in-class delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                    <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">On Time</h4>
                    <p className="text-xs text-gray-500">Timely service delivery</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              {formData.heroMedia && formData.heroMedia.length > 0 ? (
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img src={formData.heroMedia[0]} alt="About" className="w-full h-[300px] md:h-[400px] object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl h-[300px] md:h-[400px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}15)` }}>
                  <Store className="w-16 h-16" style={{ color: `${primaryColor}40` }} />
                </div>
              )}
            </div>
          </div>
          
          {/* Our Team */}
          {formData.teamMembers && Array.isArray(formData.teamMembers) && formData.teamMembers.length > 0 && (
            <div className="pt-8 md:pt-12 border-t">
              <div className="text-center mb-8 md:mb-10">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Meet Our Team</h3>
                <p className="text-gray-500 text-sm mt-2">The people behind our success</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {(formData.teamMembers || []).slice(0, 4).map((member: any, idx: number) => (
                  <div key={idx} className="text-center group">
                    <div className="relative mb-4">
                      <div 
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl mx-auto flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                      >
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name?.charAt(0)?.toUpperCase()
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm md:text-base">{member.name}</h4>
                    <p className="text-xs md:text-sm font-medium" style={{ color: primaryColor }}>{member.role}</p>
                    {member.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{member.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== BUSINESS HOURS ===== */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Clock className="w-3.5 h-3.5" />
              When to Visit
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Business Hours</h2>
            <p className="text-gray-500 text-sm md:text-base mt-2">Plan your visit during our operating hours</p>
          </div>
          
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              {/* Working Hours */}
              <div>
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                    <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">Working Hours</h3>
                </div>
                <div className="space-y-3">
                  {(formData.businessHours && formData.businessHours.length > 0 ? formData.businessHours : [
                    { day: 'Monday', isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
                    { day: 'Tuesday', isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
                    { day: 'Wednesday', isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
                    { day: 'Thursday', isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
                    { day: 'Friday', isOpen: true, slots: [{ open: '09:00', close: '18:00' }] },
                    { day: 'Saturday', isOpen: true, slots: [{ open: '10:00', close: '16:00' }] },
                    { day: 'Sunday', isOpen: false, slots: [] },
                  ]).map((day: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-700 text-sm">{day.day}</span>
                      {day.isOpen ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                          {day.slots?.[0]?.open || '09:00'} - {day.slots?.[0]?.close || '18:00'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Break Time */}
              <div>
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}15, ${primaryColor}20)` }}>
                    <svg className="w-4 h-4" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">Break Time</h3>
                </div>
                <div className="p-4 md:p-6 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                  <div className="text-center">
                    <p className="text-2xl md:text-3xl font-bold" style={{ color: accentColor }}>1:00 PM - 2:00 PM</p>
                    <p className="text-gray-500 text-xs md:text-sm mt-2">Daily Lunch Break</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}05)` }}>
                  <p className="text-xs md:text-sm text-gray-600">
                    <strong className="text-gray-900">Note:</strong> We may be closed on public holidays. Please call ahead to confirm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Star className="w-3.5 h-3.5" />
              What People Say
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Customer Testimonials</h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">Hear from our satisfied customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(formData.testimonials && formData.testimonials.length > 0 ? formData.testimonials : [
              { customerName: 'John Doe', customerLocation: 'Mumbai', rating: 5, reviewText: 'Exceptional service and amazing quality! The team went above and beyond to meet our needs. Highly recommended!' },
              { customerName: 'Sarah Smith', customerLocation: 'Delhi', rating: 5, reviewText: 'Best experience ever! Professional, timely, and the results exceeded my expectations. Will definitely come back!' },
              { customerName: 'Raj Patel', customerLocation: 'Bangalore', rating: 5, reviewText: 'Outstanding products and incredible customer service. They truly care about their customers. Five stars!' },
            ]).slice(0, 3).map((testimonial: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 md:w-5 md:h-5 ${i < (testimonial.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-5 md:mb-6 text-sm md:text-base leading-relaxed italic">"{testimonial.reviewText}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-md"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    {testimonial.customerName?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm md:text-base">{testimonial.customerName}</p>
                    {testimonial.customerLocation && (
                      <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {testimonial.customerLocation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQs ===== */}
      <section id="faq" className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <HelpCircle className="w-3.5 h-3.5" />
              Got Questions?
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">Find answers to common questions</p>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            {(formData.faqs && formData.faqs.length > 0 ? formData.faqs : [
              { question: 'What are your working hours?', answer: 'We are open Monday to Saturday from 9 AM to 6 PM. We are closed on Sundays and public holidays.' },
              { question: 'Do you offer home delivery?', answer: 'Yes, we offer home delivery for products within our service area. Delivery charges may apply based on location.' },
              { question: 'What payment methods do you accept?', answer: 'We accept cash on delivery, UPI, and bank transfers. Online payment options coming soon!' },
            ]).slice(0, 5).map((faq: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button className="w-full px-5 md:px-6 py-4 md:py-5 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <span className="font-semibold text-gray-900 text-sm md:text-base pr-4">{faq.question}</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                    <ChevronRight className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                </button>
                <div className="px-5 md:px-6 pb-4 md:pb-5">
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT US ===== */}
      <section id="contact" className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              <Phone className="w-3.5 h-3.5" />
              Get in Touch
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Contact Us</h2>
            <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl mx-auto">We'd love to hear from you</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
                <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-6">Contact Information</h3>
                
                <div className="space-y-4 md:space-y-5">
                  {formData.contactPhone && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                        <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Phone</p>
                        <a href={`tel:${formData.contactPhone}`} className="text-gray-600 text-sm hover:underline">{formData.contactPhone}</a>
                      </div>
                    </div>
                  )}
                  
                  {formData.contactEmail && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                        <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Email</p>
                        <a href={`mailto:${formData.contactEmail}`} className="text-gray-600 text-sm hover:underline">{formData.contactEmail}</a>
                      </div>
                    </div>
                  )}
                  
                  {formData.address && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}20)` }}>
                        <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Address</p>
                        <p className="text-gray-600 text-sm">{formData.address}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 md:mt-8">
                  <Button 
                    className="rounded-full h-11 px-6 text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, color: 'white' }}
                    onClick={() => formData.contactPhone && window.open(`tel:${formData.contactPhone}`, '_self')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  <Button 
                    className="rounded-full h-11 px-6 text-sm font-semibold shadow-lg hover:shadow-xl transition-all bg-[#25D366] hover:bg-[#20BD5A]"
                    onClick={() => formData.contactPhone && window.open(`https://wa.me/${formData.contactPhone?.replace(/\D/g, '')}`, '_blank')}
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </Button>
                  {formData.googleMapsUrl && (
                    <Button 
                      variant="outline"
                      className="rounded-full h-11 px-6 text-sm font-semibold border-2 hover:bg-gray-50"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                      onClick={() => window.open(formData.googleMapsUrl, '_blank')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Directions
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Map Embed or Contact Form Placeholder */}
            <div className="rounded-2xl overflow-hidden h-[300px] md:h-[400px] lg:h-full min-h-[300px]" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}05)` }}>
              {formData.googleMapsUrl ? (
                <iframe
                  src={formData.googleMapsUrl.includes('embed') ? formData.googleMapsUrl : `https://www.google.com/maps?q=${encodeURIComponent(formData.address || '')}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}30)` }}>
                    <MapPin className="w-8 h-8" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-semibold text-gray-900">Find Us</p>
                  <p className="text-sm text-gray-500 mt-1">{formData.address || 'Add your address to show map'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER - Professional & Detailed ===== */}
      <footer className="bg-gray-900 text-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {formData.logo ? (
                  <img src={formData.logo} alt={formData.businessName || "Logo"} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    {formData.businessName?.charAt(0)?.toUpperCase() || "Y"}
                  </div>
                )}
                <span className="text-lg font-bold">{formData.businessName || "Your Business"}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {formData.tagline || "Delivering excellence and quality in everything we do. Your satisfaction is our priority."}
              </p>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-2">
                {formData.socialMedia?.facebook && (
                  <a 
                    href={formData.socialMedia.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#1877F2] flex items-center justify-center text-white transition-all hover:scale-110"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {formData.socialMedia?.instagram && (
                  <a 
                    href={formData.socialMedia.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 flex items-center justify-center text-white transition-all hover:scale-110"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                  </a>
                )}
                {formData.socialMedia?.youtube && (
                  <a 
                    href={formData.socialMedia.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#FF0000] flex items-center justify-center text-white transition-all hover:scale-110"
                    aria-label="YouTube"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {formData.socialMedia?.twitter && (
                  <a 
                    href={formData.socialMedia.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-black flex items-center justify-center text-white transition-all hover:scale-110"
                    aria-label="Twitter/X"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {!formData.socialMedia?.facebook && !formData.socialMedia?.instagram && !formData.socialMedia?.youtube && !formData.socialMedia?.twitter && (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/50">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/50">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03z"/></svg>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-sm mb-4">Quick Links</h3>
              <ul className="space-y-2.5">
                <li><a href="#products" className="text-gray-400 hover:text-white text-sm transition-colors">Products</a></li>
                <li><a href="#services" className="text-gray-400 hover:text-white text-sm transition-colors">Services</a></li>
                <li><a href="#gallery" className="text-gray-400 hover:text-white text-sm transition-colors">Gallery</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white text-sm transition-colors">About Us</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white text-sm transition-colors">Reviews</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="font-bold text-sm mb-4">Support</h3>
              <ul className="space-y-2.5">
                <li><a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQs</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</a></li>
                <li><span className="text-gray-400 text-sm">Privacy Policy</span></li>
                <li><span className="text-gray-400 text-sm">Terms of Service</span></li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="font-bold text-sm mb-4">Contact</h3>
              <ul className="space-y-3">
                {formData.contactPhone && (
                  <li className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <a href={`tel:${formData.contactPhone}`} className="text-gray-400 hover:text-white text-sm transition-colors">{formData.contactPhone}</a>
                  </li>
                )}
                {formData.contactEmail && (
                  <li className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${formData.contactEmail}`} className="text-gray-400 hover:text-white text-sm transition-colors break-all">{formData.contactEmail}</a>
                  </li>
                )}
                {formData.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{formData.address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-gray-500 text-xs md:text-sm">
                © {new Date().getFullYear()} {formData.businessName || "Your Business"}. All rights reserved.
              </p>
              
              {/* Vyora Branding */}
              <a 
                href="https://vyora.club" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                <span className="text-xs text-gray-500">Created with</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">V</span>
                  </div>
                  <span className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 group-hover:from-blue-300 group-hover:to-purple-300 transition-all">Vyora.club</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// E-commerce Settings Step Component
function EcommerceSettingsStep({ form }: { form: any }) {
  const { vendorId } = useAuth(); // Get vendor ID from localStorage

  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  // Auto-enable e-commerce and set all settings when component mounts
  useEffect(() => {
    const currentEnabled = form.getValues("ecommerceEnabled");
    const currentMode = form.getValues("ecommerceMode");
    const currentPaymentMethods = form.getValues("paymentMethods");

    // Auto-enable e-commerce if not already enabled
    if (!currentEnabled) {
      form.setValue("ecommerceEnabled", true, { shouldDirty: false });
    }

    // Set mode to "both" if not already set
    if (currentMode !== "both") {
      form.setValue("ecommerceMode", "both", { shouldDirty: false });
    }

    // Ensure COD is enabled
    if (currentPaymentMethods && currentPaymentMethods.length > 0) {
      const codMethod = currentPaymentMethods.find((m: any) => m.type === "cod");
      if (codMethod && !codMethod.enabled) {
        const updatedMethods = currentPaymentMethods.map((m: any) => 
          m.type === "cod" ? { ...m, enabled: true } : m
        );
        form.setValue("paymentMethods", updatedMethods, { shouldDirty: false });
      }
    }

    // COMPULSORY: Account creation is required - guest checkout is ALWAYS disabled
    form.setValue("allowGuestCheckout", false, { shouldDirty: false });

    // Auto-enable all other settings
    if (!form.getValues("requirePhone")) {
      form.setValue("requirePhone", true, { shouldDirty: false });
    }
    if (!form.getValues("requireAddress")) {
      form.setValue("requireAddress", true, { shouldDirty: false });
    }
    if (!form.getValues("showPrices")) {
      form.setValue("showPrices", true, { shouldDirty: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          E-commerce Settings
        </CardTitle>
        <CardDescription>
          Configure how customers can order products and services from your mini-website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable E-commerce - Always Enabled */}
        <FormField
          control={form.control}
          name="ecommerceEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable E-commerce</FormLabel>
                <FormDescription>
                  E-commerce is automatically enabled for your mini-website
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={true}
                  disabled
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Only show settings if e-commerce is enabled */}
        {form.watch("ecommerceEnabled") && (
          <>
            {/* E-commerce Mode - Fixed to "both" */}
            <FormField
              control={form.control}
              name="ecommerceMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-commerce Mode</FormLabel>
                  <FormControl>
                    <Input
                      value="Both Cart & Quotation"
                      disabled
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormDescription>
                    Customers can choose to place orders or request quotations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show Prices */}
            <FormField
              control={form.control}
              name="showPrices"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Prices</FormLabel>
                    <FormDescription>
                      Display product and service prices on your website
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

                {/* Account Creation Required - COMPULSORY */}
                {(form.watch("ecommerceMode") === "cart" || form.watch("ecommerceMode") === "both") && (
                  <>
                    <div className="flex flex-row items-center justify-between rounded-lg border-2 border-blue-200 p-4 bg-blue-50">
                      <div className="space-y-0.5">
                        <div className="text-base font-medium flex items-center gap-2">
                          Account Creation Required
                          <Badge className="bg-blue-600 text-white text-xs">Compulsory</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customers must create an account to place orders. This is mandatory for order tracking and customer communication.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </div>

                {/* Payment Methods - COD Only */}
                <div className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Cash on Delivery (COD)</p>
                        <p className="text-sm text-muted-foreground">Payment on delivery</p>
                      </div>
                      <Switch
                        checked={form.watch("paymentMethods")?.[0]?.enabled ?? true}
                        onCheckedChange={(checked) => {
                          const methods = [{ type: "cod", enabled: checked }];
                          form.setValue("paymentMethods", methods);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Home Delivery for Products */}
                <FormField
                  control={form.control}
                  name="homeDeliveryAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Home Delivery Available (Products)</FormLabel>
                        <FormDescription>
                          Offer home delivery for product orders
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={form.watch("homeDeliveryAvailable") ?? false}
                          onCheckedChange={(checked) => {
                            form.setValue("homeDeliveryAvailable", checked, { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("homeDeliveryAvailable") && (
                  <div className="space-y-4 pl-4 border-l-2">
                    <FormField
                      control={form.control}
                      name="homeDeliveryCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Charges (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Charges for home delivery (0 = free delivery)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="homeDeliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Delivery Time</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 2-3 days, 1 week"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Estimated time for home delivery
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Home Service for Services */}
                <FormField
                  control={form.control}
                  name="homeServiceAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Home Service Available (Services)</FormLabel>
                        <FormDescription>
                          Offer home service for service bookings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={form.watch("homeServiceAvailable") ?? false}
                          onCheckedChange={(checked) => {
                            form.setValue("homeServiceAvailable", checked, { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("homeServiceAvailable") && (
                  <div className="space-y-4 pl-4 border-l-2">
                    <FormField
                      control={form.control}
                      name="homeServiceCharges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Charges (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional charges for home service (0 = no extra charge)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="homeServiceTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Service Time</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 1-2 hours, 30 minutes"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Estimated time for home service completion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Minimum Order Value */}
                <FormField
                  control={form.control}
                  name="minOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Value (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Set a minimum order value (0 = no minimum)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        GST or tax percentage to add to orders
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Required Fields */}
            <div className="space-y-3">
              <FormLabel>Required Customer Information</FormLabel>
              <FormField
                control={form.control}
                name="requirePhone"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="font-normal">Phone Number</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requireAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="font-normal">Delivery Address</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Notification Emails */}
            <FormField
              control={form.control}
              name="notificationEmails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Notification Emails</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com, another@example.com"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const emails = e.target.value.split(",").map(email => email.trim()).filter(Boolean);
                        field.onChange(emails);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated email addresses to notify when orders are placed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

      </CardContent>
    </Card>
  );
}
