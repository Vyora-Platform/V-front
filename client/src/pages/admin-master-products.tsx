import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Package, Search, X, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type MasterProduct, type InsertMasterProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { type Category, type Subcategory, type Unit } from "@shared/schema";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import ProductDetailDialog from "@/components/ProductDetailDialog";

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
  unit: z.string().optional(),
  imageKeys: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  requiresPrescription: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  version: z.number().default(1),
});

type MasterProductFormData = z.infer<typeof masterProductFormSchema>;

export default function AdminMasterProducts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [specInput, setSpecInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<MasterProduct | null>(null);

  const { data: products = [], isLoading } = useQuery<MasterProduct[]>({
    queryKey: ["/api/admin/master-products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

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
      unit: "piece",
      imageKeys: [],
      images: [],
      requiresPrescription: false,
      status: 'draft',
      version: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MasterProductFormData) => {
      return await apiRequest("POST", "/api/admin/master-products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MasterProductFormData> }) => {
      return await apiRequest("PUT", `/api/admin/master-products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product updated successfully" });
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/master-products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const handleOpenDialog = (product?: MasterProduct) => {
    if (product) {
      setEditingProduct(product);
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
        unit: product.unit || "piece",
        imageKeys: product.imageKeys || [],
        images: product.images || [],
        requiresPrescription: product.requiresPrescription || false,
        status: (product.status || 'draft') as 'draft' | 'published' | 'archived',
        version: product.version,
      });
    } else {
      setEditingProduct(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (data: MasterProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'draft': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'archived': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-4">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Master Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage master product catalogue for vendors
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="border-b bg-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-products"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="snap-start shrink-0"
            data-testid="filter-status-all"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("published")}
            className="snap-start shrink-0"
            data-testid="filter-status-published"
          >
            Published
          </Button>
          <Button
            variant={statusFilter === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("draft")}
            className="snap-start shrink-0"
            data-testid="filter-status-draft"
          >
            Draft
          </Button>
          <Button
            variant={statusFilter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("archived")}
            className="snap-start shrink-0"
            data-testid="filter-status-archived"
          >
            Archived
          </Button>
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Master Product" : "Add Master Product"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Premium Yoga Mat" data-testid="input-product-name" />
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
                              
                              // Reset dependent fields when category changes
                              form.setValue("subcategory", "");
                              form.setValue("subcategoryId", null);
                              form.setValue("unit", "");
                            }} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
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
                              <SelectTrigger data-testid="select-subcategory">
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
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="e.g., Nike" data-testid="input-brand" />
                          </FormControl>
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
                              <SelectTrigger data-testid="select-unit">
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
                            data-testid="input-base-price"
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
                        <FormLabel>Description*</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Detailed product description..." data-testid="input-description" />
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
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={specInput}
                              onChange={(e) => setSpecInput(e.target.value)}
                              placeholder="e.g., Material: TPE, Thickness: 6mm"
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                              data-testid="input-add-spec"
                            />
                            <Button type="button" onClick={addSpecification} variant="outline" data-testid="button-add-spec">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {field.value?.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="gap-1" data-testid={`spec-${index}`}>
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
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              placeholder="e.g., eco-friendly, non-slip"
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                              data-testid="input-add-tag"
                            />
                            <Button type="button" onClick={addTag} variant="outline" data-testid="button-add-tag">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {field.value?.map((tag, index) => (
                              <Badge key={index} variant="outline" className="gap-1" data-testid={`tag-${index}`}>
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

                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Images</FormLabel>
                        <FormControl>
                          <ProductImageUploader
                            value={field.value || []}
                            onChange={field.onChange}
                            maxImages={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status*</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiresPrescription"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Requires Prescription</FormLabel>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                              data-testid="checkbox-prescription"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit"
                    >
                      {editingProduct ? "Update" : "Create"} Product
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground mt-4">No products found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                data-testid={`product-card-${product.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground truncate" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <Badge className={getStatusColor(product.status)} data-testid={`product-status-${product.id}`}>
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-secondary rounded">
                        {product.category}
                      </span>
                      {product.subcategory && (
                        <span className="px-2 py-1 bg-secondary rounded">
                          {product.subcategory}
                        </span>
                      )}
                      {product.basePrice && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                          ₹{product.basePrice}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-secondary rounded">
                        v{product.version}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setViewingProduct(product);
                        setDetailDialogOpen(true);
                      }}
                      data-testid={`button-view-${product.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteMutation.mutate(product.id)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        product={viewingProduct}
      />
    </div>
  );
}
