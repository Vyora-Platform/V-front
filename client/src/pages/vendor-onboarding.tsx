import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, User, MapPin, Image as ImageIcon, 
  CheckCircle2, ChevronRight, ChevronLeft, 
  Gift, Check, X, Loader2, Upload, 
  Grid3X3, Sparkles, Shield, Phone, Mail, Store, ArrowLeft
} from "lucide-react";
import type { Category, Subcategory } from "@shared/schema";

// Form schemas for each step
const step1Schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
  referralCode: z.string().optional(),
});

const step2Schema = z.object({
  selectedCategories: z.array(z.string()).min(1, "Select at least 1 category").max(3, "Maximum 3 categories allowed"),
  selectedSubcategories: z.array(z.string()).min(1, "Select at least 1 subcategory"),
  customCategory: z.string().optional(),
  customSubcategory: z.string().optional(),
});

const step3Schema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
});

const step4Schema = z.object({
  logo: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters").max(500, "Description must not exceed 500 characters"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

// Referral validation result type
interface ReferralValidation {
  valid: boolean;
  referrerId?: string;
  referrerName?: string;
  referrerOwner?: string;
  message?: string;
  error?: string;
}

export default function VendorOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [categorySelectionMode, setCategorySelectionMode] = useState<'categories' | 'subcategories'>('categories');
  
  // History stack for browser back button support
  const [stepHistory, setStepHistory] = useState<number[]>([1]);
  
  // Referral code validation state
  const [referralCode, setReferralCode] = useState("");
  const [referralValidation, setReferralValidation] = useState<ReferralValidation | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralDebounceTimer, setReferralDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Read signup data from localStorage
  const tempBusinessName = localStorage.getItem("tempBusinessName") || "";
  const tempOwnerName = localStorage.getItem("tempOwnerName") || "";
  const tempPhone = localStorage.getItem("tempPhone") || "";
  const tempEmail = localStorage.getItem("tempEmail") || "";
  
  // Form data state
  const [formData, setFormData] = useState({
    step1: {
      businessName: tempBusinessName,
      ownerName: tempOwnerName,
      phone: tempPhone,
      whatsappNumber: tempPhone,
      email: tempEmail,
      referralCode: "",
    } as Step1Data,
    step2: {
      selectedCategories: [],
      selectedSubcategories: [],
    } as Step2Data,
    step3: {} as Step3Data,
    step4: {} as Step4Data,
  });

  // Fetch master categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch master subcategories
  const { data: subcategories = [], isLoading: loadingSubcategories } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
    staleTime: 5 * 60 * 1000,
  });

  // Get filtered subcategories based on selected categories
  const getFilteredSubcategories = () => {
    const selectedCatIds = formData.step2.selectedCategories;
    return subcategories.filter(sub => selectedCatIds.includes(sub.categoryId || ''));
  };

  const steps = [
    { number: 1, title: "Business Info", icon: Building2, subtitle: "Tell us about your business" },
    { number: 2, title: "Categories", icon: Grid3X3, subtitle: "Select your business categories" },
    { number: 3, title: "Location", icon: MapPin, subtitle: "Where is your business?" },
    { number: 4, title: "Branding", icon: ImageIcon, subtitle: "Add your logo & description" },
  ];

  const progress = (currentStep / 4) * 100;

  // Get userId from localStorage
  const userId = localStorage.getItem("userId");
  const { data: userData } = useQuery<any>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId && !tempEmail,
  });

  // Step 1 Form
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData.step1,
  });

  // Step 2 Form
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData.step2,
  });

  // Step 3 Form
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData.step3,
  });

  // Step 4 Form
  const form4 = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: formData.step4,
  });

  // Update email from userData if available
  useEffect(() => {
    if (userData?.email && !tempEmail) {
      form1.setValue("email", userData.email);
      setFormData(prev => ({
        ...prev,
        step1: { ...prev.step1, email: userData.email }
      }));
    }
  }, [userData, tempEmail, form1]);

  // Clean up temp data on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("tempBusinessName");
      localStorage.removeItem("tempOwnerName");
      localStorage.removeItem("tempPhone");
      localStorage.removeItem("tempEmail");
    };
  }, []);

  // Browser back button handler - CRITICAL for proper navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      
      // Handle subcategory mode first
      if (currentStep === 2 && categorySelectionMode === 'subcategories') {
        setCategorySelectionMode('categories');
        // Push state back to maintain history
        window.history.pushState({ step: currentStep, mode: 'categories' }, '');
        return;
      }
      
      // Go to previous step if possible
      if (currentStep > 1) {
        const newStep = currentStep - 1;
        setCurrentStep(newStep);
        setStepHistory(prev => [...prev, newStep]);
        // Push state to maintain history for further back navigation
        window.history.pushState({ step: newStep }, '');
      } else {
        // On step 1, confirm exit
        if (window.confirm("Are you sure you want to leave? Your progress will be lost.")) {
          setLocation('/signup');
        } else {
          // Stay on the page - push current state back
          window.history.pushState({ step: 1 }, '');
        }
      }
    };

    // Initialize history state
    window.history.replaceState({ step: currentStep }, '');
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, categorySelectionMode, setLocation]);

  // Push state when step changes (for forward navigation)
  useEffect(() => {
    window.history.pushState({ step: currentStep, mode: categorySelectionMode }, '');
  }, [currentStep, categorySelectionMode]);

  // Real-time referral code validation with debounce
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length < 6) {
      setReferralValidation(null);
      return;
    }
    
    setIsValidatingReferral(true);
    try {
      const response = await fetch(`/api/referral-code/${code}/validate`);
      const data = await response.json();
      setReferralValidation(data);
      
      // Show toast for successful validation
      if (data.valid) {
        toast({
          title: "Referral code valid! 🎉",
          description: `Referred by ${data.referrerName || 'a Vyora business'}`,
        });
      }
    } catch (error) {
      setReferralValidation({ valid: false, error: "Failed to validate code" });
    } finally {
      setIsValidatingReferral(false);
    }
  }, [toast]);

  // Debounced referral code change handler
  const handleReferralCodeChange = (value: string) => {
    setReferralCode(value);
    
    // Clear previous timer
    if (referralDebounceTimer) {
      clearTimeout(referralDebounceTimer);
    }
    
    // Clear validation if less than 6 chars
    if (value.length < 6) {
      setReferralValidation(null);
      return;
    }
    
    // Set new debounce timer for real-time validation
    const timer = setTimeout(() => {
      validateReferralCode(value);
    }, 500);
    
    setReferralDebounceTimer(timer);
  };

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const vendorId = localStorage.getItem("vendorId") || "temp";
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorId', vendorId);
      formData.append('category', 'logos');
      formData.append('isPublic', 'true');

      const response = await fetch('/api/upload/public', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setLogoPreview(data.url);
          form4.setValue("logo", data.url);
        }
      } else {
        // Fallback to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setLogoPreview(dataUrl);
          form4.setValue("logo", dataUrl);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      // Fallback to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        form4.setValue("logo", dataUrl);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return await response.json();
    },
    onSuccess: (vendor) => {
      console.log("✅ Vendor created:", vendor);
      
      if (vendor && vendor.id) {
        localStorage.setItem("vendorId", vendor.id);
        
        // Store selected categories for product form
        localStorage.setItem("vendorSelectedCategories", JSON.stringify(formData.step2.selectedCategories));
        localStorage.setItem("vendorSelectedSubcategories", JSON.stringify(formData.step2.selectedSubcategories));
      }
      
      localStorage.setItem("vendorOnboarding", "complete");
      
      // If there's a valid referral, update the referrer's stats
      if (referralValidation?.valid && referralValidation.referrerId) {
        // Create the referral record
        fetch(`/api/vendors/${referralValidation.referrerId}/referrals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referredEmail: formData.step1.email,
            referredPhone: formData.step1.phone,
          }),
        }).catch(console.error);
      }
      
      toast({
        title: "Welcome to Vyora! 🎉",
        description: "Your vendor profile has been created successfully.",
      });
      
      setLocation("/vendor/dashboard");
    },
    onError: (error: any) => {
      console.error("❌ Vendor creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep === 2 && categorySelectionMode === 'subcategories') {
      setCategorySelectionMode('categories');
      return;
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStepHistory(prev => [...prev, currentStep - 1]);
    }
  };

  // Handle step 1 submission
  const handleStep1Next = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, step1: data }));
    setCurrentStep(2);
    setStepHistory(prev => [...prev, 2]);
  };

  // Handle step 2 submission
  const handleStep2Next = () => {
    const selectedCats = formData.step2.selectedCategories;
    const selectedSubs = formData.step2.selectedSubcategories;
    
    if (selectedCats.length === 0) {
      toast({
        title: "Select Categories",
        description: "Please select at least 1 category",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSubs.length === 0) {
      toast({
        title: "Select Subcategories",
        description: "Please select at least 1 subcategory",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(3);
    setStepHistory(prev => [...prev, 3]);
  };

  // Handle step 3 submission
  const handleStep3Next = (data: Step3Data) => {
    setFormData(prev => ({ ...prev, step3: data }));
    setCurrentStep(4);
    setStepHistory(prev => [...prev, 4]);
  };

  // Handle final submission
  const handleStep4Submit = (data: Step4Data) => {
    setFormData(prev => ({ ...prev, step4: data }));
    
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    // Get primary category and subcategory for main fields
    const primaryCategoryId = formData.step2.selectedCategories[0];
    const primaryCategory = categories.find(c => c.id === primaryCategoryId);
    const primarySubcategoryId = formData.step2.selectedSubcategories[0];
    const primarySubcategory = subcategories.find(s => s.id === primarySubcategoryId);

    // Store selected categories in localStorage for product form filtering
    // These are NOT stored in the database to avoid schema issues
    localStorage.setItem("vendorSelectedCategories", JSON.stringify(formData.step2.selectedCategories));
    localStorage.setItem("vendorSelectedSubcategories", JSON.stringify(formData.step2.selectedSubcategories));
    
    // Store referrer info in localStorage if valid
    if (referralValidation?.valid && referralValidation.referrerId) {
      localStorage.setItem("vendorReferredBy", referralValidation.referrerId);
    }

    // Only send fields that exist in the database
    const completeData = {
      userId,
      businessName: formData.step1.businessName,
      ownerName: formData.step1.ownerName,
      category: primaryCategory?.name || formData.step2.customCategory || "Others",
      subcategory: primarySubcategory?.name || formData.step2.customSubcategory || "General",
      customCategory: formData.step2.customCategory || null,
      customSubcategory: formData.step2.customSubcategory || null,
      email: formData.step1.email,
      phone: formData.step1.phone,
      whatsappNumber: formData.step1.whatsappNumber,
      street: formData.step3.street,
      city: formData.step3.city,
      state: formData.step3.state,
      pincode: formData.step3.pincode,
      address: `${formData.step3.street}, ${formData.step3.city}, ${formData.step3.state} - ${formData.step3.pincode}`,
      logo: data.logo || null,
      description: data.description,
      onboardingComplete: true,
      status: "approved",
    };

    createVendorMutation.mutate(completeData);
  };

  // Category selection handler
  const toggleCategory = (categoryId: string) => {
    const current = formData.step2.selectedCategories;
    let updated: string[];
    
    if (current.includes(categoryId)) {
      updated = current.filter(id => id !== categoryId);
      // Also remove subcategories of this category
      const subsToRemove = subcategories.filter(s => s.categoryId === categoryId).map(s => s.id);
      setFormData(prev => ({
        ...prev,
        step2: {
          ...prev.step2,
          selectedCategories: updated,
          selectedSubcategories: prev.step2.selectedSubcategories.filter(id => !subsToRemove.includes(id)),
        }
      }));
    } else {
      if (current.length >= 3) {
        toast({
          title: "Maximum 3 categories",
          description: "You can select up to 3 categories only",
          variant: "destructive",
        });
        return;
      }
      updated = [...current, categoryId];
      setFormData(prev => ({
        ...prev,
        step2: { ...prev.step2, selectedCategories: updated }
      }));
    }
  };

  // Subcategory selection handler
  const toggleSubcategory = (subcategoryId: string) => {
    const current = formData.step2.selectedSubcategories;
    let updated: string[];
    
    if (current.includes(subcategoryId)) {
      updated = current.filter(id => id !== subcategoryId);
    } else {
      updated = [...current, subcategoryId];
    }
    
    setFormData(prev => ({
      ...prev,
      step2: { ...prev.step2, selectedSubcategories: updated }
    }));
  };

  const VYORA_LOGO = "https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        @keyframes glow {
          0%, 100% { opacity: 0.3; filter: blur(40px); }
          50% { opacity: 0.5; filter: blur(60px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-glow { animation: glow 4s ease-in-out infinite; }
        .animate-fade-in { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-full blur-3xl animate-glow" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-br from-blue-300/15 to-cyan-400/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-blue-200/15 to-blue-400/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
        
        {/* Top progress line */}
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-100 z-50">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-12 pb-24">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={VYORA_LOGO} alt="Vyora" className="w-12 h-12 rounded-xl shadow-lg shadow-blue-500/25 object-contain" />
            <span className="text-2xl font-bold text-blue-600 font-jakarta">Vyora</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 font-jakarta">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 text-lg">
            Set up your business account in just a few steps
          </p>
        </div>

        {/* Step Indicators - Desktop */}
        <div className="hidden md:flex justify-between items-center mb-10 px-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isComplete = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => isComplete && setCurrentStep(step.number)}
                    disabled={!isComplete}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 shadow-lg shadow-blue-500/20 scale-110"
                        : isComplete
                        ? "border-green-500 bg-green-500/10 text-green-600 cursor-pointer hover:scale-105"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </button>
                  <span className={`text-xs font-semibold mt-2 transition-colors ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 rounded transition-colors ${isComplete ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="flex md:hidden items-center justify-center gap-2 mb-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === step.number
                  ? "w-8 bg-blue-600"
                  : currentStep > step.number
                  ? "w-2 bg-green-500"
                  : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step Info */}
        <div className="mb-6 text-center md:text-left animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-center md:justify-start gap-3 text-gray-600 text-sm mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
              Step {currentStep} of 4
            </span>
            <span>{steps[currentStep - 1].subtitle}</span>
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white border border-gray-200 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl animate-slide-in">
          {/* Card Header */}
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                {(() => {
                  const CurrentIcon = steps[currentStep - 1].icon;
                  return <CurrentIcon className="h-6 w-6 text-blue-600" />;
                })()}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-jakarta">
                  {steps[currentStep - 1].title}
                </h2>
                <p className="text-gray-600">{steps[currentStep - 1].subtitle}</p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 md:p-8">
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(handleStep1Next)} className="space-y-6">
                  <FormField
                    control={form1.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Business Name *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input 
                              {...field} 
                              placeholder="Enter your business name" 
                              className="h-14 pl-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form1.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Owner / Contact Name *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input 
                              {...field} 
                              placeholder="Enter your name" 
                              className="h-14 pl-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form1.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Email *</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="you@example.com" 
                                className="h-14 pl-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form1.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Phone *</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <Input 
                                {...field} 
                                type="tel" 
                                placeholder="+91 98765 43210" 
                                className="h-14 pl-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form1.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">WhatsApp Number *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                            <Input 
                              {...field} 
                              type="tel" 
                              placeholder="+91 98765 43210" 
                              className="h-14 pl-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  {/* Referral Code - Real-time Validation */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-800 font-jakarta">Have a referral code?</span>
                      <Badge className="bg-blue-100 text-blue-600 border-blue-200 text-xs">Optional</Badge>
                    </div>
                    <div className="relative">
                      <Input
                        value={referralCode}
                        onChange={(e) => handleReferralCodeChange(e.target.value.toUpperCase())}
                        placeholder="Enter referral code"
                        className="h-12 pr-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 uppercase"
                        maxLength={12}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValidatingReferral && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        )}
                        {referralValidation?.valid && !isValidatingReferral && (
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        {referralValidation && !referralValidation.valid && !isValidatingReferral && (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <X className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    {referralValidation?.valid && (
                      <p className="text-sm text-green-600 font-medium flex items-center gap-2 mt-2 animate-fade-in">
                        <CheckCircle2 className="h-4 w-4" />
                        Referred by {referralValidation.referrerName || referralValidation.referrerOwner}
                      </p>
                    )}
                    {referralValidation && !referralValidation.valid && (
                      <p className="text-sm text-red-500 mt-2">{referralValidation.error || "Invalid referral code"}</p>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={() => setLocation('/signup')}
                      className="h-14 px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="h-14 px-8 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 2: Category Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {categorySelectionMode === 'categories' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 font-jakarta">
                          Select Your Business Categories
                        </h3>
                        <p className="text-sm text-gray-600">
                          Choose up to 3 categories that best describe your business
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-600 border-blue-200 px-3 py-1">
                        {formData.step2.selectedCategories.length}/3 selected
                      </Badge>
                    </div>

                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {categories.map((category) => {
                          const isSelected = formData.step2.selectedCategories.includes(category.id);
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => toggleCategory(category.id)}
                              className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30'
                                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <div className="text-3xl mb-2">{category.icon || '📦'}</div>
                              <h4 className="font-semibold text-gray-800 text-sm font-jakarta">
                                {category.name}
                              </h4>
                            </button>
                          );
                        })}
                        
                        {/* Custom Category Option */}
                        <button
                          type="button"
                          onClick={() => {
                            const customId = 'custom-category';
                            if (!formData.step2.selectedCategories.includes(customId)) {
                              if (formData.step2.selectedCategories.length >= 3) {
                                toast({
                                  title: "Maximum 3 categories",
                                  description: "You can select up to 3 categories only",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setFormData(prev => ({
                                ...prev,
                                step2: {
                                  ...prev.step2,
                                  selectedCategories: [...prev.step2.selectedCategories, customId],
                                }
                              }));
                            }
                          }}
                          className="p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                        >
                          <div className="text-3xl mb-2">➕</div>
                          <h4 className="font-semibold text-gray-500 text-sm font-jakarta">
                            Other Category
                          </h4>
                        </button>
                      </div>
                    )}

                    {/* Custom Category Input */}
                    {formData.step2.selectedCategories.includes('custom-category') && (
                      <div className="mt-4">
                        <Input
                          value={formData.step2.customCategory || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            step2: { ...prev.step2, customCategory: e.target.value }
                          }))}
                          placeholder="Enter your custom category name"
                          className="h-12 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={goToPreviousStep}
                        className="h-14 px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        <ChevronLeft className="mr-2 h-5 w-5" />
                        Back
                      </Button>
                      {formData.step2.selectedCategories.length > 0 && (
                        <Button
                          type="button"
                          onClick={() => setCategorySelectionMode('subcategories')}
                          className="h-14 px-8 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700"
                        >
                          Continue to Subcategories
                          <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {categorySelectionMode === 'subcategories' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 font-jakarta">
                          Select Subcategories
                        </h3>
                        <p className="text-sm text-gray-600">
                          Choose the specific services/products you offer
                        </p>
                      </div>
                    </div>

                    {/* Show selected categories */}
                    <div className="flex flex-wrap gap-2">
                      {formData.step2.selectedCategories.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        return (
                          <Badge key={catId} className="bg-blue-100 text-blue-600 border-blue-200 text-sm py-1.5 px-3">
                            {cat?.icon} {cat?.name || 'Custom'}
                          </Badge>
                        );
                      })}
                    </div>

                    {loadingSubcategories ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {getFilteredSubcategories().map((subcategory) => {
                          const isSelected = formData.step2.selectedSubcategories.includes(subcategory.id);
                          return (
                            <button
                              key={subcategory.id}
                              type="button"
                              onClick={() => toggleSubcategory(subcategory.id)}
                              className={`relative p-3 rounded-xl border-2 transition-all text-left hover:scale-[1.02] ${
                                isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-white hover:border-green-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              )}
                              <span className="mr-2">{subcategory.icon || '•'}</span>
                              <span className="font-medium text-sm text-gray-800">{subcategory.name}</span>
                            </button>
                          );
                        })}
                        
                        {/* Custom Subcategory Option */}
                        <div className="p-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                          <Input
                            value={formData.step2.customSubcategory || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              step2: { ...prev.step2, customSubcategory: e.target.value }
                            }))}
                            placeholder="Add custom..."
                            className="h-9 text-sm border-0 p-0 bg-transparent text-gray-800 placeholder:text-gray-400 focus-visible:ring-0"
                          />
                        </div>
                      </div>
                    )}

                    {getFilteredSubcategories().length === 0 && !loadingSubcategories && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No subcategories found for selected categories.</p>
                        <p className="text-sm mt-1">You can add a custom subcategory above.</p>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCategorySelectionMode('categories')}
                        className="h-14 px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        <ChevronLeft className="mr-2 h-5 w-5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleStep2Next}
                        disabled={formData.step2.selectedSubcategories.length === 0 && !formData.step2.customSubcategory}
                        className="h-14 px-8 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        Continue
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Address */}
            {currentStep === 3 && (
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(handleStep3Next)} className="space-y-6">
                  <FormField
                    control={form3.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Street Address *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter street address" 
                            className="h-14 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form3.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">City *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="City" 
                              className="h-14 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form3.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">State *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="State" 
                              className="h-14 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form3.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Pincode *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Pincode" 
                              className="h-14 text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={goToPreviousStep}
                      className="h-14 px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="h-14 px-8 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 4: Branding */}
            {currentStep === 4 && (
              <Form {...form4}>
                <form onSubmit={form4.handleSubmit(handleStep4Submit)} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <label className="text-gray-700 font-medium">Business Logo (Optional)</label>
                    <div className="flex items-start gap-6">
                      <div 
                        className={`w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                          logoPreview ? 'border-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          disabled={isUploadingLogo}
                          className="h-12 border-gray-200 bg-white text-gray-800 file:text-gray-600"
                        />
                        <p className="text-xs text-gray-500">
                          Recommended: Square image, 200x200px minimum
                        </p>
                        {isUploadingLogo && (
                          <p className="text-sm text-blue-600 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form4.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Business Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            placeholder="Tell customers about your business, what makes you unique, and what services/products you offer..."
                            className="min-h-[150px] text-base rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 resize-none"
                          />
                        </FormControl>
                        <FormDescription className="flex justify-between text-gray-500">
                          <span>Minimum 50 characters</span>
                          <span className={field.value?.length >= 50 ? 'text-green-600' : ''}>
                            {field.value?.length || 0} / 500
                          </span>
                        </FormDescription>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={goToPreviousStep}
                      className="h-14 px-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createVendorMutation.isPending}
                      className="h-14 px-8 text-base font-semibold rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25 transition-all hover:scale-[1.02]"
                    >
                      {createVendorMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <Sparkles className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>

        {/* Footer Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Trusted by 12,000+ businesses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
