import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FolderTree, Search, Filter, X, Layers, Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorId } from "@/hooks/useVendor";
import { BrandLogoCropper } from "@/components/BrandLogoCropper";

interface Category {
  id: string;
  name: string;
  logo?: string;
  isGlobal?: boolean;
  createdBy?: string;
  createdAt: string;
}

interface Subcategory {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  logo?: string;
  isGlobal?: boolean;
  createdBy?: string;
  createdAt: string;
}

export default function VendorCategories() {
  const vendorId = useVendorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "master" | "custom">("all");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'subcategory'; id: string; name: string } | null>(null);

  const [categoryForm, setCategoryForm] = useState({ name: "", logo: null as string | null });
  const [subcategoryForm, setSubcategoryForm] = useState({ categoryId: "", name: "", logo: null as string | null });

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories, error: categoriesError } = useQuery<Category[]>({
    queryKey: [`/api/categories?vendorId=${vendorId}`],
    enabled: !!vendorId,
  });

  // Fetch subcategories
  const { data: subcategories = [], isLoading: loadingSubcategories, error: subcategoriesError } = useQuery<Subcategory[]>({
    queryKey: [`/api/subcategories?vendorId=${vendorId}`],
    enabled: !!vendorId,
  });

  // Filter categories
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = 
      typeFilter === "all" || 
      (typeFilter === "master" && cat.isGlobal) || 
      (typeFilter === "custom" && !cat.isGlobal);
    return matchesSearch && matchesType;
  });

  // Filter subcategories
  const filteredSubcategories = subcategories.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = 
      typeFilter === "all" || 
      (typeFilter === "master" && sub.isGlobal) || 
      (typeFilter === "custom" && !sub.isGlobal);
    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    totalCategories: categories.length,
    customCategories: categories.filter(c => !c.isGlobal).length,
    masterCategories: categories.filter(c => c.isGlobal).length,
    totalSubcategories: subcategories.length,
    customSubcategories: subcategories.filter(s => !s.isGlobal).length,
    masterSubcategories: subcategories.filter(s => s.isGlobal).length,
  };

  // Create/Update Category Mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : `/api/categories`;
      const method = editingCategory ? "PATCH" : "POST";

      const payload = {
        ...data,
        createdBy: vendorId,
        isGlobal: false,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.message || error.error || "Failed to save category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories?vendorId=${vendorId}`] });
      toast({
        title: editingCategory ? "Category Updated" : "Category Created",
        description: `Category has been ${editingCategory ? "updated" : "created"} successfully.`,
      });
      setCategoryDialogOpen(false);
      setCategoryForm({ name: "", logo: null });
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save category. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create/Update Subcategory Mutation
  const subcategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingSubcategory
        ? `/api/subcategories/${editingSubcategory.id}`
        : `/api/subcategories`;
      const method = editingSubcategory ? "PATCH" : "POST";

      const payload = {
        ...data,
        createdBy: vendorId,
        isGlobal: false,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.message || error.error || "Failed to save subcategory");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subcategories?vendorId=${vendorId}`] });
      toast({
        title: editingSubcategory ? "Subcategory Updated" : "Subcategory Created",
        description: `Subcategory has been ${editingSubcategory ? "updated" : "created"} successfully.`,
      });
      setSubcategoryDialogOpen(false);
      setSubcategoryForm({ categoryId: "", name: "", logo: null });
      setEditingSubcategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save subcategory. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: { type: 'category' | 'subcategory'; id: string }) => {
      const url = item.type === 'category'
        ? `/api/categories/${item.id}`
        : `/api/subcategories/${item.id}`;
      
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete ${item.type}`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.type === 'category'
        ? [`/api/categories?vendorId=${vendorId}`]
        : [`/api/subcategories?vendorId=${vendorId}`];
      
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Deleted Successfully",
        description: `${variables.type === 'category' ? 'Category' : 'Subcategory'} has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete. It may be in use or you don't have permission.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = () => {
    const actionCheck = canPerformAction('create');
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingCategory(null);
    setCategoryForm({ name: "", logo: null });
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    const actionCheck = canPerformAction('update');
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingCategory(category);
    setCategoryForm({ 
      name: category.name, 
      logo: category.logo || null
    });
    setCategoryDialogOpen(true);
  };

  const handleCreateSubcategory = () => {
    const actionCheck = canPerformAction('create');
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingSubcategory(null);
    setSubcategoryForm({ categoryId: "", name: "", logo: null });
    setSubcategoryDialogOpen(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    const actionCheck = canPerformAction('update');
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingSubcategory(subcategory);
    setSubcategoryForm({ 
      categoryId: subcategory.categoryId,
      name: subcategory.name, 
      logo: subcategory.logo || null
    });
    setSubcategoryDialogOpen(true);
  };

  const handleDelete = (type: 'category' | 'subcategory', id: string, name: string) => {
    const actionCheck = canPerformAction('delete');
    if (!actionCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    setDeletingItem({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground mt-1">
            Organize your products and services with categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateCategory} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Category
            {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
          </Button>
          <Button onClick={handleCreateSubcategory} variant="outline" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Subcategory
            {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.customCategories} custom · {stats.masterCategories} master
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subcategories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSubcategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.customSubcategories} custom · {stats.masterSubcategories} master
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custom Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.customCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Categories you've created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories or subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="master">Master Only</SelectItem>
                <SelectItem value="custom">Custom Only</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || typeFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error States */}
      {(categoriesError || subcategoriesError) && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive font-semibold mb-2">Error Loading Data</p>
              <p className="text-sm text-muted-foreground mb-4">
                The categories tables may not exist in your database yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Please run the migration file: <code className="bg-muted px-2 py-1 rounded">migrations/0004_create_categories_subcategories.sql</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Categories and Subcategories */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Categories ({filteredCategories.length})
          </TabsTrigger>
          <TabsTrigger value="subcategories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Subcategories ({filteredSubcategories.length})
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Master categories and your custom categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderTree className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery || typeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first category to get started"}
                  </p>
                  {!searchQuery && typeFilter === "all" && (
                    <Button onClick={handleCreateCategory} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Category
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            {category.logo ? (
                              <div className="w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden bg-muted">
                                <img src={category.logo} alt={category.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <FolderTree className="w-6 h-6 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>
                            <Badge variant={category.isGlobal ? "secondary" : "default"}>
                              {category.isGlobal ? "Master" : "Custom"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!category.isGlobal && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete('category', category.id, category.name)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subcategories Tab */}
        <TabsContent value="subcategories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subcategories</CardTitle>
              <CardDescription>
                Subcategories organized under categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubcategories ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredSubcategories.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No subcategories found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery || typeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first subcategory to get started"}
                  </p>
                  {!searchQuery && typeFilter === "all" && (
                    <Button onClick={handleCreateSubcategory} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Subcategory
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Logo</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubcategories.map((subcategory) => (
                        <TableRow key={subcategory.id}>
                          <TableCell>
                            {subcategory.logo ? (
                              <div className="w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden bg-muted">
                                <img src={subcategory.logo} alt={subcategory.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <Layers className="w-6 h-6 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {subcategory.categoryName || categories.find(c => c.id === subcategory.categoryId)?.name || "-"}
                          </TableCell>
                          <TableCell className="font-medium">{subcategory.name}</TableCell>
                          <TableCell>
                            <Badge variant={subcategory.isGlobal ? "secondary" : "default"}>
                              {subcategory.isGlobal ? "Master" : "Custom"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!subcategory.isGlobal && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSubcategory(subcategory)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete('subcategory', subcategory.id, subcategory.name)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Update your category details below" 
                : "Add a new custom category for your business"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Electronics, Apparel"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-logo">Category Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a logo and adjust it to fit perfectly (round shape)
              </p>
              <div className="mt-2">
                <BrandLogoCropper
                  value={categoryForm.logo}
                  onChange={(logo) => setCategoryForm({ ...categoryForm, logo })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCategoryDialogOpen(false)}
              disabled={categoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => categoryMutation.mutate(categoryForm)}
              disabled={!categoryForm.name.trim() || categoryMutation.isPending}
            >
              {categoryMutation.isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryDialogOpen} onOpenChange={setSubcategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Create New Subcategory"}</DialogTitle>
            <DialogDescription>
              {editingSubcategory 
                ? "Update your subcategory details below" 
                : "Add a new subcategory under a parent category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subcat-category">
                Parent Category <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={subcategoryForm.categoryId} 
                onValueChange={(value) => setSubcategoryForm({ ...subcategoryForm, categoryId: value })}
              >
                <SelectTrigger id="subcat-category">
                  <SelectValue placeholder="Select a parent category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcat-name">
                Subcategory Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subcat-name"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                placeholder="e.g., Smartphones, T-Shirts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcat-logo">Subcategory Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a logo and adjust it to fit perfectly (round shape)
              </p>
              <div className="mt-2">
                <BrandLogoCropper
                  value={subcategoryForm.logo}
                  onChange={(logo) => setSubcategoryForm({ ...subcategoryForm, logo })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSubcategoryDialogOpen(false)}
              disabled={subcategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => subcategoryMutation.mutate(subcategoryForm)}
              disabled={!subcategoryForm.name.trim() || !subcategoryForm.categoryId || subcategoryMutation.isPending}
            >
              {subcategoryMutation.isPending ? "Saving..." : editingSubcategory ? "Update Subcategory" : "Create Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingItem?.name}</strong>.
              {deletingItem?.type === 'category' && (
                <span className="block mt-2 text-destructive">
                  Warning: All subcategories and items under this category may be affected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action="create"
        onUpgrade={() => {
          setShowUpgradeModal(false);
          setLocation('/vendor/account');
        }}
      />
    </div>
  );
}
