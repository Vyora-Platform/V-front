import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
  layoutId: z.string().default("general-modern"),
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
  { id: 9, name: "Coupons", icon: Tag },
  { id: 10, name: "Catalog", icon: Package },
  { id: 11, name: "E-commerce", icon: Package },
  { id: 12, name: "Color Theme", icon: Palette },
  { id: 13, name: "Choose Layout", icon: Globe },
  { id: 14, name: "Review & Publish", icon: CheckCircle2 },
];

// LocalStorage keys
const STORAGE_KEY_FORM_DATA = 'vendor_website_builder_form_data';
const STORAGE_KEY_COMPLETED_STEPS = 'vendor_website_builder_completed_steps';

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
  
  // Subdomain availability state
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainMessage, setSubdomainMessage] = useState<string>("");
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  
  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED_STEPS);
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  
  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPLETED_STEPS, JSON.stringify([...completedSteps]));
  }, [completedSteps]);
  
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
  
  // Get real vendor ID from localStorage
  const { vendorId } = useAuth();

  // Fetch existing mini-website (only in edit mode)
  const { data: miniWebsite, isLoading: loadingWebsite } = useQuery<MiniWebsite>({
    queryKey: [`/api/vendors/${vendorId}/mini-website`],
    enabled: !isCreateMode, // Only fetch if NOT in create mode
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
      layoutId: savedFormData?.layoutId || "general-modern",
    },
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem(STORAGE_KEY_FORM_DATA, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Check subdomain availability function (called on button click)
  const checkSubdomainAvailability = async () => {
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
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setSubdomainAvailable(null);
      setSubdomainMessage("Unable to check availability. Please try again.");
    } finally {
      setCheckingSubdomain(false);
    }
  };

  // Reset availability when subdomain changes
  const watchedSubdomain = form.watch("subdomain");
  useEffect(() => {
    // Reset availability state when user types
    setSubdomainAvailable(null);
    setSubdomainMessage("");
  }, [watchedSubdomain]);

  // Autofill form with vendor details when creating new website
  useEffect(() => {
    if (isCreateMode && vendor) {
      console.log("🔄 Auto-filling mini-website with vendor details...");
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
        teamMembers: [{
          name: vendor.ownerName || "",
          role: "Owner",
          bio: "",
          photo: "",
        }],
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
        layoutId: "general-modern",
      });
      
      console.log("✅ Auto-filled mini-website form");
    }
  }, [isCreateMode, vendor, form]);

  // Rehydrate form when mini-website data loads (only in edit mode)
  useEffect(() => {
    if (!isCreateMode && miniWebsite && vendor) {
      console.log("🔄 Prefilling edit form with miniwebsite and vendor details...");
      
      const businessInfo = miniWebsite.businessInfo as any;
      const contactInfo = miniWebsite.contactInfo as any;
      const branding = miniWebsite.branding as any;
      const team = miniWebsite.team as any;
      const faqs = miniWebsite.faqs as any;
      const testimonials = miniWebsite.testimonials as any;
      const coupons = miniWebsite.coupons as any;
      const ecommerce = miniWebsite.ecommerce as any;
      
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
        teamMembers: team || (vendor.ownerName ? [{
          name: vendor.ownerName,
          role: "Owner",
          bio: "",
          photo: "",
        }] : []),
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
        layoutId: branding?.layoutId || "general-modern",
      });
      
      console.log("✅ Prefilled edit form");
    }
  }, [isCreateMode, miniWebsite, vendor, form]);

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
  });

  // Silent save mutation (for auto-save on Next - no toast)
  const silentSaveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = buildSavePayload(data);
      return await apiRequest("POST", `/api/vendors/${vendorId}/mini-website`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/mini-website`] });
      // No toast - silent save
    },
    onError: (error: any) => {
      console.error("Auto-save failed:", error);
      // Silent fail - don't interrupt user
    },
  });

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
      return `http://localhost:${window.location.port}/site/${subdomain}`;
    }
    return `https://${subdomain}.vendorhub.com`;
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
        // Check if availability was verified
        if (subdomainAvailable === null && values.subdomain && values.subdomain.length >= 3) {
          errors.push("Please check website name availability first");
        }
        if (subdomainAvailable === false && values.subdomain && values.subdomain.length >= 3) {
          errors.push("This website name is not available");
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
      case 9: // Coupons - optional (but step must be visited)
        break;
      case 10: // Catalog - At least 1 service or product
        const selectedServices = values.selectedServiceIds || [];
        const selectedProducts = values.selectedProductIds || [];
        if (selectedServices.length === 0 && selectedProducts.length === 0) {
          errors.push("At least 1 service or product must be selected");
        }
        break;
      case 11: // E-commerce - validation handled by form schema
        break;
      case 12: // Color Theme - colors are pre-selected, valid by default
        break;
      case 13: // Choose Layout - must select a layout
        if (!values.layoutId || !values.layoutId.trim()) {
          errors.push("Please select a layout for your website");
        }
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
    <div className="min-h-screen">
      <div className="w-full h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="heading-builder">
                Website Builder {isCreateMode && <span className="text-base text-blue-600">(New Website)</span>}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isCreateMode ? "Create your business online presence in minutes" : "Edit your mini-website"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-2"
              data-testid="button-live-preview"
            >
              <Eye className="h-4 w-4" />
              Live Preview
            </Button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="px-4 py-3 border-b overflow-x-auto">
          <div className="flex gap-2 min-w-max">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCompleted
                      ? "bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer"
                      : isLocked
                      ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-card border-border hover:bg-muted cursor-pointer"
                  }`}
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-gray-400" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium whitespace-nowrap">{step.name}</span>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-0">
          {/* Form Section */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
            <Form {...form}>
              <form className="space-y-6">
                {/* Step 1: Choose Your Website Name */}
                {currentStep === 1 && (
                  <Card className="border-2">
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <Globe className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl">Choose Your Website Name</CardTitle>
                      <CardDescription className="text-base">
                        Pick a unique name for your business website. This will be your online address.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="subdomain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Website Name</FormLabel>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <FormControl>
                                      <Input 
                                        {...field}
                                        value={field.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}
                                        onChange={(e) => {
                                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                          field.onChange(value);
                                        }}
                                        data-testid="input-subdomain"
                                        placeholder="yourbusiness"
                                        className={`text-lg font-medium pr-10 ${
                                          subdomainAvailable === true ? 'border-green-500 focus-visible:ring-green-500' : 
                                          subdomainAvailable === false ? 'border-red-500 focus-visible:ring-red-500' : ''
                                        }`}
                                        autoComplete="off"
                                      />
                                    </FormControl>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      {!checkingSubdomain && subdomainAvailable === true && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      )}
                                      {!checkingSubdomain && subdomainAvailable === false && (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={checkSubdomainAvailability}
                                    disabled={checkingSubdomain || !field.value || field.value.length < 3}
                                    className="shrink-0 bg-teal-600 hover:bg-teal-700"
                                  >
                                    {checkingSubdomain ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Checking...
                                      </>
                                    ) : (
                                      "Check Availability"
                                    )}
                                  </Button>
                                </div>
                                
                                {/* Subdomain preview */}
                                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border">
                                  <p className="text-sm text-muted-foreground mb-1">Your website will be available at:</p>
                                  <p className="text-lg font-mono font-semibold text-primary break-all">
                                    {getSiteUrl(field.value || 'yourbusiness')}
                                  </p>
                                </div>
                                
                                {/* Availability message */}
                                {subdomainMessage && (
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
                                
                                {/* Prompt to check availability */}
                                {field.value && field.value.length >= 3 && subdomainAvailable === null && !subdomainMessage && (
                                  <p className="text-sm text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    Click "Check Availability" to verify this name is available
                                  </p>
                                )}
                                
                                <FormMessage />
                              </div>
                              <FormDescription className="mt-3">
                                <span className="block text-xs text-muted-foreground">
                                  • Use 3-50 characters
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  • Only lowercase letters, numbers, and hyphens allowed
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  • Cannot start or end with a hyphen
                                </span>
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Info box */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">Why choose a good website name?</p>
                            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                              <li>• Makes it easy for customers to find and remember you</li>
                              <li>• Represents your brand professionally online</li>
                              <li>• Can't be changed easily once published</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Business Info */}
                {currentStep === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Business Information
                      </CardTitle>
                      <CardDescription>
                        Core details about your business
                        <span className="block mt-1 text-xs">
                          * Required fields must be filled to proceed
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-business-name" />
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
                            <FormLabel>Tagline *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-tagline" placeholder="A catchy phrase about your business" />
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
                            <FormLabel>About Your Business *</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="input-description" rows={4} placeholder="Tell visitors about your business..." />
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
                            <FormLabel>Business Logo (Optional)</FormLabel>
                            <FormControl>
                              <FileUpload
                                value={field.value}
                                onChange={field.onChange}
                                category="logo"
                                circular
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Upload your business logo (circular display)</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Contact Info */}
                {currentStep === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                      <CardDescription>How customers can reach you</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-contact-email" placeholder="your@email.com" />
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
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-contact-phone" placeholder="+91 98765 43210" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="input-address" rows={3} placeholder="Your business address" />
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
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Google Maps Link (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-google-maps" placeholder="https://maps.google.com/..." />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Paste Google Maps link for easy navigation to your store
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Business Hours */}
                {currentStep === 4 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Business Hours
                      </CardTitle>
                      <CardDescription>
                        Set your operating hours (add multiple time slots for break hours)
                        <span className="block mt-1 text-xs text-amber-600">
                          * At least one day must be marked as open to proceed
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!(form.watch("businessHours") || []).some((day: any) => day.isOpen) && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-sm text-amber-800">
                            <AlertCircle className="h-4 w-4 inline mr-2" />
                            At least one business day must be open.
                          </p>
                        </div>
                      )}
                      {form.watch("businessHours")?.map((dayHours, dayIndex) => {
                        const day = dayHours.day;
                        const isOpen = form.watch(`businessHours.${dayIndex}.isOpen`);
                        const slots = form.watch(`businessHours.${dayIndex}.slots`) || [];
                        
                        return (
                          <div key={day} className="p-3 border rounded-md space-y-2">
                            <div className="flex items-center gap-3">
                              <FormField
                                control={form.control}
                                name={`businessHours.${dayIndex}.isOpen`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid={`checkbox-${day.toLowerCase()}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <span className="w-24 font-medium text-sm">{day}</span>
                              {!isOpen && <span className="text-sm text-muted-foreground">Closed</span>}
                            </div>
                            
                            {isOpen && (
                              <div className="space-y-2 pl-10">
                                {slots.map((slot, slotIndex) => (
                                  <div key={slotIndex} className="flex items-center gap-2">
                                    <Input
                                      type="time"
                                      value={slot.open}
                                      onChange={(e) => {
                                        const newSlots = [...slots];
                                        newSlots[slotIndex] = { ...newSlots[slotIndex], open: e.target.value };
                                        form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                      }}
                                      className="flex-1"
                                      data-testid={`input-open-${day.toLowerCase()}-${slotIndex}`}
                                    />
                                    <span className="text-muted-foreground text-sm">to</span>
                                    <Input
                                      type="time"
                                      value={slot.close}
                                      onChange={(e) => {
                                        const newSlots = [...slots];
                                        newSlots[slotIndex] = { ...newSlots[slotIndex], close: e.target.value };
                                        form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                      }}
                                      className="flex-1"
                                      data-testid={`input-close-${day.toLowerCase()}-${slotIndex}`}
                                    />
                                    {slots.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
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
                                    onClick={() => {
                                      const newSlots = [...slots, { open: "14:00", close: "18:00" }];
                                      form.setValue(`businessHours.${dayIndex}.slots`, newSlots);
                                    }}
                                    className="w-full"
                                    data-testid={`button-add-slot-${day.toLowerCase()}`}
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
                                    Add Break Hours
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Step 5: Gallery Only */}
                {currentStep === 5 && <GalleryOnlyStep form={form} />}

                {/* Step 6: Team & About */}
                {currentStep === 6 && <TeamMembersStep form={form} />}

                {/* Step 7: FAQs */}
                {currentStep === 7 && <FAQsStep form={form} />}

                {/* Step 8: Testimonials */}
                {currentStep === 8 && <TestimonialsStep form={form} />}

                {/* Step 9: Coupons */}
                {currentStep === 9 && <CouponsStep form={form} />}

                {/* Step 10: Catalog */}
                {currentStep === 10 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Select Catalog Items
                      </CardTitle>
                      <CardDescription>
                        Choose services and products to display on your mini-website
                        <span className="block mt-1 text-xs text-amber-600">
                          * At least 1 service or product must be selected to proceed
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(form.watch("selectedServiceIds") || []).length === 0 && (form.watch("selectedProductIds") || []).length === 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-sm text-amber-800">
                            <AlertCircle className="h-4 w-4 inline mr-2" />
                            At least 1 service or product must be selected.
                          </p>
                        </div>
                      )}
                      {/* Services Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-base">Services</h4>
                          <Badge variant="secondary">
                            {(form.watch("selectedServiceIds") || []).length} selected
                          </Badge>
                        </div>
                        {services.length > 0 ? (
                          <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-muted/30">
                            {services.map((service) => (
                              <div key={service.id} className="flex items-center gap-3 p-2 hover:bg-background rounded-md transition-colors">
                                <Checkbox
                                  checked={(form.watch("selectedServiceIds") || []).includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    const current = form.watch("selectedServiceIds") || [];
                                    if (checked) {
                                      form.setValue("selectedServiceIds", [...current, service.id], { shouldValidate: true, shouldDirty: true });
                                    } else {
                                      form.setValue("selectedServiceIds", current.filter(id => id !== service.id), { shouldValidate: true, shouldDirty: true });
                                    }
                                  }}
                                  data-testid={`checkbox-service-${service.id}`}
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{service.name}</span>
                                  {service.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
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

                      {/* Products Section */}
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-base">Products</h4>
                          <Badge variant="secondary">
                            {(form.watch("selectedProductIds") || []).length} selected
                          </Badge>
                        </div>
                        {products.length > 0 ? (
                          <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto bg-muted/30">
                            {products.map((product) => (
                              <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-background rounded-md transition-colors">
                                <Checkbox
                                  checked={(form.watch("selectedProductIds") || []).includes(product.id)}
                                  onCheckedChange={(checked) => {
                                    const current = form.watch("selectedProductIds") || [];
                                    if (checked) {
                                      form.setValue("selectedProductIds", [...current, product.id], { shouldValidate: true, shouldDirty: true });
                                    } else {
                                      form.setValue("selectedProductIds", current.filter(id => id !== product.id), { shouldValidate: true, shouldDirty: true });
                                    }
                                  }}
                                  data-testid={`checkbox-product-${product.id}`}
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{product.name}</span>
                                  {product.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
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
                )}

                {/* Step 11: E-commerce Settings */}
                {currentStep === 11 && <EcommerceSettingsStep form={form} />}

                {/* Step 12: Color Theme */}
                {currentStep === 12 && <ColorThemeStep form={form} />}

                {/* Step 13: Choose Layout */}
                {currentStep === 13 && (
                  <LayoutSelector
                    selectedLayout={form.watch("layoutId") || "general-modern"}
                    onLayoutChange={(layoutId) => form.setValue("layoutId", layoutId, { shouldValidate: true, shouldDirty: true })}
                    formData={form.watch()}
                    services={services}
                    products={products}
                    vendorCategory={vendor?.category || vendor?.businessCategory || vendor?.businessType}
                  />
                )}

                {/* Step 14: Review & Publish */}
                {currentStep === 14 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Review & Publish
                      </CardTitle>
                      <CardDescription>Review your site and publish when ready</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="col-span-2">
                          <p className="font-medium mb-1">Website URL</p>
                          <p className="text-muted-foreground break-all">
                            {form.watch("subdomain") ? getSiteUrl(form.watch("subdomain")) : "Set subdomain in Step 1"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Business Name</p>
                          <p className="text-muted-foreground">{form.watch("businessName") || "Not set"}</p>
                        </div>
                        <div>
                          <p className="font-medium">Contact Email</p>
                          <p className="text-muted-foreground">{form.watch("contactEmail") || "Not set"}</p>
                        </div>
                        <div>
                          <p className="font-medium">Contact Phone</p>
                          <p className="text-muted-foreground">{form.watch("contactPhone") || "Not set"}</p>
                        </div>
                        <div>
                          <p className="font-medium">Gallery Images</p>
                          <p className="text-muted-foreground">{(form.watch("heroMedia") || []).length}/10 added</p>
                        </div>
                        <div>
                          <p className="font-medium">Team Members</p>
                          <p className="text-muted-foreground">{(form.watch("teamMembers") || []).length} added</p>
                        </div>
                        <div>
                          <p className="font-medium">FAQs</p>
                          <p className="text-muted-foreground">{(form.watch("faqs") || []).length} added</p>
                        </div>
                        <div>
                          <p className="font-medium">Testimonials</p>
                          <p className="text-muted-foreground">{(form.watch("testimonials") || []).length} added</p>
                        </div>
                        <div>
                          <p className="font-medium">Coupons</p>
                          <p className="text-muted-foreground">{(form.watch("selectedCouponIds") || []).length} selected</p>
                        </div>
                        <div>
                          <p className="font-medium">Selected Services</p>
                          <p className="text-muted-foreground">{(form.watch("selectedServiceIds") || []).length} selected</p>
                        </div>
                        <div className="col-span-2 border-t pt-4">
                          <p className="font-medium mb-2">E-commerce Settings</p>
                          {form.watch("ecommerceEnabled") ? (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                ✅ E-commerce Enabled - Mode: {
                                  form.watch("ecommerceMode") === "cart" ? "Full Cart & Checkout" :
                                  form.watch("ecommerceMode") === "quotation" ? "Quotation Request Only" :
                                  "Both Cart & Quotation"
                                }
                              </p>
                              {form.watch("minOrderValue") > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Min. Order: ₹{form.watch("minOrderValue")}
                                </p>
                              )}
                              {form.watch("taxRate") > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Tax Rate: {form.watch("taxRate")}%
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">❌ E-commerce Disabled</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Previous Button */}
                      <div className="pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          data-testid="button-previous-review"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-4">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={saveMutation.isPending}
                            data-testid="button-save-draft"
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePreview}
                            data-testid="button-preview"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Site
                          </Button>
                        </div>
                        
                        <Button
                          type="button"
                          onClick={handlePublish}
                          disabled={publishMutation.isPending || saveMutation.isPending}
                          data-testid="button-publish"
                          className="w-full"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Publish Site
                        </Button>
                        
                        {form.watch("subdomain") && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="text-muted-foreground mb-1">Your site URL:</p>
                            <a 
                              href={getSiteUrl(form.watch("subdomain"))} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-mono font-medium break-all"
                            >
                              {getSiteUrl(form.watch("subdomain"))}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Buttons - Show on all steps except Review (step 14) */}
                {currentStep < STEPS.length && (
                  <div className="flex gap-2 pt-6 border-t mt-6">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        data-testid="button-previous"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      onClick={handleNext}
                      data-testid="button-next"
                      className="ml-auto"
                    >
                      Save & Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>

        {/* Live Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Live Preview
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto bg-white" style={{ maxHeight: 'calc(95vh - 80px)' }}>
              <LivePreview formData={form.watch()} services={services} products={products} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Gallery Only Step Component (Step 4)
function GalleryOnlyStep({ form }: { form: any }) {
  const handleImagesChange = async (urls: string[]) => {
    form.setValue("heroMedia", urls, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Gallery Images
        </CardTitle>
        <CardDescription>
          Upload at least 1 image to showcase your business. These will be displayed in your website gallery.
          <span className="block mt-1 text-xs text-amber-600">
            * At least 1 image is required to proceed
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-base">Business Gallery</h4>
            <Badge variant={(form.watch("heroMedia") || []).length >= 1 ? "default" : "destructive"}>
              {(form.watch("heroMedia") || []).length}/10 images
            </Badge>
          </div>

          {(form.watch("heroMedia") || []).length < 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                At least 1 gallery image is required to proceed.
              </p>
            </div>
          )}

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
  );
}

// Color Theme Step Component (Step 12 - Before Choose Layout)
function ColorThemeStep({ form }: { form: any }) {
  // Handle color theme change
  const handleThemeChange = (theme: { primary: string; secondary: string; accent: string }) => {
    form.setValue("primaryColor", theme.primary, { shouldValidate: true, shouldDirty: true });
    form.setValue("secondaryColor", theme.secondary, { shouldValidate: true, shouldDirty: true });
    form.setValue("accentColor", theme.accent, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <Card>
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
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team & About Us
        </CardTitle>
        <CardDescription>
          Introduce your team members
          <span className="block mt-1 text-xs text-amber-600">
            * At least 1 team member is required to proceed
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.length < 1 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              At least 1 team member is required.
            </p>
          </div>
        )}
        <div className="space-y-3">
          <Input
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            placeholder="Name"
            data-testid="input-team-name"
          />
          <Input
            value={newMember.role}
            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
            placeholder="Role"
            data-testid="input-team-role"
          />
          <Textarea
            value={newMember.bio}
            onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
            placeholder="Bio (optional)"
            data-testid="input-team-bio"
            rows={2}
          />
          <div>
            <label className="text-sm font-medium mb-2 block">Team Member Photo (optional)</label>
            <FileUpload
              value={newMember.photo}
              onChange={(url) => setNewMember({ ...newMember, photo: url })}
              category="team"
              circular
            />
          </div>
          <Button type="button" onClick={addTeamMember} className="w-full" data-testid="button-add-team">
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {form.watch("teamMembers") && Array.isArray(form.watch("teamMembers")) && form.watch("teamMembers").length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Team Members</h4>
            {(form.watch("teamMembers") || []).map((member: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const members = (form.watch("teamMembers") || []).filter((_: any, i: number) => i !== index);
                    form.setValue("teamMembers", members);
                  }}
                  data-testid={`button-remove-team-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
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
    <Card>
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
    <Card>
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
    <Card>
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

  return (
    <div className="w-full min-h-screen bg-white font-sans">
      {/* ===== HEADER - Clean & Minimal ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
            <div 
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm"
              style={{ backgroundColor: primaryColor }}
            >
                {formData.businessName?.charAt(0) || "Y"}
            </div>
              <span className="text-base md:text-xl font-bold text-gray-900">{formData.businessName || "YourBrand"}</span>
          </div>
            
            {/* Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-6 md:gap-8">
              <a href="#offerings" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Our Offerings</a>
              <a href="#gallery" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
              <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQs</a>
          </nav>
            
            {/* CTA Button */}
            <Button 
              size="sm"
              className="rounded-full px-4 md:px-6 font-medium shadow-sm text-xs md:text-sm"
              style={{ backgroundColor: secondaryColor, color: 'white' }}
            >
              Inquire Now
          </Button>
        </div>
      </div>
      </header>

      {/* ===== HERO SECTION - Clean Split Layout ===== */}
      <section className="py-10 md:py-16 lg:py-20" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}15)` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
                {formData.businessName || "Your Modern"}<br className="hidden md:block" />
                {formData.tagline ? "" : "Business Name"}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-3 md:mb-4 justify-center lg:justify-start">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-yellow-400 text-sm md:text-lg">★</span>
                  ))}
              </div>
                <span className="text-xs md:text-sm text-gray-600">4.9 (1,200 reviews)</span>
              </div>
              
              {/* Address */}
              <div className="flex items-center gap-2 text-gray-600 mb-6 md:mb-8 justify-center lg:justify-start">
                <span className="text-gray-400">📍</span>
                <span className="text-xs md:text-sm">{formData.address || "123 Main Street, Anytown, India"}</span>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center lg:justify-start">
                  <Button 
                  className="rounded-full px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium"
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                  onClick={() => formData.googleMapsUrl && window.open(formData.googleMapsUrl, '_blank')}
                  >
                  📍 Directions
                  </Button>
                  <Button 
                    variant="outline"
                  className="rounded-full px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium border-gray-300"
                  onClick={() => formData.contactPhone && window.open(`tel:${formData.contactPhone}`, '_self')}
                >
                  📞 Contact Us
                </Button>
                <Button 
                  className="rounded-full px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-medium bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => formData.contactPhone && window.open(`https://wa.me/${formData.contactPhone.replace(/\D/g, '')}`, '_blank')}
                  >
                    💬 WhatsApp
                  </Button>
              </div>
            </div>
            
            {/* Right - Hero Image */}
            <div className="relative hidden lg:block">
                  {formData.heroMedia && Array.isArray(formData.heroMedia) && formData.heroMedia.length > 0 ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src={formData.heroMedia[0]} 
                    alt={formData.businessName || "Business"} 
                    className="w-full h-[350px] md:h-[400px] object-cover"
                    />
                </div>
                  ) : (
                <div 
                  className="rounded-2xl overflow-hidden shadow-2xl h-[350px] md:h-[400px] flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}30)` }}
                >
                  <div className="text-center p-8">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-white/50 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl md:text-4xl">🏢</span>
                    </div>
                    <p className="font-medium" style={{ color: primaryColor }}>Your Hero Image</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </section>
      
      {/* ===== OFFERS AND COUPONS ===== */}
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Offers and Coupons</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {coupons.length > 0 ? (
              coupons.slice(0, 4).map((coupon: any, idx: number) => (
                <div key={coupon.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all bg-white">
                  <div 
                    className="h-24 md:h-36 flex items-center justify-center relative"
                    style={{ backgroundColor: idx === 0 ? '#dcfce7' : idx === 1 ? '#fef3c7' : idx === 2 ? '#dbeafe' : '#fce7f3' }}
                  >
                    {coupon.discountType === 'percentage' && (
                      <div className="absolute top-2 left-2">
                        <Badge className="text-[10px] md:text-xs" style={{ backgroundColor: primaryColor, color: 'white' }}>
                          {coupon.discountValue}% DISCOUNT
                        </Badge>
            </div>
                    )}
                    <span className="text-3xl md:text-4xl">{idx === 0 ? '🎉' : idx === 1 ? '⭐' : idx === 2 ? '🆕' : '🎓'}</span>
            </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 text-xs md:text-sm line-clamp-1">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3 line-clamp-2">{coupon.description || "Special Offer"}</p>
                    <Button 
                      size="sm" 
                      className="w-full rounded-lg text-[10px] md:text-xs h-7 md:h-8"
                      style={{ backgroundColor: secondaryColor, color: 'white' }}
                    >
                      Get Code
                    </Button>
            </div>
            </div>
              ))
            ) : (
              defaultOffers.map((offer, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all bg-white">
                  <div 
                    className="h-24 md:h-36 flex items-center justify-center relative"
                    style={{ backgroundColor: offer.color }}
                  >
                    {offer.badge && (
                      <div className="absolute top-2 left-2">
                        <Badge className="text-[10px] md:text-xs" style={{ backgroundColor: primaryColor, color: 'white' }}>{offer.badge}</Badge>
          </div>
                    )}
                    <span className="text-3xl md:text-4xl">{idx === 0 ? '🎉' : idx === 1 ? '⭐' : idx === 2 ? '🆕' : '🎓'}</span>
        </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 text-xs md:text-sm line-clamp-1">{offer.title}</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3 line-clamp-2">{offer.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full rounded-lg text-[10px] md:text-xs h-7 md:h-8"
                      style={{ backgroundColor: secondaryColor, color: 'white' }}
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

      {/* ===== OUR SERVICES ===== */}
      <section id="offerings" className="py-10 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Our Services</h2>
            <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto">Discover the range of professional services we offer to help you achieve your goals.</p>
            </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {(services.length > 0 ? services : [
              { id: '1', name: 'Service One', shortDescription: 'A short, catchy description.', price: 1999 },
              { id: '2', name: 'Service Two', shortDescription: 'A short, catchy description.', price: 2499 },
              { id: '3', name: 'Service Three', shortDescription: 'A short, catchy description.', price: 1499 },
              { id: '4', name: 'Consulting', shortDescription: 'Expert guidance for your business.', price: 4999 },
            ]).slice(0, 4).map((service: any, idx: number) => (
              <div key={service.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="h-28 md:h-40 bg-gray-100 flex items-center justify-center">
                    {service.images && service.images.length > 0 ? (
                      <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                    <div className="text-gray-300">
                      {selectedLayout?.icon && <selectedLayout.icon className="w-12 h-12 md:w-16 md:h-16" />}
                  </div>
                        )}
                      </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-xs md:text-sm line-clamp-1">{service.name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3 line-clamp-2">{service.shortDescription || service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm md:text-base" style={{ color: primaryColor }}>₹{service.price?.toLocaleString()}</span>
                    <Button 
                      size="sm" 
                      className="rounded-lg text-[10px] md:text-xs px-3 md:px-4 h-6 md:h-8"
                      style={{ backgroundColor: secondaryColor, color: 'white' }}
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
      <section className="py-10 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Our Products</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {(products.length > 0 ? products : [
              { id: '1', name: 'Product A', description: 'A short, catchy description.', salePrice: 3999 },
              { id: '2', name: 'Product B', description: 'A short, catchy description.', salePrice: 6499 },
              { id: '3', name: 'Product C', description: 'A short, catchy description.', salePrice: 2499 },
              { id: '4', name: 'Product D', description: 'A short, catchy description.', salePrice: 7999 },
            ]).slice(0, 4).map((product: any, idx: number) => (
              <div key={product.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="h-32 md:h-48 bg-gray-50 flex items-center justify-center p-3 md:p-4">
                    {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-10 h-10 md:w-16 md:h-16 text-gray-300" />
                    </div>
                    )}
                  </div>
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-xs md:text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 mb-2 md:mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="font-bold text-sm md:text-base" style={{ color: primaryColor }}>
                        ₹{(product.salePrice || product.price)?.toLocaleString()}
                      </span>
                      {product.price && product.salePrice && product.price > product.salePrice && (
                        <span className="text-[10px] md:text-xs text-gray-400 line-through">₹{product.price?.toLocaleString()}</span>
                      )}
                </div>
                    <Button 
                      size="sm" 
                      className="rounded-lg text-[10px] md:text-xs px-2 md:px-4 h-6 md:h-8"
                      style={{ backgroundColor: secondaryColor, color: 'white' }}
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
      <section id="about" className="py-10 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* About Text */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">About Us</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-xs md:text-sm leading-relaxed">
              {formData.description || "Our mission is to provide the highest quality products and services to our valued customers. Learn more about our journey, our team, and our commitment to excellence."}
            </p>
      </div>

          {/* Our Team */}
      {formData.teamMembers && Array.isArray(formData.teamMembers) && formData.teamMembers.length > 0 && (
            <div className="text-center">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 md:mb-8">Our Team</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
                {(formData.teamMembers || []).slice(0, 4).map((member: any, idx: number) => (
                  <div key={idx} className="text-center">
                  <div 
                      className="w-14 h-14 md:w-20 md:h-20 rounded-full mx-auto mb-2 md:mb-3 flex items-center justify-center text-lg md:text-2xl font-bold text-white shadow-md overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name?.charAt(0)
                    )}
                  </div>
                    <h4 className="font-semibold text-gray-900 text-xs md:text-sm">{member.name}</h4>
                    <p className="text-[10px] md:text-xs" style={{ color: primaryColor }}>{member.role}</p>
                </div>
              ))}
          </div>
        </div>
      )}
        </div>
      </section>

      {/* ===== BUSINESS HOURS ===== */}
      {formData.businessHours && formData.businessHours.length > 0 && (
        <section className="py-10 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center">Business Hours</h2>
            
            <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Working Hours */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 text-xs md:text-sm">Working Hours</h3>
                  <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                    {formData.businessHours.slice(0, 3).map((day: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{day.day}</span>
                        {day.isOpen ? (
                          <span className="text-gray-900">{day.slots?.[0]?.open || '9:00 AM'} - {day.slots?.[0]?.close || '6:00 PM'}</span>
                  ) : (
                    <span className="text-red-500 font-medium">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

                {/* Break Time */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 md:mb-4 text-xs md:text-sm">Break Time</h3>
                  <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                    {formData.businessHours.slice(0, 3).map((day: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{day.day}</span>
                        {day.isOpen ? (
                          <span className="text-gray-900">1:00 PM - 2:00 PM</span>
                        ) : (
                          <span className="text-red-500 font-medium">Closed</span>
                        )}
            </div>
                    ))}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQs ===== */}
      {formData.faqs && Array.isArray(formData.faqs) && formData.faqs.length > 0 && (
        <section id="faq" className="py-10 md:py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-2 md:space-y-3">
              {(formData.faqs || []).slice(0, 5).map((faq: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button className="w-full px-4 md:px-6 py-3 md:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <span className="font-medium text-gray-900 text-xs md:text-sm pr-4">{faq.question}</span>
                    <span className="text-gray-400 flex-shrink-0">▼</span>
                  </button>
                  <div className="px-4 md:px-6 pb-3 md:pb-4">
                    <p className="text-gray-500 text-xs md:text-sm">{faq.answer}</p>
                  </div>
                  </div>
              ))}
                  </div>
              </div>
        </section>
      )}

      {/* ===== GALLERY ===== */}
      {formData.heroMedia && Array.isArray(formData.heroMedia) && formData.heroMedia.length > 1 && (
        <section id="gallery" className="py-10 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {formData.heroMedia.slice(0, 8).map((url: string, idx: number) => (
                <div 
                  key={idx} 
                  className={`rounded-lg md:rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${idx + 1}`} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    style={{ minHeight: idx === 0 ? '200px' : '100px' }}
                  />
                  </div>
              ))}
                </div>
              </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      {formData.testimonials && Array.isArray(formData.testimonials) && formData.testimonials.length > 0 && (
        <section className="py-10 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 text-center">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {(formData.testimonials || []).slice(0, 3).map((testimonial: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1 mb-3 md:mb-4">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm md:text-lg">★</span>
                    ))}
                </div>
                  <p className="text-gray-600 mb-4 md:mb-6 text-xs md:text-sm leading-relaxed">"{testimonial.reviewText}"</p>
                  <div className="flex items-center gap-3 border-t pt-3 md:pt-4">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {testimonial.customerName?.charAt(0) || "C"}
              </div>
                <div>
                      <p className="font-semibold text-xs md:text-sm">{testimonial.customerName}</p>
                      {testimonial.customerLocation && (
                        <p className="text-[10px] md:text-xs text-gray-500">📍 {testimonial.customerLocation}</p>
                      )}
                    </div>
                  </div>
                      </div>
                    ))}
                  </div>
                </div>
        </section>
      )}

      {/* ===== FOOTER - Clean & Minimal ===== */}
      <footer className="bg-white border-t border-gray-100 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-xs md:text-sm text-gray-500">
              © {new Date().getFullYear()} {formData.businessName || "YourBrand"}. All rights reserved.
              </p>
            
            {/* Footer Links */}
            <nav className="flex items-center gap-4 md:gap-6 text-xs md:text-sm">
              <a href="#offerings" className="text-gray-600 hover:text-gray-900 transition-colors">Our Offerings</a>
              <a href="#gallery" className="text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQs</a>
            </nav>
            </div>
          
          {/* Vyora Branding */}
          <div className="text-center mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-100">
            <a 
              href="https://vyora.club" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-400 hover:text-gray-600 transition-colors"
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

    // Auto-enable all other settings (except guest checkout - account creation is required)
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
    <Card>
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

                {/* Account Creation Required */}
                {(form.watch("ecommerceMode") === "cart" || form.watch("ecommerceMode") === "both") && (
                  <>
                    <FormField
                      control={form.control}
                      name="allowGuestCheckout"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Account Creation Required</FormLabel>
                            <FormDescription>
                              Customers must create an account to place orders
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={false}
                              disabled
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

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
