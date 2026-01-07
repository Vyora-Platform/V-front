import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  IndianRupee
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Category, Subcategory, Unit, Brand, VendorProduct } from "@shared/schema";

// Form Schema
const vendorProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().nullable(),
  category: z.string().min(1, "Category is required"),
  subcategoryId: z.string().nullable(),
  subcategory: z.string().optional(),
  brand: z.string().nullable(),
  icon: z.string().default("📦"),
  description: z.string().min(1, "Description is required"),
  specifications: z.array(z.string()).default([]),
  mrp: z.number().nullable(),
  sellingPrice: z.number().min(1, "Selling price is required"),
  price: z.number().min(1, "Price is required"),
  unit: z.string().min(1, "Unit is required"),
  stock: z.number().min(0, "Stock must be 0 or more"),
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
});

type VendorProductFormData = z.infer<typeof vendorProductFormSchema>;

// Steps configuration
const STEPS = [
  { id: 1, name: "Basic Info", icon: Package },
  { id: 2, name: "Description & Specs", icon: FileText },
  { id: 3, name: "Pricing & Stock", icon: IndianRupee },
  { id: 4, name: "Media", icon: ImageIcon },
];

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
          accept="*/*"
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

  // Fetch master data - categories for this vendor (global + vendor-specific)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: [`/api/categories?vendorId=${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch subcategories for this vendor (global + vendor-specific)
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: [`/api/subcategories?vendorId=${vendorId}`],
    enabled: !!vendorId,
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  // Fetch product if editing
  const { data: existingProduct } = useQuery<VendorProduct>({
    queryKey: ["/api/vendor-products", productId],
    enabled: isEditing && !!productId,
  });

  // Form
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
      sellingPrice: undefined as unknown as number, // Show blank instead of 0
      price: undefined as unknown as number, // Show blank instead of 0
      unit: "",
      stock: undefined as unknown as number, // Show blank instead of 0
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
    },
  });

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
      });
    }
  }, [existingProduct, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: VendorProductFormData) =>
      apiRequest("POST", `/api/vendors/${vendorId}/products`, {
        ...data,
        vendorId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "products"] });
      toast({ title: "Product created successfully" });
      setLocation("/vendor/my-products");
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
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "products"] });
      toast({ title: "Product updated successfully" });
      setLocation("/vendor/my-products");
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

  // Navigation - Only validates and moves to next step, NO product creation
  const handleNext = async () => {
    let fieldsToValidate: (keyof VendorProductFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'category', 'unit'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['description'];
    } else if (currentStep === 3) {
      // Only validate pricing fields but DON'T submit the form
      fieldsToValidate = ['sellingPrice', 'price', 'stock'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      // Simply move to next step - no form submission
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit
  const handleSubmit = (data: VendorProductFormData) => {
    const productData = {
      ...data,
      vendorId,
      category: customCategory || data.category,
      subcategory: customSubcategory || data.subcategory,
      brand: customBrand || data.brand,
      unit: customUnit || data.unit,
    };

    if (isEditing) {
      updateMutation.mutate(productData);
    } else {
      createMutation.mutate(productData);
    }
  };

  const selectedCategoryId = form.watch("categoryId");
  const filteredSubcategories = subcategories.filter(s => s.categoryId === selectedCategoryId);
  const filteredBrands = brands.filter(b => b.categoryId === selectedCategoryId);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/my-products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of 4
            </p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="px-4 pb-4">
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
                      onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                      disabled={step.id > currentStep}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                          ? "border-green-500 bg-green-500 text-white cursor-pointer"
                          : "border-muted bg-background text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </button>
                    <span className="text-xs mt-1 text-center hidden sm:block">{step.name}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 max-w-3xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Basic Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product name" />
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
                                  <SelectTrigger>
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
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
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
                                  <SelectTrigger>
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
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select brand (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredBrands.length === 0 ? (
                                  <SelectItem value="__empty__" disabled>
                                    No brands available
                                  </SelectItem>
                                ) : (
                                  filteredBrands.map((brand) => (
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
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
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

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit *</FormLabel>
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
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.name}>
                                    {unit.name} {unit.code && `(${unit.code})`}
                                  </SelectItem>
                                ))}
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
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Description & Specifications */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description & Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                      />
                      <Button type="button" onClick={addSpecification} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {form.watch("specifications")?.map((spec, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="flex-1 text-sm">{spec}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecification(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
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
                        <div key={key} className="space-y-2">
                          <label className="text-sm font-medium">{label}</label>
                          <div className="flex gap-2">
                            <Input
                              value={variantInputs[key]}
                              onChange={(e) => setVariantInputs(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant(key))}
                            />
                            <Button type="button" onClick={() => addVariant(key)} variant="outline" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(form.watch("variants")?.[key] || []).map((value: string) => (
                              <Badge key={value} variant="secondary" className="gap-1">
                                {value}
                                <X 
                                  className="h-3 w-3 cursor-pointer" 
                                  onClick={() => removeVariant(key, value)} 
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Pricing & Stock */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Pricing & Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                placeholder="Enter MRP"
                                className="pl-8"
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
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : undefined;
                                  field.onChange(val);
                                  if (val) form.setValue("price", val);
                                }}
                                placeholder="Enter selling price"
                                className="pl-8"
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

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Enter available quantity"
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
                </CardContent>
              </Card>
            )}

            {/* Step 4: Media */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Product Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload up to 4 high-quality product images. The first image will be used as the main product image.
                  </p>
                  
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
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 sticky bottom-0 bg-background p-4 -mx-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => setLocation("/vendor/my-products") : handlePrevious}
              >
                {currentStep === 1 ? "Cancel" : "Previous"}
              </Button>
              
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending || updateMutation.isPending 
                    ? "Saving..." 
                    : isEditing ? "Update Product" : "Create Product"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}




