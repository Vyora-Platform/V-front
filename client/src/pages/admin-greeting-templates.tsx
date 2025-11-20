import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Image as ImageIcon, Search, TrendingUp, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGreetingTemplateSchema, type GreetingTemplate, type InsertGreetingTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Extended schema for file upload
const greetingTemplateFormSchema = insertGreetingTemplateSchema.extend({
  imageFile: z.instanceof(File).optional(),
  thumbnailFile: z.instanceof(File).optional(),
});

type GreetingTemplateFormData = z.infer<typeof greetingTemplateFormSchema>;

// Filter options
const occasionOptions = [
  { value: "diwali", label: "Diwali" },
  { value: "christmas", label: "Christmas" },
  { value: "eid", label: "Eid" },
  { value: "holi", label: "Holi" },
  { value: "new_year", label: "New Year" },
  { value: "independence_day", label: "Independence Day" },
  { value: "republic_day", label: "Republic Day" },
  { value: "raksha_bandhan", label: "Raksha Bandhan" },
  { value: "navratri", label: "Navratri" },
  { value: "pongal", label: "Pongal" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "grand_opening", label: "Grand Opening" },
  { value: "festival", label: "Festival (Generic)" },
];

const offerTypeOptions = [
  { value: "flat_discount", label: "Flat Discount" },
  { value: "bogo", label: "Buy One Get One" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "new_product_launch", label: "New Product Launch" },
  { value: "membership_offer", label: "Membership Offer" },
  { value: "referral_campaign", label: "Referral Campaign" },
  { value: "seasonal_clearance", label: "Seasonal Clearance" },
  { value: "free_trial", label: "Free Trial" },
];

const industryOptions = [
  { value: "fitness", label: "Fitness & Gym" },
  { value: "yoga", label: "Yoga & Wellness" },
  { value: "salon", label: "Salon & Spa" },
  { value: "clinic", label: "Clinic & Lab" },
  { value: "library", label: "Library & Coaching" },
  { value: "restaurant", label: "Restaurant & Cafe" },
  { value: "retail", label: "Retail Shop" },
  { value: "electronics", label: "Electronics" },
  { value: "real_estate", label: "Real Estate" },
  { value: "pet_care", label: "Pet Care" },
  { value: "automotive", label: "Automotive" },
  { value: "grocery", label: "Grocery" },
];

interface ProductFormProps {
  template?: GreetingTemplate;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

function TemplateForm({ template, onSubmit, isPending }: ProductFormProps) {
  const form = useForm<GreetingTemplateFormData>({
    resolver: zodResolver(greetingTemplateFormSchema),
    defaultValues: template ? {
      title: template.title,
      description: template.description || "",
      imageUrl: template.imageUrl,
      thumbnailUrl: template.thumbnailUrl || "",
      occasions: template.occasions,
      offerTypes: template.offerTypes,
      industries: template.industries,
      hasEditableText: template.hasEditableText,
      supportsLogo: template.supportsLogo,
      supportsProducts: template.supportsProducts,
      supportsServices: template.supportsServices,
      supportsOffers: template.supportsOffers,
      includesPlatformBranding: template.includesPlatformBranding,
      isTrending: template.isTrending,
      status: template.status,
    } : {
      title: "",
      description: "",
      imageUrl: "",
      thumbnailUrl: "",
      occasions: [],
      offerTypes: [],
      industries: [],
      hasEditableText: true,
      supportsLogo: true,
      supportsProducts: false,
      supportsServices: false,
      supportsOffers: false,
      includesPlatformBranding: true,
      isTrending: false,
      status: "draft",
    },
  });

  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(template?.occasions || []);
  const [selectedOfferTypes, setSelectedOfferTypes] = useState<string[]>(template?.offerTypes || []);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(template?.industries || []);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(template?.imageUrl || null);
  const [customOccasion, setCustomOccasion] = useState("");
  const [customOfferType, setCustomOfferType] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");

  const handleImageChange = (file: File | null) => {
    setSelectedImageFile(file);
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(template?.imageUrl || null);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    // Convert image to data URL if file is selected
    let imageUrl = data.imageUrl || "https://placehold.co/800x600/blue/white?text=Template+Image";
    
    if (selectedImageFile) {
      // Use the preview data URL (base64 encoded image)
      imageUrl = imagePreview || imageUrl;
    }
    
    const thumbnailUrl = imageUrl; // Use same image for thumbnail

    const submitData = {
      ...data,
      imageUrl,
      thumbnailUrl,
      occasions: selectedOccasions,
      offerTypes: selectedOfferTypes,
      industries: selectedIndustries,
    };

    onSubmit(submitData);
  });

  const addCustomOccasion = () => {
    if (customOccasion.trim() && !selectedOccasions.includes(customOccasion.trim().toLowerCase())) {
      setSelectedOccasions([...selectedOccasions, customOccasion.trim().toLowerCase()]);
      setCustomOccasion("");
    }
  };

  const addCustomOfferType = () => {
    if (customOfferType.trim() && !selectedOfferTypes.includes(customOfferType.trim().toLowerCase())) {
      setSelectedOfferTypes([...selectedOfferTypes, customOfferType.trim().toLowerCase()]);
      setCustomOfferType("");
    }
  };

  const addCustomIndustry = () => {
    if (customIndustry.trim() && !selectedIndustries.includes(customIndustry.trim().toLowerCase())) {
      setSelectedIndustries([...selectedIndustries, customIndustry.trim().toLowerCase()]);
      setCustomIndustry("");
    }
  };

  const toggleArraySelection = (
    array: string[],
    setArray: (arr: string[]) => void,
    value: string
  ) => {
    if (array.includes(value)) {
      setArray(array.filter((v) => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Diwali Festival Offer" {...field} data-testid="input-title" />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the template..."
                  {...field}
                  value={field.value || ""}
                  data-testid="textarea-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel>Template Image *</FormLabel>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
              <img
                src={imagePreview}
                alt="Template preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedImageFile(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}
          
          {/* File Input */}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleImageChange(file || null);
              }}
              data-testid="input-image-file"
              className="cursor-pointer"
            />
          </div>
          
          {selectedImageFile && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Selected: {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Upload PNG, JPG, or WebP image (recommended size: 800x600px)
          </p>
        </div>

        <div className="space-y-2">
          <FormLabel>Occasions *</FormLabel>
          <div className="flex flex-wrap gap-2">
            {occasionOptions.map((option) => (
              <Badge
                key={option.value}
                variant={selectedOccasions.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => toggleArraySelection(selectedOccasions, setSelectedOccasions, option.value)}
                data-testid={`badge-occasion-${option.value}`}
              >
                {option.label}
              </Badge>
            ))}
            {selectedOccasions.filter(o => !occasionOptions.find(opt => opt.value === o)).map((custom) => (
              <Badge
                key={custom}
                variant="default"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setSelectedOccasions(selectedOccasions.filter(o => o !== custom))}
                data-testid={`badge-occasion-custom-${custom}`}
              >
                {custom}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom occasion..."
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomOccasion())}
              data-testid="input-custom-occasion"
            />
            <Button type="button" variant="outline" onClick={addCustomOccasion} data-testid="button-add-occasion">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Select from predefined occasions or add your own</p>
        </div>

        <div className="space-y-2">
          <FormLabel>Offer Types *</FormLabel>
          <div className="flex flex-wrap gap-2">
            {offerTypeOptions.map((option) => (
              <Badge
                key={option.value}
                variant={selectedOfferTypes.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => toggleArraySelection(selectedOfferTypes, setSelectedOfferTypes, option.value)}
                data-testid={`badge-offer-${option.value}`}
              >
                {option.label}
              </Badge>
            ))}
            {selectedOfferTypes.filter(o => !offerTypeOptions.find(opt => opt.value === o)).map((custom) => (
              <Badge
                key={custom}
                variant="default"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setSelectedOfferTypes(selectedOfferTypes.filter(o => o !== custom))}
                data-testid={`badge-offer-custom-${custom}`}
              >
                {custom}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom offer type..."
              value={customOfferType}
              onChange={(e) => setCustomOfferType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomOfferType())}
              data-testid="input-custom-offer-type"
            />
            <Button type="button" variant="outline" onClick={addCustomOfferType} data-testid="button-add-offer-type">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Select from predefined offer types or add your own</p>
        </div>

        <div className="space-y-2">
          <FormLabel>Industries *</FormLabel>
          <div className="flex flex-wrap gap-2">
            {industryOptions.map((option) => (
              <Badge
                key={option.value}
                variant={selectedIndustries.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => toggleArraySelection(selectedIndustries, setSelectedIndustries, option.value)}
                data-testid={`badge-industry-${option.value}`}
              >
                {option.label}
              </Badge>
            ))}
            {selectedIndustries.filter(i => !industryOptions.find(opt => opt.value === i)).map((custom) => (
              <Badge
                key={custom}
                variant="default"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setSelectedIndustries(selectedIndustries.filter(i => i !== custom))}
                data-testid={`badge-industry-custom-${custom}`}
              >
                {custom}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom industry..."
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomIndustry())}
              data-testid="input-custom-industry"
            />
            <Button type="button" variant="outline" onClick={addCustomIndustry} data-testid="button-add-industry">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Select from predefined industries or add your own</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hasEditableText"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-editable-text"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Has Editable Text</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportsLogo"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-supports-logo"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Supports Logo</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportsProducts"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-supports-products"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Supports Products</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportsServices"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-supports-services"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Supports Services</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportsOffers"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-supports-offers"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Supports Offers</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="includesPlatformBranding"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-platform-branding"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Platform Branding</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isTrending"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-trending"
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Mark as Trending</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isPending}
            data-testid="button-submit"
          >
            {isPending ? "Saving..." : template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function AdminGreetingTemplates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<GreetingTemplate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates"],
  });

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertGreetingTemplate) => apiRequest("POST", "/api/greeting-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      setIsAddDialogOpen(false);
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertGreetingTemplate> }) =>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Greeting & Marketing Templates</h1>
          <p className="text-muted-foreground">Manage promotional templates for vendors</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-template">
              <Plus className="w-4 h-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No templates found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`} className="hover-elevate">
              <CardHeader className="space-y-2">
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  <img
                    src={template.thumbnailUrl || template.imageUrl}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{template.title}</CardTitle>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Dialog open={editingTemplate?.id === template.id} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingTemplate(template)}
                          data-testid={`button-edit-${template.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Template</DialogTitle>
                        </DialogHeader>
                        <TemplateForm
                          template={template}
                          onSubmit={(data) => updateMutation.mutate({ id: template.id, data })}
                          isPending={updateMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(template.id)}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {template.isTrending && (
                    <Badge variant="secondary">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  <Badge variant={template.status === "published" ? "default" : "outline"}>
                    {template.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.occasions.slice(0, 2).map((occasion) => (
                    <Badge key={occasion} variant="outline" className="text-xs">
                      {occasion}
                    </Badge>
                  ))}
                  {template.occasions.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.occasions.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.downloadCount} downloads</span>
                  <span>{template.shareCount} shares</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
