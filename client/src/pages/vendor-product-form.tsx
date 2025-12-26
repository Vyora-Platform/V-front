import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
// Card components removed for full-screen layout
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  Save, 
  Plus, 
  X, 
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  IndianRupee,
  ChevronLeft,
  Loader2,
  Shield
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";
import type { Category, Subcategory, Unit, Brand, VendorProduct } from "@shared/schema";

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 1000;

// Form Schema - with proper optional handling for numeric fields
// Note: 'price' is auto-derived from 'sellingPrice' so we don't require it in form validation
const vendorProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().nullable().optional(),
  category: z.string().min(1, "Category is required"),
  subcategoryId: z.string().nullable().optional(),
  subcategory: z.string().optional().nullable(),
  brand: z.string().nullable().optional(),
  icon: z.string().default("📦"),
  description: z.string().min(1, "Description is required"),
  specifications: z.array(z.string()).default([]),
  mrp: z.number().nullable().optional(),
  sellingPrice: z.number().refine((val) => val > 0, { message: "Selling price is required" }),
  price: z.number().default(0), // Auto-derived from sellingPrice
  unit: z.string().min(1, "Unit is required"),
  stock: z.number().min(0, "Stock must be 0 or more").default(0),
  variants: z.object({
    size: z.array(z.string()).optional(),
    color: z.array(z.string()).optional(),
    material: z.array(z.string()).optional(),
    style: z.array(z.string()).optional(),
    packSize: z.array(z.string()).optional(),
  }).default({}),
  images: z.array(z.string()).default([]),
  imageKeys: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  requiresPrescription: z.boolean().default(false),
  // Warranty & Guarantee
  hasWarranty: z.boolean().default(false),
  warrantyDuration: z.number().nullable().optional(),
  warrantyUnit: z.string().nullable().optional(),
  hasGuarantee: z.boolean().default(false),
  guaranteeDuration: z.number().nullable().optional(),
  guaranteeUnit: z.string().nullable().optional(),
});

type VendorProductFormData = z.infer<typeof vendorProductFormSchema>;

// 3 Steps configuration - Media merged into Pricing & Inventory, Unit in Step 3
// Note: 'price' is auto-synced from 'sellingPrice', so we only validate what user directly inputs
const STEPS = [
  { id: 1, name: "Basic Info", icon: Package, fields: ['name', 'category'] as const },
  { id: 2, name: "Description & Specs", icon: FileText, fields: ['description'] as const },
  { id: 3, name: "Pricing, Inventory & Media", icon: IndianRupee, fields: ['sellingPrice', 'unit', 'stock'] as const },
];

// Local storage key for draft data
const getDraftKey = (vendorId: string, productId?: string) => 
  `product_draft_${vendorId}_${productId || 'new'}`;

// Image Uploader Component with Supabase Upload - Accepts any image format/signature
function ProductImageUploader({ 
  value, 
  onChange, 
  vendorId,
  maxImages = 4 
}: { 
  value: string[]; 
  onChange: (images: string[]) => void; 
  vendorId: string;
  maxImages?: number;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Too many images",
        description: `You can only upload ${remainingSlots} more image(s)`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress("Preparing upload...");

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        // Accept any file type - no restriction on format/signature
        // Only check file size (max 20MB per image)
        if (file.size > 20 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 20MB`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to Supabase S3
        const formData = new FormData();
        formData.append('file', file);
        formData.append('vendorId', vendorId);
        formData.append('category', 'products');
        formData.append('isPublic', 'true');

        try {
          const response = await fetch('/api/upload/public', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              uploadedUrls.push(data.url);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Upload failed:", errorData);
            // Fallback to data URL if upload fails
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedUrls.push(dataUrl);
          }
        } catch (error) {
          console.error("Upload error:", error);
          // Fallback to data URL
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
        toast({
          title: "Images uploaded",
          description: `${uploadedUrls.length} image(s) added successfully`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Failed to upload images",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || value.length >= maxImages}
          onClick={() => document.getElementById('product-image-upload')?.click()}
          className="h-12 w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? uploadProgress : "Upload Images"}
        </Button>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{value.length}/{maxImages}</span> images
          <span className="hidden sm:inline"> · Max 20MB each · Any format</span>
        </div>
        <input
          id="product-image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || value.length >= maxImages}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {value.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border-2 border-dashed bg-muted overflow-hidden group"
            >
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.error-placeholder')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'error-placeholder w-full h-full flex items-center justify-center text-muted-foreground';
                    placeholder.innerHTML = '<span>Image</span>';
                    parent.appendChild(placeholder);
                  }
                }}
              />
              {index === 0 && (
                <Badge className="absolute top-2 left-2 text-xs bg-primary">Main</Badge>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => !uploading && document.getElementById('product-image-upload')?.click()}
        >
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No images uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to upload up to 4 product images
          </p>
          <p className="text-xs text-muted-foreground">Any format · Max 20MB each</p>
        </div>
      )}
    </div>
  );
}

export default function VendorProductForm() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/products/edit/:id");
  const productId = params?.id;
  const isEditing = !!productId;
  
  // Pro subscription
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<string | undefined>();

  const handleProAction = (action: string, callback: () => void) => {
    const result = canPerformAction(action as any);
    if (!result.allowed) {
      setBlockedAction(action);
      setShowUpgradeModal(true);
      return;
    }
    callback();
  };

  // Always start from step 1
  const [currentStep, setCurrentStep] = useState(1);
  const [specInput, setSpecInput] = useState("");
  const [variantInputs, setVariantInputs] = useState<Record<string, string>>({
    size: "",
    color: "",
    material: "",
    style: "",
    packSize: "",
  });
  const [customCategory, setCustomCategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSubcategory, setShowCustomSubcategory] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Auto-save debounce timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get vendor's selected categories from localStorage and API (set during onboarding)
  const [vendorSelectedCategories, setVendorSelectedCategories] = useState<string[]>([]);
  const [vendorSelectedSubcategories, setVendorSelectedSubcategories] = useState<string[]>([]);
  
  // Fetch vendor data to get selected categories from database
  const { data: vendorData } = useQuery({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
  
  // Load vendor's selected categories - prioritize API data, fallback to localStorage
  useEffect(() => {
    // First try to get from API response (most reliable)
    if (vendorData) {
      const apiCategories = (vendorData as any).selectedCategories;
      const apiSubcategories = (vendorData as any).selectedSubcategories;
      
      if (apiCategories && Array.isArray(apiCategories) && apiCategories.length > 0) {
        setVendorSelectedCategories(apiCategories);
        // Also update localStorage for consistency
        localStorage.setItem("vendorSelectedCategories", JSON.stringify(apiCategories));
      }
      
      if (apiSubcategories && Array.isArray(apiSubcategories) && apiSubcategories.length > 0) {
        setVendorSelectedSubcategories(apiSubcategories);
        localStorage.setItem("vendorSelectedSubcategories", JSON.stringify(apiSubcategories));
      }
      return;
    }
    
    // Fallback to localStorage if API data not available yet
    try {
      const storedCategories = localStorage.getItem("vendorSelectedCategories");
      const storedSubcategories = localStorage.getItem("vendorSelectedSubcategories");
      
      if (storedCategories) {
        setVendorSelectedCategories(JSON.parse(storedCategories));
      }
      if (storedSubcategories) {
        setVendorSelectedSubcategories(JSON.parse(storedSubcategories));
      }
    } catch (error) {
      console.error("Error loading vendor categories:", error);
    }
  }, [vendorData]);

  // Fetch master data - all categories
  const { data: allCategories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch all subcategories
  const { data: allSubcategories = [], isLoading: loadingSubcategories } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
    staleTime: 5 * 60 * 1000,
  });
  
  // Filter categories to only show vendor's selected ones (or all if none selected)
  const categories = vendorSelectedCategories.length > 0
    ? allCategories.filter(cat => vendorSelectedCategories.includes(cat.id))
    : allCategories;
  
  // Filter subcategories to only show vendor's selected ones (or filter by selected category)
  const subcategories = vendorSelectedSubcategories.length > 0
    ? allSubcategories.filter(sub => vendorSelectedSubcategories.includes(sub.id))
    : allSubcategories;

  // Fetch all units from master data
  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all brands from master data
  const { data: brands = [], isLoading: loadingBrands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product if editing
  const { data: existingProduct, isLoading: loadingProduct } = useQuery<VendorProduct>({
    queryKey: ["/api/vendor-products", productId],
    enabled: isEditing && !!productId,
  });

  // Form with blank defaults - using empty string for display, will be coerced on submit
  const form = useForm<VendorProductFormData>({
    resolver: zodResolver(vendorProductFormSchema),
    defaultValues: {
      name: "",
      categoryId: null,
      category: "",
      subcategoryId: null,
      subcategory: "",
      brand: null,
      icon: "📦",
      description: "",
      specifications: [],
      mrp: null,
      sellingPrice: 0,
      price: 0,
      unit: "",
      stock: 0,
      variants: {
        size: [],
        color: [],
        material: [],
        style: [],
        packSize: [],
      },
      images: [],
      imageKeys: [],
      isActive: true,
      requiresPrescription: false,
      hasWarranty: false,
      warrantyDuration: null,
      warrantyUnit: null,
      hasGuarantee: false,
      guaranteeDuration: null,
      guaranteeUnit: null,
    },
    mode: "onChange", // Validate on change for better UX
  });

  // Load draft from localStorage on mount - ALWAYS start from step 1
  useEffect(() => {
    if (!vendorId) return;
    
    const draftKey = getDraftKey(vendorId, productId);
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft && !isEditing) {
      try {
        const draftData = JSON.parse(savedDraft);
        if (draftData.data) {
          // Check if draft is still valid (not older than 7 days)
          const savedAt = new Date(draftData.savedAt);
          const now = new Date();
          const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 7) {
            form.reset(draftData.data);
            // Always start from step 1, but keep the draft data
            setCurrentStep(1);
            setLastSaved(savedAt);
            toast({
              title: "Draft restored",
              description: "Your previous progress has been restored. Starting from step 1.",
            });
          } else {
            // Draft too old, remove it
            localStorage.removeItem(draftKey);
          }
        }
      } catch (error) {
        console.error("Failed to restore draft:", error);
      }
    }
  }, [vendorId, productId, isEditing]);

  // Populate form when editing
  useEffect(() => {
    if (existingProduct) {
      const variants = {
        size: [],
        color: [],
        material: [],
        style: [],
        packSize: [],
        ...(typeof existingProduct.variants === 'object' ? existingProduct.variants : {}),
      };

      form.reset({
        name: existingProduct.name,
        categoryId: existingProduct.categoryId || null,
        category: existingProduct.category,
        subcategoryId: existingProduct.subcategoryId || null,
        subcategory: existingProduct.subcategory || "",
        brand: existingProduct.brand || null,
        icon: existingProduct.icon || "📦",
        description: existingProduct.description,
        specifications: existingProduct.specifications || [],
        mrp: (existingProduct as any).mrp || null,
        sellingPrice: (existingProduct as any).sellingPrice || existingProduct.price,
        price: existingProduct.price,
        unit: existingProduct.unit,
        stock: existingProduct.stock,
        variants: variants as any,
        images: existingProduct.images || [],
        imageKeys: existingProduct.imageKeys || [],
        isActive: existingProduct.isActive,
        requiresPrescription: existingProduct.requiresPrescription || false,
        hasWarranty: (existingProduct as any).hasWarranty || false,
        warrantyDuration: (existingProduct as any).warrantyDuration || null,
        warrantyUnit: (existingProduct as any).warrantyUnit || null,
        hasGuarantee: (existingProduct as any).hasGuarantee || false,
        guaranteeDuration: (existingProduct as any).guaranteeDuration || null,
        guaranteeUnit: (existingProduct as any).guaranteeUnit || null,
      });
      
      // Set saved timestamp for edit mode
      setLastSaved(new Date(existingProduct.updatedAt));
    }
  }, [existingProduct, form]);

  // Auto-save function
  const saveDraft = useCallback((data: VendorProductFormData) => {
    if (!vendorId) return;
    
    setIsSaving(true);
    const draftKey = getDraftKey(vendorId, productId);
    const draftData = {
      data,
      step: currentStep,
      savedAt: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsSaving(false);
    }
  }, [vendorId, productId, currentStep]);

  // Watch form changes and auto-save with debounce
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set new timer for debounced save
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(data as VendorProductFormData);
      }, AUTO_SAVE_DELAY);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, saveDraft]);

  // Save on step change
  useEffect(() => {
    const currentData = form.getValues();
    saveDraft(currentData);
  }, [currentStep, form, saveDraft]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentData = form.getValues();
      if (vendorId) {
        const draftKey = getDraftKey(vendorId, productId);
        const draftData = {
          data: currentData,
          step: currentStep,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [vendorId, productId, currentStep, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: VendorProductFormData) =>
      apiRequest("POST", `/api/vendors/${vendorId}/products`, {
        ...data,
        vendorId,
      }),
    onSuccess: () => {
      // Clear draft after successful save
      if (vendorId) {
        localStorage.removeItem(getDraftKey(vendorId, productId));
      }
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      toast({ title: "Product created successfully" });
      setLocation("/vendor/products-catalogue");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: VendorProductFormData) =>
      apiRequest("PATCH", `/api/vendor-products/${productId}`, data),
    onSuccess: () => {
      // Clear draft after successful save
      if (vendorId) {
        localStorage.removeItem(getDraftKey(vendorId, productId));
      }
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-products", productId] });
      toast({ title: "Product updated successfully" });
      setLocation("/vendor/products-catalogue");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Spec management
  const addSpecification = () => {
    if (specInput.trim()) {
      const current = form.getValues("specifications");
      form.setValue("specifications", [...current, specInput.trim()]);
      setSpecInput("");
    }
  };

  const removeSpecification = (index: number) => {
    const current = form.getValues("specifications");
    form.setValue("specifications", current.filter((_, i) => i !== index));
  };

  // Variant management
  const addVariant = (type: 'size' | 'color' | 'material' | 'style' | 'packSize') => {
    const value = variantInputs[type].trim();
    if (value) {
      const currentVariants = form.getValues("variants") || {};
      const currentValues = currentVariants[type] || [];
      if (!currentValues.includes(value)) {
        form.setValue("variants", {
          ...currentVariants,
          [type]: [...currentValues, value]
        });
      }
      setVariantInputs(prev => ({ ...prev, [type]: "" }));
    }
  };

  const removeVariant = (type: 'size' | 'color' | 'material' | 'style' | 'packSize', value: string) => {
    const currentVariants = form.getValues("variants") || {};
    const currentValues = currentVariants[type] || [];
    form.setValue("variants", {
      ...currentVariants,
      [type]: currentValues.filter(v => v !== value)
    });
  };

  // Check if current step is valid
  const isStepValid = async (step: number): Promise<boolean> => {
    const stepConfig = STEPS[step - 1];
    if (!stepConfig) return true;
    
    const result = await form.trigger(stepConfig.fields as any);
    return result;
  };

  // Navigation - Validates current step before moving to next
  const handleNext = async () => {
    const isValid = await isStepValid(currentStep);
    
    if (!isValid) {
      toast({
        title: "Please fill required fields",
        description: "Complete all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit - ensure all required fields are properly set
  const handleSubmit = (data: VendorProductFormData) => {
    // Ensure price is set from sellingPrice if not already set
    const finalPrice = data.price > 0 ? data.price : data.sellingPrice;
    
    const productData = {
      ...data,
      vendorId,
      category: customCategory || data.category,
      subcategory: customSubcategory || data.subcategory || null,
      brand: customBrand || data.brand || null,
      unit: customUnit || data.unit,
      price: finalPrice,
      sellingPrice: data.sellingPrice,
      stock: data.stock || 0,
    };

    console.log("📦 Submitting product data:", productData);

    if (isEditing) {
      updateMutation.mutate(productData);
    } else {
      createMutation.mutate(productData);
    }
  };

  // Clear draft handler
  const handleClearDraft = () => {
    if (vendorId) {
      localStorage.removeItem(getDraftKey(vendorId, productId));
      form.reset();
      setCurrentStep(1);
      setLastSaved(null);
      toast({
        title: "Draft cleared",
        description: "Starting fresh.",
      });
    }
  };

  const selectedCategoryId = form.watch("categoryId");
  const filteredSubcategories = subcategories.filter(s => s.categoryId === selectedCategoryId);
  const filteredBrands = brands.filter(b => b.categoryId === selectedCategoryId);

  // Loading state
  if (loadingCategories || loadingSubcategories || loadingUnits || loadingBrands || loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      {/* Header - Full screen native feel */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Standard ecommerce back navigation
              if (currentStep > 1) {
                handlePrevious();
              } else {
                setLocation("/vendor/products-catalogue");
              }
            }}
            className="h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>Auto-save enabled</span>
              )}
            </div>
          </div>
          {!isEditing && lastSaved && (
            <Button variant="ghost" size="sm" onClick={handleClearDraft} className="text-xs h-8 px-2">
              Clear
            </Button>
          )}
        </div>

        {/* Step Progress - All steps visible */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        // Allow going back to completed steps
                        if (step.id < currentStep) {
                          setCurrentStep(step.id);
                        }
                      }}
                      disabled={step.id > currentStep}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground scale-110"
                          : isCompleted
                          ? "border-green-500 bg-green-500 text-white cursor-pointer hover:scale-105"
                          : "border-muted-foreground/30 bg-background text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <StepIcon className="h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </button>
                    <span className={`text-[10px] md:text-xs mt-1 text-center font-medium transition-colors ${
                      isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 md:mx-2 rounded-full transition-colors ${
                      isCompleted ? "bg-green-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content - Full screen, no card wrapper */}
      <div className="px-4 py-4 md:max-w-3xl md:mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            // Show validation error toast when form submission fails
            console.log("📋 Form validation errors:", errors);
            const errorMessages = Object.entries(errors)
              .map(([field, error]) => `${field}: ${(error as any)?.message}`)
              .join(", ");
            toast({
              title: "Please fix the errors",
              description: errorMessages || "Some required fields are missing.",
              variant: "destructive",
            });
          })} className="space-y-6">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                    <p className="text-sm text-muted-foreground">Enter product details</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product name" className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          {!showCustomCategory ? (
                            <>
                              <Select 
                                onValueChange={(value) => {
                                  if (value === "__custom__") {
                                    setShowCustomCategory(true);
                                    field.onChange("");
                                    form.setValue("categoryId", null);
                                    form.setValue("subcategory", "");
                                    form.setValue("subcategoryId", null);
                                    setShowCustomSubcategory(false);
                                  } else {
                                    field.onChange(value);
                                    setCustomCategory("");
                                    const cat = categories.find(c => c.name === value);
                                    form.setValue("categoryId", cat?.id || null);
                                    form.setValue("subcategory", "");
                                    form.setValue("subcategoryId", null);
                                    setShowCustomSubcategory(false);
                                  }
                                }} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.length === 0 ? (
                                    <SelectItem value="__empty__" disabled>
                                      No categories available
                                    </SelectItem>
                                  ) : (
                                    categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.name}>
                                        {cat.icon && `${cat.icon} `}{cat.name}
                                      </SelectItem>
                                    ))
                                  )}
                                  <Separator className="my-1" />
                                  <SelectItem value="__custom__">
                                    <span className="flex items-center gap-2">
                                      <Plus className="h-4 w-4" />
                                      Add Custom Category
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={customCategory}
                                  onChange={(e) => {
                                    setCustomCategory(e.target.value);
                                    field.onChange(e.target.value);
                                  }}
                                  placeholder="Enter custom category name"
                                  className="flex-1 h-12"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-12 w-12"
                                  onClick={() => {
                                    setShowCustomCategory(false);
                                    setCustomCategory("");
                                    field.onChange("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Custom category will be created when you save the product
                              </p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub-category</FormLabel>
                          {!showCustomSubcategory ? (
                            <>
                              <Select 
                                onValueChange={(value) => {
                                  if (value === "__custom__") {
                                    setShowCustomSubcategory(true);
                                    field.onChange("");
                                    form.setValue("subcategoryId", null);
                                  } else {
                                    field.onChange(value);
                                    setCustomSubcategory("");
                                    const sub = subcategories.find(s => s.name === value);
                                    form.setValue("subcategoryId", sub?.id || null);
                                  }
                                }} 
                                value={field.value || ""}
                                disabled={!form.watch("category") && !showCustomCategory}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder={form.watch("category") ? "Select subcategory" : "Select category first"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredSubcategories.length === 0 && !showCustomCategory ? (
                                    <SelectItem value="__empty__" disabled>
                                      No subcategories for this category
                                    </SelectItem>
                                  ) : (
                                    filteredSubcategories.map((sub) => (
                                      <SelectItem key={sub.id} value={sub.name}>
                                        {sub.icon && `${sub.icon} `}{sub.name}
                                      </SelectItem>
                                    ))
                                  )}
                                  <Separator className="my-1" />
                                  <SelectItem value="__custom__">
                                    <span className="flex items-center gap-2">
                                      <Plus className="h-4 w-4" />
                                      Add Custom Subcategory
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={customSubcategory}
                                  onChange={(e) => {
                                    setCustomSubcategory(e.target.value);
                                    field.onChange(e.target.value);
                                  }}
                                  placeholder="Enter custom subcategory name"
                                  className="flex-1 h-12"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-12 w-12"
                                  onClick={() => {
                                    setShowCustomSubcategory(false);
                                    setCustomSubcategory("");
                                    field.onChange("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Custom subcategory will be created when you save the product
                              </p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          {!showCustomBrand ? (
                            <Select 
                              onValueChange={(value) => {
                                if (value === "__custom__") {
                                  setShowCustomBrand(true);
                                  field.onChange("");
                                } else {
                                  field.onChange(value);
                                  setCustomBrand("");
                                }
                              }} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select brand (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {/* Show all brands or filtered by category */}
                                {(filteredBrands.length > 0 ? filteredBrands : brands).length === 0 ? (
                                  <SelectItem value="__empty__" disabled>
                                    No brands available
                                  </SelectItem>
                                ) : (
                                  (filteredBrands.length > 0 ? filteredBrands : brands).map((brand) => (
                                    <SelectItem key={brand.id} value={brand.name}>
                                      {brand.name}
                                    </SelectItem>
                                  ))
                                )}
                                <Separator className="my-1" />
                                <SelectItem value="__custom__">
                                  <span className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Custom Brand
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={customBrand}
                                onChange={(e) => {
                                  setCustomBrand(e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                placeholder="Enter brand name"
                                className="flex-1 h-12"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => {
                                  setShowCustomBrand(false);
                                  setCustomBrand("");
                                  field.onChange("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Description & Specifications */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Description & Specs</h2>
                    <p className="text-sm text-muted-foreground">Add product details and highlights</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={6} 
                            placeholder="Describe your product in detail. Include key features, benefits, and usage instructions..." 
                            className="min-h-[150px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Specifications */}
                  <div className="space-y-3">
                    <FormLabel>Product Highlights (Bullet Points)</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={specInput}
                        onChange={(e) => setSpecInput(e.target.value)}
                        placeholder="e.g., Premium quality material"
                        className="h-12 flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                      />
                      <Button 
                        type="button" 
                        onClick={addSpecification} 
                        variant="default" 
                        className="h-12 px-4 min-w-[80px]"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {form.watch("specifications")?.map((spec, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="flex-1 text-sm">{spec}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecification(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Variants */}
                  <div className="space-y-4">
                    <FormLabel>Variants & Attributes</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Add product variants like size, color, material, style, and pack size.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'size' as const, label: 'Size', placeholder: 'e.g., S, M, L, XL' },
                        { key: 'color' as const, label: 'Color', placeholder: 'e.g., Red, Blue' },
                        { key: 'material' as const, label: 'Material', placeholder: 'e.g., Cotton' },
                        { key: 'style' as const, label: 'Style', placeholder: 'e.g., Casual' },
                        { key: 'packSize' as const, label: 'Pack Size', placeholder: 'e.g., Pack of 3' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-2 p-4 border rounded-xl bg-muted/30">
                          <label className="text-sm font-semibold">{label}</label>
                          <div className="flex gap-2">
                            <Input
                              value={variantInputs[key]}
                              onChange={(e) => setVariantInputs(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder}
                              className="h-11 flex-1"
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant(key))}
                            />
                            <Button 
                              type="button" 
                              onClick={() => addVariant(key)} 
                              variant="default" 
                              size="sm"
                              className="h-11 px-4"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          {(form.watch("variants")?.[key] || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {(form.watch("variants")?.[key] || []).map((value: string) => (
                                <Badge key={value} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                                  {value}
                                  <X 
                                    className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors ml-1" 
                                    onClick={() => removeVariant(key, value)} 
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Warranty & Guarantee Section */}
                  <div className="space-y-4">
                    <FormLabel className="text-base font-semibold">Warranty & Guarantee</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Add warranty or guarantee information if applicable
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Warranty */}
                      <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            Warranty
                          </label>
                          <FormField
                            control={form.control}
                            name="hasWarranty"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {form.watch("hasWarranty") && (
                          <div className="flex gap-2">
                            <FormField
                              control={form.control}
                              name="warrantyDuration"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                      placeholder="Duration"
                                      className="h-11"
                                      min={1}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="warrantyUnit"
                              render={({ field }) => (
                                <FormItem className="w-28">
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="days">Days</SelectItem>
                                      <SelectItem value="months">Months</SelectItem>
                                      <SelectItem value="years">Years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Guarantee */}
                      <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Guarantee
                          </label>
                          <FormField
                            control={form.control}
                            name="hasGuarantee"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {form.watch("hasGuarantee") && (
                          <div className="flex gap-2">
                            <FormField
                              control={form.control}
                              name="guaranteeDuration"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                      placeholder="Duration"
                                      className="h-11"
                                      min={1}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="guaranteeUnit"
                              render={({ field }) => (
                                <FormItem className="w-28">
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="days">Days</SelectItem>
                                      <SelectItem value="months">Months</SelectItem>
                                      <SelectItem value="years">Years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing, Inventory & Media (Combined) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Pricing & Inventory</h2>
                    <p className="text-sm text-muted-foreground">Set prices and upload images</p>
                  </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="mrp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MRP (₹)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  placeholder="Enter MRP (optional)"
                                  className="pl-8 h-12"
                                  min={0}
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Maximum Retail Price (for discount display)
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selling Price (₹) *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : 0;
                                    field.onChange(val);
                                    // Sync price with sellingPrice
                                    form.setValue("price", val);
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  placeholder="Enter selling price"
                                  className="pl-8 h-12"
                                  min={1}
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Price including all taxes
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Unit Field - Price per unit display */}
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pricing Unit *</FormLabel>
                          <p className="text-xs text-muted-foreground mb-2">
                            Your price will display as ₹{form.watch("sellingPrice") || "0"}/{field.value || "unit"}
                          </p>
                          {!showCustomUnit ? (
                            <Select 
                              onValueChange={(value) => {
                                if (value === "__custom__") {
                                  setShowCustomUnit(true);
                                  field.onChange("");
                                } else {
                                  field.onChange(value);
                                  setCustomUnit("");
                                }
                              }} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select unit (e.g., kg, piece, liter)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {units.length === 0 ? (
                                  <SelectItem value="__empty__" disabled>
                                    No units available
                                  </SelectItem>
                                ) : (
                                  units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.name}>
                                      {unit.name} {unit.code && `(${unit.code})`}
                                    </SelectItem>
                                  ))
                                )}
                                <Separator className="my-1" />
                                <SelectItem value="__custom__">
                                  <span className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Custom Unit
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={customUnit}
                                onChange={(e) => {
                                  setCustomUnit(e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                placeholder="Enter custom unit (e.g., box, pack)"
                                className="flex-1 h-12"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12"
                                onClick={() => {
                                  setShowCustomUnit(false);
                                  setCustomUnit("");
                                  field.onChange("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              placeholder="Enter available quantity"
                              className="h-12"
                              min={0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 p-4 border rounded-lg">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-5 w-5"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="!m-0">Product is Active</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Active products will be visible to customers
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requiresPrescription"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 p-4 border rounded-lg">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-5 w-5"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="!m-0">Requires Prescription</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                For medical products that need prescription
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                </div>

                {/* Media Section */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Product Images</h3>
                      <p className="text-xs text-muted-foreground">Upload up to 4 images</p>
                    </div>
                  </div>
                    
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ProductImageUploader
                              value={field.value || []}
                              onChange={field.onChange}
                              vendorId={vendorId || ""}
                              maxImages={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              </div>
            )}

            {/* Navigation Buttons - Sticky on mobile */}
            <div className="flex justify-between gap-4 sticky bottom-0 bg-background p-4 -mx-4 border-t md:relative md:bottom-auto md:bg-transparent md:border-0 md:p-0">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => setLocation("/vendor/products-catalogue") : handlePrevious}
                className="h-12 flex-1 md:flex-none md:w-32"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>
              
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext} className="h-12 flex-1 md:flex-none md:w-48">
                  Save and Continue
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-12 flex-1 md:flex-none md:w-48"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? "Update Product" : "Create Product"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
