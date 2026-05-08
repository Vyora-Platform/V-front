import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Edit, Trash2, FolderTree, Layers, Ruler, ChevronDown, ChevronRight, Tag, Upload, Image as ImageIcon, ZoomIn } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, InsertCategory, Subcategory, InsertSubcategory, Brand, InsertBrand, Unit, InsertUnit } from "@shared/schema";
import { BrandLogoCropper } from "@/components/BrandLogoCropper";

export default function AdminMasterData() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Master Data Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create and manage global categories, subcategories, and units for all vendors
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderTree className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Categories & Subcategories</span>
            <span className="sm:hidden">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="brands" data-testid="tab-brands">
            <Tag className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Brands</span>
            <span className="sm:hidden">Brands</span>
          </TabsTrigger>
          <TabsTrigger value="units" data-testid="tab-units">
            <Ruler className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Units</span>
            <span className="sm:hidden">Unit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <HierarchicalCategoriesTab setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="brands">
          <BrandsTab />
        </TabsContent>

        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== HIERARCHICAL CATEGORIES TAB =====
function HierarchicalCategoriesTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<{ url: string; name: string } | null>(null);
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    logo: null as string | null,
  });

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: "",
    categoryId: "",
    logo: null as string | null,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created successfully" });
      resetCategoryForm();
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCategory> }) => {
      const response = await apiRequest("PATCH", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated successfully" });
      resetCategoryForm();
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async (data: InsertSubcategory) => {
      const response = await apiRequest("POST", "/api/subcategories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: "Subcategory created successfully" });
      resetSubcategoryForm();
    },
    onError: () => {
      toast({ title: "Failed to create subcategory", variant: "destructive" });
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSubcategory> }) => {
      const response = await apiRequest("PATCH", `/api/subcategories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: "Subcategory updated successfully" });
      resetSubcategoryForm();
    },
    onError: () => {
      toast({ title: "Failed to update subcategory", variant: "destructive" });
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/subcategories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      toast({ title: "Subcategory deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete subcategory", variant: "destructive" });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/brands/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete brand", variant: "destructive" });
    },
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", logo: null });
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const resetSubcategoryForm = () => {
    setSubcategoryFormData({ name: "", categoryId: "", logo: null });
    setEditingSubcategory(null);
    setIsSubcategoryDialogOpen(false);
    setSelectedCategoryForSubcategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      logo: category.logo || null,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      logo: subcategory.logo || null,
    });
    setIsSubcategoryDialogOpen(true);
  };

  const handleAddSubcategory = (categoryId: string) => {
    setSelectedCategoryForSubcategory(categoryId);
    setSubcategoryFormData({
      name: "",
      categoryId,
      logo: null,
    });
    setIsSubcategoryDialogOpen(true);
  };

  const handleSubmitCategory = () => {
    if (!categoryFormData.name.trim()) {
      toast({ title: "Please enter category name", variant: "destructive" });
      return;
    }

    const data: InsertCategory = {
      name: categoryFormData.name.trim(),
      logo: categoryFormData.logo,
      createdBy: "admin",
      isGlobal: true,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleSubmitSubcategory = () => {
    if (!subcategoryFormData.name.trim() || !subcategoryFormData.categoryId) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const data: InsertSubcategory = {
      name: subcategoryFormData.name.trim(),
      categoryId: subcategoryFormData.categoryId,
      logo: subcategoryFormData.logo,
      createdBy: "admin",
      isGlobal: true,
    };

    if (editingSubcategory) {
      updateSubcategoryMutation.mutate({ id: editingSubcategory.id, data });
    } else {
      createSubcategoryMutation.mutate(data);
    }
  };

  const getCategorySubcategories = (categoryId: string) => {
    return subcategories.filter(sub => sub.categoryId === categoryId);
  };

  const getCategoryBrands = (categoryId: string) => {
    return brands.filter(brand => brand.categoryId === categoryId);
  };

  const totalSubcategories = subcategories.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? "category" : "categories"}, {totalSubcategories} {totalSubcategories === 1 ? "subcategory" : "subcategories"}
        </p>
        <Button
          onClick={() => setIsCategoryDialogOpen(true)}
          size="sm"
          data-testid="button-create-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Hierarchical Category List */}
      <div className="space-y-2">
        {categories.map((category) => {
          const categorySubcategories = getCategorySubcategories(category.id);
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="space-y-2">
              {/* Category Card */}
              <Card className="p-4" data-testid={`card-category-${category.id}`}>
                <div className="flex items-start gap-3">
                  {/* Expand/Collapse Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(category.id)}
                    className="p-0 h-8 w-8 flex-shrink-0"
                    data-testid={`button-toggle-${category.id}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </Button>

                  {/* Logo */}
                  <div className="flex-shrink-0 relative group">
                    {category.logo ? (
                      <div 
                        className="w-16 h-16 rounded-full border-2 border-gray-300 overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors relative"
                        onClick={() => setPreviewLogo({ url: category.logo!, name: category.name })}
                      >
                        <img src={category.logo} alt={category.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <FolderTree className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg" data-testid={`text-category-name-${category.id}`}>
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {categorySubcategories.length} {categorySubcategories.length === 1 ? "subcategory" : "subcategories"}
                        </p>
                      </div>
                      <Badge variant={category.isGlobal ? "default" : "secondary"}>
                        {category.isGlobal ? "Global" : "Custom"}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubcategory(category.id)}
                      data-testid={`button-add-subcategory-${category.id}`}
                      title="Add Subcategory"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      data-testid={`button-delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Subcategories and Brands (nested) */}
              {isExpanded && (categorySubcategories.length > 0 || getCategoryBrands(category.id).length > 0) && (
                <div className="ml-12 space-y-3">
                  {/* Subcategories */}
                  {categorySubcategories.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Subcategories ({categorySubcategories.length})
                      </h5>
                      {categorySubcategories.map((subcategory) => (
                        <Card key={subcategory.id} className="p-3 bg-muted/30" data-testid={`card-subcategory-${subcategory.id}`}>
                          <div className="flex items-start gap-3">
                            {/* Logo */}
                            <div className="flex-shrink-0 relative group">
                              {subcategory.logo ? (
                                <div 
                                  className="w-14 h-14 rounded-full border-2 border-gray-300 overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors relative"
                                  onClick={() => setPreviewLogo({ url: subcategory.logo!, name: subcategory.name })}
                                >
                                  <img src={subcategory.logo} alt={subcategory.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <Layers className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Subcategory Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium" data-testid={`text-subcategory-name-${subcategory.id}`}>
                                    {subcategory.name}
                                  </h4>
                                </div>
                                <Badge variant={subcategory.isGlobal ? "default" : "secondary"} className="text-xs">
                                  {subcategory.isGlobal ? "Global" : "Custom"}
                                </Badge>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSubcategory(subcategory)}
                                data-testid={`button-edit-subcategory-${subcategory.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteSubcategoryMutation.mutate(subcategory.id)}
                                data-testid={`button-delete-subcategory-${subcategory.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Brands */}
                  {getCategoryBrands(category.id).length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Brands ({getCategoryBrands(category.id).length})
                      </h5>
                      {getCategoryBrands(category.id).map((brand) => (
                        <Card key={brand.id} className="p-3 bg-blue-50/30 dark:bg-blue-950/20" data-testid={`card-brand-${brand.id}`}>
                          <div className="flex items-start gap-3">
                            {/* Logo */}
                            <div className="flex-shrink-0 relative group">
                              {brand.logo ? (
                                <div 
                                  className="w-14 h-14 rounded-full border-2 border-gray-300 overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors relative"
                                  onClick={() => setPreviewLogo({ url: brand.logo!, name: brand.name })}
                                >
                                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <Tag className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            {/* Brand Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium flex items-center gap-2" data-testid={`text-brand-name-${brand.id}`}>
                                    <Tag className="w-3 h-3 text-muted-foreground" />
                                    {brand.name}
                                  </h4>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveTab("brands");
                                  // Small delay to ensure tab switch completes
                                  setTimeout(() => {
                                    const editBtn = document.querySelector(`[data-testid="button-edit-brand-${brand.id}"]`) as HTMLElement;
                                    if (editBtn) {
                                      editBtn.click();
                                    }
                                  }, 200);
                                }}
                                data-testid={`button-edit-brand-${brand.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBrandMutation.mutate(brand.id)}
                                data-testid={`button-delete-brand-${brand.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="e.g., Products, Services, Equipment"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <Label htmlFor="category-logo">Category Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a logo and adjust it to fit perfectly (round shape)
              </p>
              <div className="mt-2">
                <BrandLogoCropper
                  value={categoryFormData.logo}
                  onChange={(logo) => setCategoryFormData({ ...categoryFormData, logo })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetCategoryForm} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmitCategory} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                {editingCategory ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? "Edit Subcategory" : "Create New Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcategory-category">Parent Category *</Label>
              <Select
                value={subcategoryFormData.categoryId}
                onValueChange={(value) => setSubcategoryFormData({ ...subcategoryFormData, categoryId: value })}
              >
                <SelectTrigger id="subcategory-category" data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory-name">Subcategory Name *</Label>
              <Input
                id="subcategory-name"
                value={subcategoryFormData.name}
                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                placeholder="e.g., Stationery, Consultation, Tools"
                data-testid="input-subcategory-name"
              />
            </div>
            <div>
              <Label htmlFor="subcategory-logo">Subcategory Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a logo and adjust it to fit perfectly (round shape)
              </p>
              <div className="mt-2">
                <BrandLogoCropper
                  value={subcategoryFormData.logo}
                  onChange={(logo) => setSubcategoryFormData({ ...subcategoryFormData, logo })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetSubcategoryForm} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmitSubcategory} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                {editingSubcategory ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logo Preview Dialog */}
      <Dialog open={!!previewLogo} onOpenChange={(open) => !open && setPreviewLogo(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Logo Preview</DialogTitle>
          </DialogHeader>
          {previewLogo && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg">
                <div className="w-48 h-48 rounded-full border-4 border-primary overflow-hidden bg-white shadow-lg">
                  <img 
                    src={previewLogo.url} 
                    alt={previewLogo.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <p className="mt-4 text-lg font-semibold">{previewLogo.name}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setPreviewLogo(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



// ===== BRANDS TAB =====
function BrandsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [previewLogo, setPreviewLogo] = useState<{ url: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    logo: null as string | null,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBrand) => {
      const response = await apiRequest("POST", "/api/brands", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to create brand");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Brand creation error:", error);
      toast({ 
        title: "Failed to create brand", 
        description: error.message || "Please check the console for details",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBrand> }) => {
      const response = await apiRequest("PATCH", `/api/brands/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to update brand");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      console.error("Brand update error:", error);
      toast({ 
        title: "Failed to update brand", 
        description: error.message || "Please check the console for details",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/brands/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete brand", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", categoryId: "", logo: null });
    setEditingBrand(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      categoryId: brand.categoryId,
      logo: brand.logo,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.categoryId) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const data: InsertBrand = {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      logo: formData.logo,
    };

    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  // Group brands by category
  const brandsByCategory = brands.reduce((acc, brand) => {
    const categoryName = getCategoryName(brand.categoryId);
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {brands.length} {brands.length === 1 ? "brand" : "brands"}
        </p>
        <Button
          onClick={() => setIsDialogOpen(true)}
          size="sm"
          data-testid="button-create-brand"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {Object.keys(brandsByCategory).length === 0 ? (
        <Card className="p-8 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No brands found. Create your first brand!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(brandsByCategory).map(([categoryName, categoryBrands]) => (
            <div key={categoryName} className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5" />
                {categoryName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categoryBrands.map((brand) => (
                  <Card key={brand.id} className="p-4" data-testid={`card-brand-${brand.id}`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`text-brand-name-${brand.id}`}>
                            {brand.name}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(brand)}
                            data-testid={`button-edit-brand-${brand.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(brand.id)}
                            data-testid={`button-delete-brand-${brand.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {brand.logo ? (
                        <div 
                          className="w-24 h-24 mx-auto rounded-full border-2 border-gray-300 overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors relative group"
                          onClick={() => setPreviewLogo({ url: brand.logo!, name: brand.name })}
                        >
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-muted">
                          <Tag className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Edit Brand" : "Create New Brand"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="brand-category" data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brand-name">Brand Name *</Label>
              <Input
                id="brand-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nike, Samsung, Apple"
                data-testid="input-brand-name"
              />
            </div>
            <div>
              <Label htmlFor="brand-logo">Brand Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a logo and adjust it to fit perfectly (round shape)
              </p>
              <div className="mt-2">
                <BrandLogoCropper
                  value={formData.logo}
                  onChange={(logo) => setFormData({ ...formData, logo })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmit} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                {editingBrand ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logo Preview Dialog */}
      <Dialog open={!!previewLogo} onOpenChange={(open) => !open && setPreviewLogo(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Brand Logo Preview</DialogTitle>
          </DialogHeader>
          {previewLogo && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg">
                <div className="w-48 h-48 rounded-full border-4 border-primary overflow-hidden bg-white shadow-lg">
                  <img 
                    src={previewLogo.url} 
                    alt={previewLogo.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <p className="mt-4 text-lg font-semibold">{previewLogo.name}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setPreviewLogo(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== UNITS TAB =====
function UnitsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    subcategoryId: undefined as string | undefined,
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertUnit) => {
      const response = await apiRequest("POST", "/api/units", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Unit created successfully" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create unit", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUnit> }) => {
      const response = await apiRequest("PATCH", `/api/units/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Unit updated successfully" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update unit", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/units/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Unit deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete unit", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", subcategoryId: undefined });
    setEditingUnit(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      subcategoryId: unit.subcategoryId,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.subcategoryId?.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const data: InsertUnit = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      subcategoryId: formData.subcategoryId,
      createdBy: "admin",
      isGlobal: true,
    };

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getSubcategoryName = (subcategoryId: string) => {
    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    if (!subcategory) return "Unknown";
    const category = categories.find((c) => c.id === subcategory.categoryId);
    return `${category?.name || "Unknown"} → ${subcategory.name}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {units.length} {units.length === 1 ? "unit" : "units"}
        </p>
        <Button
          onClick={() => setIsDialogOpen(true)}
          size="sm"
          data-testid="button-create-unit"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {units.map((unit) => (
          <Card key={unit.id} className="p-4" data-testid={`card-unit-${unit.id}`}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">
                    {getSubcategoryName(unit.subcategoryId)}
                  </div>
                  <h3 className="font-semibold text-lg" data-testid={`text-unit-name-${unit.id}`}>
                    {unit.name} <span className="text-sm text-muted-foreground">({unit.code})</span>
                  </h3>
                </div>
                <Badge variant={unit.isGlobal ? "default" : "secondary"}>
                  {unit.isGlobal ? "Global" : "Custom"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(unit)}
                  data-testid={`button-edit-unit-${unit.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(unit.id)}
                  data-testid={`button-delete-unit-${unit.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Unit" : "Create New Unit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit-subcategory">Subcategory *</Label>
              <Select
                value={formData.subcategoryId || ""}
                onValueChange={(value) => setFormData({ ...formData, subcategoryId: value })}
              >
                <SelectTrigger id="unit-subcategory" data-testid="select-subcategory">
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {getSubcategoryName(subcategory.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit-name">Unit Name *</Label>
              <Input
                id="unit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Pieces, Kilograms, Hours"
                data-testid="input-unit-name"
              />
            </div>
            <div>
              <Label htmlFor="unit-code">Unit Code *</Label>
              <Input
                id="unit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., pcs, kg, hr"
                data-testid="input-unit-code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Short code used for display (e.g., "pcs" for Pieces)
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmit} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                {editingUnit ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
