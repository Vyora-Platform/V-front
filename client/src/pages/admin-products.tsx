import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ArrowUpDown, 
  Package, 
  Grid3x3,
  List,
  Star,
  SlidersHorizontal,
  ListChecks,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Copy
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { MasterProduct, Category, Subcategory, Unit, Brand } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Device-only image uploader component (no URL input)
function ProductImageUploaderDeviceOnly({ value, onChange, maxImages = 4 }: { value: string[]; onChange: (images: string[]) => void; maxImages?: number }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

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

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image`,
            variant: "destructive",
          });
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Convert to data URL
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        uploadedUrls.push(dataUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
        toast({
          title: "Images added",
          description: `${uploadedUrls.length} image(s) added`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Failed to add images",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || value.length >= maxImages}
          onClick={() => document.getElementById('product-image-upload-device')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload from Device"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {value.length}/{maxImages} images
        </span>
        <input
          id="product-image-upload-device"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || value.length >= maxImages}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {value.map((imageKey, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border bg-muted overflow-hidden group"
            >
              <img
                src={imageKey}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
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
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest First" },
  { value: "name", label: "Name (A-Z)" },
  { value: "basePrice", label: "Price: Low to High" },
  { value: "category", label: "Category" },
];

const masterProductFormSchema = z.object({
  categoryId: z.string().nullable(),
  category: z.string().min(1, "Category is required"),
  subcategoryId: z.string().nullable(),
  subcategory: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  brand: z.string().nullable(),
  icon: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  specifications: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  basePrice: z.number().nullable(),
  sellingPrice: z.number().nullable(),
  attributes: z.array(z.object({
    key: z.string().min(1, "Attribute key is required"),
    value: z.string().min(1, "Attribute value is required"),
  })).default([]),
  unit: z.string().optional(),
  imageKeys: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  requiresPrescription: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  version: z.number().default(1),
});

type MasterProductFormData = z.infer<typeof masterProductFormSchema>;

// Helper function to get product image URL
function getProductImageUrl(product: MasterProduct): string | null {
  // First try to use images array (legacy URLs)
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  
  // Then try imageKeys (storage keys) - construct public URL
  if (product.imageKeys && product.imageKeys.length > 0) {
    const supabaseUrl = "https://abizuwqnqkbicrhorcig.supabase.co";
    const bucket = "public-assets"; // Assuming master products are in public-assets
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${product.imageKeys[0]}`;
  }
  
  return null;
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  
  // View mode: grid or list
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Product form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [specInput, setSpecInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [attributeKey, setAttributeKey] = useState("");
  const [attributeValue, setAttributeValue] = useState("");
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [previewProduct, setPreviewProduct] = useState<MasterProduct | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<MasterProduct | null>(null);

  const STEPS = [
    { id: 1, name: "Product Details", icon: Package },
    { id: 2, name: "Description & Specs", icon: FileText },
    { id: 3, name: "Product Images", icon: ImageIcon },
  ];
  
  // Filter states
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [requiresPrescriptionFilter, setRequiresPrescriptionFilter] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  
  // Fetch categories and subcategories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  // Product form
  const form = useForm<MasterProductFormData>({
    resolver: zodResolver(masterProductFormSchema),
    defaultValues: {
      categoryId: null,
      category: "",
      subcategoryId: null,
      subcategory: "",
      name: "",
      brand: null,
      icon: "",
      description: "",
      specifications: [],
      tags: [],
      basePrice: null,
      sellingPrice: null,
      attributes: [],
      unit: "piece",
      imageKeys: [],
      images: [],
      requiresPrescription: false,
      status: 'draft',
      version: 1,
    },
  });

  // Handle edit product (defined first as it's used by duplicate mutation)
  const handleEditProduct = (product: MasterProduct) => {
    setEditingProduct(product);
    // Parse attributes if they exist (could be JSON string or array)
    let attributes = [];
    if ((product as any).attributes) {
      try {
        if (typeof (product as any).attributes === 'string') {
          attributes = JSON.parse((product as any).attributes);
        } else if (Array.isArray((product as any).attributes)) {
          attributes = (product as any).attributes;
        }
      } catch (e) {
        console.error("Error parsing attributes:", e);
      }
    }
    
    form.reset({
      categoryId: product.categoryId,
      category: product.category,
      subcategoryId: product.subcategoryId,
      subcategory: product.subcategory || "",
      name: product.name,
      brand: product.brand,
      icon: product.icon || "",
      description: product.description,
      specifications: product.specifications || [],
      tags: product.tags || [],
      basePrice: product.basePrice,
      sellingPrice: (product as any).sellingPrice || null,
      attributes: attributes,
      unit: product.unit || "piece",
      imageKeys: product.imageKeys || [],
      images: product.images || [],
      requiresPrescription: product.requiresPrescription || false,
      status: (product.status || 'draft') as 'draft' | 'published' | 'archived',
      version: product.version || 1,
    });
    setCurrentStep(1);
    setFormDialogOpen(true);
  };

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: MasterProductFormData) => {
      const response = await fetch("/api/admin/master-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to create product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product created successfully" });
      setFormDialogOpen(false);
      setCurrentStep(1);
      form.reset();
      setSpecInput("");
      setTagInput("");
      setAttributeKey("");
      setAttributeValue("");
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      console.error("Product creation error:", error);
      toast({ 
        title: "Failed to create product", 
        description: error.message || "Please check all required fields and try again",
        variant: "destructive" 
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MasterProductFormData }) => {
      const response = await fetch(`/api/admin/master-products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to update product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product updated successfully" });
      setFormDialogOpen(false);
      setCurrentStep(1);
      form.reset();
      setSpecInput("");
      setTagInput("");
      setAttributeKey("");
      setAttributeValue("");
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      console.error("Product update error:", error);
      toast({ 
        title: "Failed to update product", 
        description: error.message || "Please check all required fields and try again",
        variant: "destructive" 
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/master-products/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product deleted successfully" });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      console.error("Product deletion error:", error);
      toast({ 
        title: "Failed to delete product", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Duplicate product mutation
  const duplicateProductMutation = useMutation({
    mutationFn: async (data: MasterProductFormData) => {
      // Prepare data for API (same format as createProductMutation)
      const productData = {
        ...data,
        category: data.category || "",
        subcategory: data.subcategory || null,
        subcategoryId: data.subcategoryId || null,
        categoryId: data.categoryId || null,
        unit: data.unit || "piece",
        status: data.status || "draft",
        description: data.description || "",
        brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
        icon: data.icon || "📦",
        specifications: data.specifications || [],
        tags: data.tags || [],
        attributes: data.attributes || [],
        imageKeys: data.imageKeys || [],
        images: data.images || [],
        requiresPrescription: data.requiresPrescription || false,
        isUniversal: true,
        version: 1,
        basePrice: data.basePrice || null,
        sellingPrice: data.sellingPrice || null,
      };

      const response = await fetch("/api/admin/master-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || "Failed to duplicate product";
        if (errorData.details && Array.isArray(errorData.details)) {
          const details = errorData.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
          throw new Error(`${errorMessage}: ${details}`);
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: async (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product duplicated successfully" });
      // Wait for query invalidation and then open edit form
      await queryClient.refetchQueries({ queryKey: ["/api/admin/master-products"] });
      // Open edit form with the new product
      handleEditProduct(newProduct);
    },
    onError: (error: Error) => {
      console.error("Product duplication error:", error);
      toast({ 
        title: "Failed to duplicate product", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Handle duplicate product
  const handleDuplicateProduct = (product: MasterProduct) => {
    try {
      // Filter images to only include data URLs (base64) or HTTP URLs, not storage URLs
      const imageUrls = product.images || [];
      const dataUrlImages = imageUrls.filter(img => 
        img && typeof img === 'string' && (img.startsWith('data:') || img.startsWith('http'))
      );
      
      // Ensure all required fields have values
      if (!product.name || !product.category || !product.description) {
        toast({
          title: "Cannot duplicate product",
          description: "Product is missing required fields",
          variant: "destructive",
        });
        return;
      }
      
      // Parse attributes if they exist
      let attributes = [];
      if ((product as any).attributes) {
        try {
          if (typeof (product as any).attributes === 'string') {
            attributes = JSON.parse((product as any).attributes);
          } else if (Array.isArray((product as any).attributes)) {
            attributes = (product as any).attributes;
          }
        } catch (e) {
          console.error("Error parsing attributes:", e);
        }
      }

      const duplicateData: MasterProductFormData = {
        categoryId: product.categoryId || null,
        category: product.category,
        subcategoryId: product.subcategoryId || null,
        subcategory: product.subcategory || "",
        name: `${product.name} (Copy)`,
        brand: product.brand || null,
        icon: product.icon || "📦",
        description: product.description,
        specifications: Array.isArray(product.specifications) ? [...product.specifications] : [],
        tags: Array.isArray(product.tags) ? [...product.tags] : [],
        attributes: attributes,
        basePrice: product.basePrice ?? null,
        sellingPrice: (product as any).sellingPrice ?? null,
        unit: product.unit || "piece",
        imageKeys: [], // Clear imageKeys - storage references shouldn't be duplicated
        images: dataUrlImages, // Only copy data URLs or HTTP URLs
        requiresPrescription: product.requiresPrescription || false,
        status: 'draft' as 'draft' | 'published' | 'archived',
        version: 1,
      };
      
      duplicateProductMutation.mutate(duplicateData);
    } catch (error) {
      console.error("Error preparing duplicate product:", error);
      toast({
        title: "Failed to duplicate product",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle delete product
  const handleDeleteProduct = (product: MasterProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Handle preview product
  const handlePreviewProduct = (product: MasterProduct) => {
    setPreviewProduct(product);
    setPreviewDialogOpen(true);
  };

  const addSpecification = () => {
    if (specInput.trim()) {
      const currentSpecs = form.getValues("specifications");
      form.setValue("specifications", [...currentSpecs, specInput.trim()]);
      setSpecInput("");
    }
  };

  const removeSpecification = (index: number) => {
    const currentSpecs = form.getValues("specifications");
    form.setValue("specifications", currentSpecs.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    if (attributeKey.trim() && attributeValue.trim()) {
      const currentAttributes = form.getValues("attributes");
      form.setValue("attributes", [...currentAttributes, { key: attributeKey.trim(), value: attributeValue.trim() }]);
      setAttributeKey("");
      setAttributeValue("");
    }
  };

  const removeAttribute = (index: number) => {
    const currentAttributes = form.getValues("attributes");
    form.setValue("attributes", currentAttributes.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: MasterProductFormData) => {
    // Validate status before submitting
    const isValid = await form.trigger('status');
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please select a status for the product",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure all required fields are present and handle null/empty values
    const productData = {
      ...data,
      category: data.category || "",
      subcategory: data.subcategory || null,
      subcategoryId: data.subcategoryId || null,
      categoryId: data.categoryId || null,
      unit: data.unit || "piece",
      status: data.status || "draft",
      description: data.description || "",
      brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
      icon: data.icon || "📦", // Default icon if not provided
      specifications: data.specifications || [],
      tags: data.tags || [],
      attributes: data.attributes || [],
      imageKeys: data.imageKeys || [],
      images: data.images || [],
      requiresPrescription: data.requiresPrescription || false,
      isUniversal: true,
      version: 1,
      basePrice: data.basePrice || null,
      sellingPrice: data.sellingPrice || null,
    };
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
    createProductMutation.mutate(productData);
    }
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof MasterProductFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'category', 'unit'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['description'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setFormDialogOpen(false);
      setCurrentStep(1);
      form.reset();
      setSpecInput("");
      setTagInput("");
      setAttributeKey("");
      setAttributeValue("");
      setEditingProduct(null);
    } else {
      setFormDialogOpen(true);
    }
  };

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (search) params.append("search", search);
    selectedCategories.forEach(c => params.append("categoryIds", c));
    selectedSubcategories.forEach(s => params.append("subcategoryIds", s));
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (priceMin) params.append("priceMin", priceMin);
    if (priceMax) params.append("priceMax", priceMax);
    if (requiresPrescriptionFilter !== undefined) {
      params.append("requiresPrescription", requiresPrescriptionFilter.toString());
    }
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    params.append("limit", itemsPerPage.toString());
    params.append("offset", ((currentPage - 1) * itemsPerPage).toString());
    
    return params.toString();
  };

  // Fetch master products with filters
  const { data, isLoading } = useQuery<{ 
    products: MasterProduct[]; 
    total: number;
    hasMore: boolean;
  }>({
    queryKey: [
      "/api/admin/master-products",
      search,
      selectedCategories,
      selectedSubcategories,
      statusFilter,
      priceMin,
      priceMax,
      requiresPrescriptionFilter,
      sortBy,
      sortOrder,
      currentPage,
    ],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/admin/master-products?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Fetch brands from API
  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  // Get brands filtered by selected category
  const availableBrands = useMemo(() => {
    if (selectedCategories.length > 0) {
      return brands.filter(b => selectedCategories.includes(b.categoryId));
    }
    return brands;
  }, [brands, selectedCategories]);

  // Get unique brand names for dropdown
  const uniqueBrandNames = useMemo(() => {
    const brandNames = new Set<string>();
    availableBrands.forEach(b => {
      if (b.name && b.name.trim()) brandNames.add(b.name.trim());
    });
    return Array.from(brandNames).sort();
  }, [availableBrands]);

  // Filter subcategories based on selected categories
  const availableSubcategories = selectedCategories.length > 0
    ? subcategories.filter(sub => selectedCategories.includes(sub.categoryId))
    : subcategories;

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setStatusFilter("all");
    setPriceMin("");
    setPriceMax("");
    setRequiresPrescriptionFilter(undefined);
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = search || selectedCategories.length > 0 || 
    selectedSubcategories.length > 0 || statusFilter !== "all" ||
    priceMin || priceMax || requiresPrescriptionFilter !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Master Products</h1>
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? "Loading..." : `${total} product${total !== 1 ? 's' : ''} found`}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  // Scroll to products section or reset filters to show all
                  clearFilters();
                  const productsSection = document.getElementById('products-section');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                List Products
              </Button>
              
              {/* Add Product Button */}
              <Dialog open={formDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="default"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setEditingProduct(null);
                      form.reset();
                      setCurrentStep(1);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Master Product" : "Add New Master Product"}</DialogTitle>
                  </DialogHeader>

                  {/* Step Indicators */}
                  <div className="flex items-center justify-between mb-6 pt-4">
                    {STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = currentStep > step.id;
                      const isActive = currentStep === step.id;
                      
                      return (
                        <div key={step.id} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isActive
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : isCompleted
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-muted bg-background text-muted-foreground"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <StepIcon className="h-5 w-5" />
                              )}
                            </div>
                            <span className="text-xs font-medium mt-2 text-center">{step.name}</span>
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

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                      {/* Step 1: Product Details */}
                      {currentStep === 1 && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Name*</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Premium Yoga Mat, Office Chair, etc." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category*</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      const cat = categories.find(c => c.name === value);
                                      form.setValue("categoryId", cat?.id || null);
                                      form.setValue("subcategory", "");
                                      form.setValue("subcategoryId", null);
                                    }} 
                                    value={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                          {cat.icon && `${cat.icon} `}{cat.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="subcategory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Subcategory</FormLabel>
                                  <Select onValueChange={(value) => {
                                    field.onChange(value || "");
                                    const subcat = subcategories.find(s => s.name === value);
                                    form.setValue("subcategoryId", subcat?.id || null);
                                  }} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select subcategory" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {subcategories
                                        .filter(s => s.categoryId === form.watch("categoryId"))
                                        .map((subcat) => (
                                          <SelectItem key={subcat.id} value={subcat.name}>
                                            {subcat.icon && `${subcat.icon} `}{subcat.name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="brand"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Brand</FormLabel>
                                  <Select 
                                    onValueChange={(value) => {
                                      if (value === "custom") {
                                        field.onChange("");
                                        setTimeout(() => {
                                          const input = document.getElementById('custom-brand-input') as HTMLInputElement;
                                          input?.focus();
                                        }, 100);
                                      } else {
                                        field.onChange(value);
                                      }
                                    }} 
                                    value={field.value && uniqueBrandNames.includes(field.value) ? field.value : field.value ? "custom" : ""}
                                    disabled={!form.watch("categoryId")}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={form.watch("categoryId") ? "Select brand" : "Select category first"} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {uniqueBrandNames.map((brandName) => (
                                        <SelectItem key={brandName} value={brandName}>
                                          {brandName}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="custom">+ Add Custom Brand</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {(!field.value || !uniqueBrandNames.includes(field.value)) && (
                                    <FormControl>
                                      <Input
                                        id="custom-brand-input"
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        placeholder="Enter brand name"
                                        className="mt-2"
                                      />
                                    </FormControl>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {form.watch("categoryId") 
                                      ? "Select a brand from the list or enter a custom brand name"
                                      : "Please select a category first to see available brands"}
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit*</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
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
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="basePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base Price (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="e.g., 1999"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                            <FormField
                              control={form.control}
                              name="sellingPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Selling Price (₹)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                      placeholder="e.g., 1499"
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    The price at which the product will be sold
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="requiresPrescription"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm">Requires Prescription</FormLabel>
                                  <p className="text-xs text-muted-foreground">(Optional - for medical products)</p>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Step 2: Description & Specifications */}
                      {currentStep === 2 && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Description*</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    rows={5} 
                                    placeholder="Provide a detailed description of your product. Include key features, benefits, and any important information customers should know..." 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="specifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specifications</FormLabel>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Add product specifications (e.g., Material, Dimensions, Weight, etc.)
                                </p>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Input
                                      value={specInput}
                                      onChange={(e) => setSpecInput(e.target.value)}
                                      placeholder="e.g., Material: TPE, Dimensions: 183cm x 61cm"
                                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                                    />
                                    <Button type="button" onClick={addSpecification} variant="outline">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {field.value?.map((spec, index) => (
                                      <Badge key={index} variant="secondary" className="gap-1">
                                        {spec}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeSpecification(index)} />
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Add tags to help customers find your product (e.g., eco-friendly, premium, bestseller)
                                </p>
                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <Input
                                      value={tagInput}
                                      onChange={(e) => setTagInput(e.target.value)}
                                      placeholder="e.g., eco-friendly, premium, bestseller"
                                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    />
                                    <Button type="button" onClick={addTag} variant="outline">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {field.value?.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="gap-1">
                                        {tag}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator />

                          <FormField
                            control={form.control}
                            name="attributes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Attributes</FormLabel>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Add key-value attributes (e.g., Color: Red, Size: Large, Material: Cotton)
                                </p>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      value={attributeKey}
                                      onChange={(e) => setAttributeKey(e.target.value)}
                                      placeholder="Attribute key (e.g., Color)"
                                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                                    />
                                    <div className="flex gap-2">
                                      <Input
                                        value={attributeValue}
                                        onChange={(e) => setAttributeValue(e.target.value)}
                                        placeholder="Attribute value (e.g., Red)"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                                      />
                                      <Button type="button" onClick={addAttribute} variant="outline">
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {field.value?.map((attr, index) => (
                                      <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                        <Badge variant="secondary" className="font-semibold">
                                          {attr.key}
                                        </Badge>
                                        <span className="text-sm">:</span>
                                        <span className="text-sm flex-1">{attr.value}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeAttribute(index)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Step 3: Product Images & Status */}
                      {currentStep === 3 && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Product Images</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Upload up to 4 high-quality images of your product from your device. The first image will be used as the main product image.
                            </p>
                            <FormField
                              control={form.control}
                              name="images"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ProductImageUploaderDeviceOnly
                                      value={field.value || []}
                                      onChange={field.onChange}
                                      maxImages={4}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator />

                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Status*</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft - Save for later</SelectItem>
                                    <SelectItem value="published">Published - Make available to vendors</SelectItem>
                                    <SelectItem value="archived">Archived - Hide from listings</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Choose whether to publish this product immediately or save as draft
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between gap-2 pt-6 border-t">
                        <div>
                          {currentStep > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handlePrevious}
                            >
                              <ChevronLeft className="h-4 w-4 mr-2" />
                              Previous
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDialogClose(false)}
                          >
                            Cancel
                          </Button>
                          {currentStep < 3 ? (
                            <Button
                              type="button"
                              onClick={handleNext}
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              type="submit" 
                              disabled={createProductMutation.isPending || updateProductMutation.isPending}
                            >
                              {createProductMutation.isPending || updateProductMutation.isPending 
                                ? (editingProduct ? "Updating..." : "Creating...") 
                                : (editingProduct ? "Update Product" : "Create Product")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search products by name, brand, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </h2>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-6">
                    {/* Status Filter */}
                    <div>
                      <h3 className="font-medium text-sm mb-3">Status</h3>
                      <div className="space-y-2">
                        {["all", "published", "draft", "archived"].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={statusFilter === status}
                              onCheckedChange={() => {
                                setStatusFilter(status);
                                setCurrentPage(1);
                              }}
                            />
                            <label
                              htmlFor={`status-${status}`}
                              className="text-sm cursor-pointer capitalize"
                            >
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Categories Filter */}
                    <div>
                      <h3 className="font-medium text-sm mb-3">Categories</h3>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${cat.id}`}
                                checked={selectedCategories.includes(cat.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCategories([...selectedCategories, cat.id]);
                                  } else {
                                    setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                                    const subIds = subcategories.filter(s => s.categoryId === cat.id).map(s => s.id);
                                    setSelectedSubcategories(selectedSubcategories.filter(s => !subIds.includes(s)));
                                  }
                                  setCurrentPage(1);
                                }}
                              />
                              <label
                                htmlFor={`cat-${cat.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {cat.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <Separator />

                    {/* Subcategories Filter */}
                    {selectedCategories.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm mb-3">Subcategories</h3>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {availableSubcategories.map((sub) => (
                              <div key={sub.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`sub-${sub.id}`}
                                  checked={selectedSubcategories.includes(sub.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSubcategories([...selectedSubcategories, sub.id]);
                                    } else {
                                      setSelectedSubcategories(selectedSubcategories.filter(s => s !== sub.id));
                                    }
                                    setCurrentPage(1);
                                  }}
                                />
                                <label
                                  htmlFor={`sub-${sub.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {sub.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    <Separator />

                    {/* Price Range */}
                    <div>
                      <h3 className="font-medium text-sm mb-3">Price Range (₹)</h3>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={priceMin}
                          onChange={(e) => {
                            setPriceMin(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="h-9"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={priceMax}
                          onChange={(e) => {
                            setPriceMax(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Prescription Required */}
                    <div>
                      <h3 className="font-medium text-sm mb-3">Prescription</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="prescription-all"
                            checked={requiresPrescriptionFilter === undefined}
                            onCheckedChange={() => {
                              setRequiresPrescriptionFilter(undefined);
                              setCurrentPage(1);
                            }}
                          />
                          <label htmlFor="prescription-all" className="text-sm cursor-pointer">
                            All
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="prescription-required"
                            checked={requiresPrescriptionFilter === true}
                            onCheckedChange={() => {
                              setRequiresPrescriptionFilter(true);
                              setCurrentPage(1);
                            }}
                          />
                          <label htmlFor="prescription-required" className="text-sm cursor-pointer">
                            Required
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="prescription-not-required"
                            checked={requiresPrescriptionFilter === false}
                            onCheckedChange={() => {
                              setRequiresPrescriptionFilter(false);
                              setCurrentPage(1);
                            }}
                          />
                          <label htmlFor="prescription-not-required" className="text-sm cursor-pointer">
                            Not Required
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0" id="products-section">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg border p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={(val) => {
                  setSortBy(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    setCurrentPage(1);
                  }}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
              }>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-8 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg font-medium">No products found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search terms</p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </Card>
            ) : (
              <>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
                }>
                  {products.map((product) => {
                    const imageUrl = getProductImageUrl(product);
                    
                    return (
                      <Card
                        key={product.id}
                        className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white border border-gray-200 hover:border-primary/20"
                      >
                        {/* Product Image */}
                        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                // Fallback to icon if image fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-6xl">${product.icon}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                              {product.icon}
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-2">
                            {product.requiresPrescription && (
                              <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                                Rx Required
                              </Badge>
                            )}
                            {product.status === "draft" && (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                            {product.status === "archived" && (
                              <Badge variant="destructive">Archived</Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-2">
                          {/* Category Badge */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                            {product.brand && (
                              <Badge variant="outline" className="text-xs">
                                {product.brand}
                              </Badge>
                            )}
                          </div>

                          {/* Product Name */}
                          <h3 className="font-semibold text-base line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                            {product.description}
                          </p>

                          {/* Price */}
                          <div className="flex items-baseline gap-2 pt-2">
                            {product.basePrice ? (
                              <>
                                <span className="text-2xl font-bold text-gray-900">
                                  ₹{product.basePrice.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">/{product.unit}</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">Price not set</span>
                            )}
                          </div>

                          {/* Tags */}
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {product.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {product.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{product.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handlePreviewProduct(product)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDuplicateProduct(product)}
                              disabled={duplicateProductMutation.isPending}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Duplicate
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    
                    <span className="text-sm text-gray-600 ml-4">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <ProductDetailDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        product={previewProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              {productToDelete && ` "${productToDelete.name}"`} from the catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  deleteProductMutation.mutate(productToDelete.id);
                }
              }}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
