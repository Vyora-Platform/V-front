import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Search, TrendingUp, Eye, EyeOff, 
  ChevronLeft, ChevronRight, Download, Share2, Sparkles, FolderOpen, 
  LayoutGrid, Loader2, Power, PowerOff, ArrowLeft
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { GreetingTemplate, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getApiUrl } from "@/lib/config";
import { useLocation } from "wouter";

// Simplified schema for template creation
const templateFormSchema = z.object({
  templateCategoryId: z.string().min(1, "Template category is required"),
  businessCategories: z.array(z.string()).min(1, "Select at least one business category"),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// Available icons for categories
const availableIcons = [
  { value: "Sparkles", label: "Sparkles" },
  { value: "Gift", label: "Gift" },
  { value: "Calendar", label: "Calendar" },
  { value: "Tag", label: "Tag" },
  { value: "TrendingUp", label: "Trending" },
  { value: "Star", label: "Star" },
  { value: "Megaphone", label: "Megaphone" },
  { value: "PartyPopper", label: "Party" },
  { value: "Heart", label: "Heart" },
  { value: "ShoppingBag", label: "Shopping" },
  { value: "Bell", label: "Bell" },
  { value: "Sun", label: "Sun" },
  { value: "Moon", label: "Moon" },
  { value: "Camera", label: "Camera" },
];

// Available colors for categories
const availableColors = [
  { value: "#EF4444", label: "Red" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#10B981", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#F97316", label: "Amber" },
];

// Template Form Component
interface TemplateFormProps {
  template?: GreetingTemplate;
  templateCategories: any[];
  businessCategories: Category[];
  onSubmit: (data: any) => void;
  isPending: boolean;
  onClose: () => void;
}

function TemplateForm({ template, templateCategories, businessCategories, onSubmit, isPending, onClose }: TemplateFormProps) {
  const { toast } = useToast();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(template?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(template?.imageUrl || null);
  const [selectedBusinessCategories, setSelectedBusinessCategories] = useState<string[]>(
    template?.industries || []
  );
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>(
    (template as any)?.categoryId || ""
  );

  const handleImageChange = async (file: File | null) => {
    setSelectedImageFile(file);
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase S3
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(getApiUrl("/api/greeting-templates/upload-image"), {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setUploadedImageUrl(result.url);
        } else {
          toast({ title: "Failed to upload image", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({ title: "Error uploading image", variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    } else {
      setImagePreview(template?.imageUrl || null);
      setUploadedImageUrl(template?.imageUrl || null);
    }
  };

  const toggleBusinessCategory = (categoryId: string) => {
    setSelectedBusinessCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedImageUrl && !template?.imageUrl) {
      toast({ title: "Please upload a template image", variant: "destructive" });
      return;
    }
    
    if (!selectedTemplateCategory) {
      toast({ title: "Please select a template category", variant: "destructive" });
      return;
    }
    
    if (selectedBusinessCategories.length === 0) {
      toast({ title: "Please select at least one business category", variant: "destructive" });
      return;
    }

    const selectedCategory = templateCategories.find(c => c.id === selectedTemplateCategory);
    
    const submitData = {
      title: selectedCategory?.name || "Template",
      description: "",
      imageUrl: uploadedImageUrl || template?.imageUrl,
      thumbnailUrl: uploadedImageUrl || template?.imageUrl,
      categoryId: selectedTemplateCategory,
      industries: selectedBusinessCategories,
      occasions: [],
      offerTypes: [],
      hasEditableText: true,
      supportsLogo: true,
      supportsProducts: false,
      supportsServices: false,
      supportsOffers: false,
      includesPlatformBranding: true,
      isTrending: false,
      status: "published", // Default to published
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Image Upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Template Image *</Label>
        
        {imagePreview && (
          <div className="relative w-full aspect-[4/3] bg-muted rounded-xl overflow-hidden border-2 border-border">
            <img
              src={imagePreview}
              alt="Template preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
            {uploadedImageUrl && !isUploading && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded-md">
                ✓ Uploaded
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setSelectedImageFile(null);
                setImagePreview(null);
                setUploadedImageUrl(null);
              }}
            >
              Remove
            </Button>
          </div>
        )}
        
        <Input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleImageChange(file || null);
          }}
          className="cursor-pointer h-12"
          disabled={isUploading}
        />
      </div>

      {/* Template Category */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Template Category *</Label>
        <Select value={selectedTemplateCategory} onValueChange={setSelectedTemplateCategory}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select template category" />
          </SelectTrigger>
          <SelectContent>
            {templateCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {templateCategories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No template categories found. Create one in the Category Management section below.
          </p>
        )}
      </div>

      {/* Business Categories - Multi Select */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Business Categories * (Multi-select)</Label>
        <div className="flex flex-wrap gap-2 p-4 border rounded-xl bg-muted/30 max-h-60 overflow-y-auto">
          {businessCategories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedBusinessCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/20 transition-colors py-2 px-4 text-sm"
              onClick={() => toggleBusinessCategory(category.id)}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          ))}
        </div>
        {selectedBusinessCategories.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedBusinessCategories.length} selected
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || isUploading} className="h-12 px-6">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : template ? "Update Template" : "Publish Template"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminGreetingTemplates() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<GreetingTemplate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedBusinessCategoryFilter, setSelectedBusinessCategoryFilter] = useState<string>("");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates"],
  });

  // Fetch template categories (poster categories)
  const { data: templateCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/poster-categories"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/poster-categories"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch business categories from master data
  const { data: businessCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (searchQuery && !template.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status tab filter
    if (activeTab === "published" && template.status !== "published") return false;
    if (activeTab === "inactive" && template.status !== "archived") return false;
    if (activeTab === "trending" && !template.isTrending) return false;
    
    // Business category filter
    if (selectedBusinessCategoryFilter && !template.industries.includes(selectedBusinessCategoryFilter)) {
      return false;
    }
    
    return true;
  });

  // Scroll category filter
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/greeting-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      setIsAddDialogOpen(false);
      toast({ title: "Template published successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/greeting-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      setEditingTemplate(null);
      toast({ title: "Template updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/greeting-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/greeting-templates/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      toast({ title: "Template status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Delete all templates one by one
      const deletePromises = templates.map(t => apiRequest("DELETE", `/api/greeting-templates/${t.id}`));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      toast({ title: "All templates deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete all templates", variant: "destructive" });
    },
  });

  // Stats
  const stats = {
    total: templates.length,
    published: templates.filter(t => t.status === "published").length,
    inactive: templates.filter(t => t.status === "archived").length,
    trending: templates.filter(t => t.isTrending).length,
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/dashboard')} className="md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold">Greeting Templates</h1>
              <p className="text-muted-foreground text-sm">Create and manage marketing templates</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {templates.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Templates?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {templates.length} templates. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteAllMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex-1 sm:flex-none h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <EyeOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Trending</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.trending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Business Category Filter - Horizontal Scrolling */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0 h-10 w-10 rounded-lg border-2"
              onClick={() => scrollCategories('left')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div 
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setSelectedBusinessCategoryFilter("")}
                className={`shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  selectedBusinessCategoryFilter === ""
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-gray-200 hover:border-blue-300 dark:border-gray-700"
                }`}
              >
                All Categories
              </button>
              {businessCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedBusinessCategoryFilter(category.id)}
                  className={`shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all whitespace-nowrap ${
                    selectedBusinessCategoryFilter === category.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-200 hover:border-blue-300 dark:border-gray-700"
                  }`}
                >
                  {category.icon && <span className="mr-1">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0 h-10 w-10 rounded-lg border-2"
              onClick={() => scrollCategories('right')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-4 h-12">
            <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
            <TabsTrigger value="published" className="text-sm">Active</TabsTrigger>
            <TabsTrigger value="inactive" className="text-sm">Inactive</TabsTrigger>
            <TabsTrigger value="trending" className="text-sm">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No templates found</p>
                  <p className="text-sm mt-1">Create your first template to get started</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="group overflow-hidden hover:shadow-lg transition-shadow rounded-xl">
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={template.thumbnailUrl || template.imageUrl}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge 
                          variant={template.status === "published" ? "default" : "secondary"}
                          className={template.status === "published" ? "bg-green-500" : "bg-gray-500"}
                        >
                          {template.status === "published" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {/* Trending Badge */}
                      {template.isTrending && (
                        <Badge className="absolute top-2 right-2 bg-purple-500">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleStatusMutation.mutate({
                            id: template.id,
                            status: template.status === "published" ? "archived" : "published"
                          })}
                          title={template.status === "published" ? "Deactivate" : "Activate"}
                        >
                          {template.status === "published" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this template. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(template.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{template.title}</h3>
                      <div className="flex flex-wrap gap-1">
                        {template.industries.slice(0, 2).map((industry) => {
                          const category = businessCategories.find(c => c.id === industry);
                          return (
                            <Badge key={industry} variant="outline" className="text-xs">
                              {category?.name || industry}
                            </Badge>
                          );
                        })}
                        {template.industries.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.industries.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {template.downloadCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {template.shareCount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Template Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>Upload a template image and assign categories</DialogDescription>
            </DialogHeader>
            <TemplateForm
              templateCategories={templateCategories}
              businessCategories={businessCategories}
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
              onClose={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>Update template details</DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <TemplateForm
                template={editingTemplate}
                templateCategories={templateCategories}
                businessCategories={businessCategories}
                onSubmit={(data) => updateMutation.mutate({ id: editingTemplate.id, data })}
                isPending={updateMutation.isPending}
                onClose={() => setEditingTemplate(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Category Management Section */}
        <CategoryManagement />
      </div>
    </div>
  );
}

// Category Management Component
function CategoryManagement() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "Sparkles", color: "#3B82F6", description: "" });

  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/poster-categories"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/poster-categories"));
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/poster-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/poster-categories"] });
      setIsAddOpen(false);
      setNewCategory({ name: "", icon: "Sparkles", color: "#3B82F6", description: "" });
      toast({ title: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/poster-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/poster-categories"] });
      setEditingCategory(null);
      toast({ title: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/poster-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/poster-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            Categories
          </h2>
          <p className="text-muted-foreground text-sm">Custom categories for organizing templates</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto h-10">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No categories created yet</p>
            <p className="text-sm">Create your first category to organize templates</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category: any) => (
            <Card key={category.id} className="group overflow-hidden hover:shadow-lg transition-all rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingCategory({ ...category })}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this category. Templates using this category will need to be reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <h3 className="font-semibold text-sm line-clamp-1">{category.name}</h3>
                {category.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{category.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a custom category for templates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g., Diwali Specials"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="mt-1 h-12"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Brief description..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="mt-1 h-12"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newCategory.color === color.value
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1 h-12">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!newCategory.name.trim()) {
                    toast({ title: "Category name is required", variant: "destructive" });
                    return;
                  }
                  createCategoryMutation.mutate(newCategory);
                }}
                disabled={createCategoryMutation.isPending}
                className="flex-1 h-12"
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 pt-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  placeholder="e.g., Diwali Specials"
                  value={editingCategory.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Brief description..."
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {availableColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        editingCategory.color === color.value
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingCategory(null)} className="flex-1 h-12">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (!editingCategory?.name?.trim()) {
                      toast({ title: "Category name is required", variant: "destructive" });
                      return;
                    }
                    updateCategoryMutation.mutate({ id: editingCategory.id, data: editingCategory });
                  }}
                  disabled={updateCategoryMutation.isPending}
                  className="flex-1 h-12"
                >
                  {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
