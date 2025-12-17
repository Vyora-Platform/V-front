import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Image as ImageIcon, Search, TrendingUp, Calendar, Eye, EyeOff, Copy, ChevronDown, Filter, Download, Share2, Sparkles, Tag, LayoutGrid, Square, RectangleVertical, RectangleHorizontal, BarChart3, FolderOpen, Palette, Gift, Heart, Megaphone, PartyPopper, ShoppingBag, Bell, Sun, Moon, Camera, Star, GripVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGreetingTemplateSchema, type GreetingTemplate, type InsertGreetingTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getApiUrl } from "@/lib/config";

// Available icons for categories
const availableIcons = [
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "Gift", label: "Gift", Icon: Gift },
  { value: "Calendar", label: "Calendar", Icon: Calendar },
  { value: "Tag", label: "Tag", Icon: Tag },
  { value: "TrendingUp", label: "Trending", Icon: TrendingUp },
  { value: "Star", label: "Star", Icon: Star },
  { value: "Megaphone", label: "Megaphone", Icon: Megaphone },
  { value: "PartyPopper", label: "Party", Icon: PartyPopper },
  { value: "Heart", label: "Heart", Icon: Heart },
  { value: "ShoppingBag", label: "Shopping", Icon: ShoppingBag },
  { value: "Bell", label: "Bell", Icon: Bell },
  { value: "Sun", label: "Sun", Icon: Sun },
  { value: "Moon", label: "Moon", Icon: Moon },
  { value: "Camera", label: "Camera", Icon: Camera },
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

// Extended schema for file upload
const greetingTemplateFormSchema = insertGreetingTemplateSchema.extend({
  imageFile: z.instanceof(File).optional(),
  thumbnailFile: z.instanceof(File).optional(),
  posterType: z.string().optional(),
  orientation: z.string().optional(),
  resolution: z.string().optional(),
  region: z.string().optional(),
  eventDate: z.string().optional(),
  expiryDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
});

type GreetingTemplateFormData = z.infer<typeof greetingTemplateFormSchema>;

// Poster Types
const posterTypeOptions = [
  { value: "festival", label: "Festival Posts" },
  { value: "greeting", label: "Greetings" },
  { value: "marketing", label: "Marketing Banners" },
  { value: "product_promo", label: "Product Promotion" },
  { value: "service_promo", label: "Service Promotion" },
  { value: "offer_discount", label: "Offer / Discount" },
  { value: "coupon_promo", label: "Coupon Promotion" },
  { value: "announcement", label: "Announcements" },
];

// Orientation options
const orientationOptions = [
  { value: "square", label: "Square (Instagram)", icon: Square },
  { value: "portrait", label: "Portrait (WhatsApp/Story)", icon: RectangleVertical },
  { value: "landscape", label: "Landscape (Facebook/Twitter)", icon: RectangleHorizontal },
];

// Resolution options
const resolutionOptions = [
  { value: "hd", label: "HD (720p)" },
  { value: "full_hd", label: "Full HD (1080p)" },
];

// Region options
const regionOptions = [
  { value: "india", label: "India" },
  { value: "global", label: "Global" },
  { value: "custom", label: "Custom" },
];

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
  { value: "ganesh_chaturthi", label: "Ganesh Chaturthi" },
  { value: "durga_puja", label: "Durga Puja" },
  { value: "onam", label: "Onam" },
  { value: "makar_sankranti", label: "Makar Sankranti" },
  { value: "valentines_day", label: "Valentine's Day" },
  { value: "mothers_day", label: "Mother's Day" },
  { value: "fathers_day", label: "Father's Day" },
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
  { value: "combo_offer", label: "Combo Offer" },
  { value: "cashback", label: "Cashback Offer" },
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
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "jewelry", label: "Jewelry" },
  { value: "travel", label: "Travel & Tourism" },
  { value: "hospitality", label: "Hotels & Hospitality" },
];

interface ProductFormProps {
  template?: GreetingTemplate;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onClose: () => void;
}

function TemplateForm({ template, onSubmit, isPending, onClose }: ProductFormProps) {
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
      tags: (template as any).tags || [],
      categoryId: (template as any).categoryId || "",
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
      posterType: "festival",
      orientation: "square",
      resolution: "full_hd",
      region: "india",
      tags: [],
      categoryId: "",
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
    let imageUrl = data.imageUrl || "https://placehold.co/800x600/blue/white?text=Template+Image";
    
    if (selectedImageFile) {
      imageUrl = imagePreview || imageUrl;
    }
    
    const thumbnailUrl = imageUrl;

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
        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Title *</FormLabel>
              <FormControl>
                  <Input placeholder="e.g., Diwali Festival Offer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="posterType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poster Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "festival"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select poster type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {posterTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tags for Search */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search Tags (comma separated)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., sale, discount, festival, offer, diwali"
                  {...field}
                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ""}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the template..."
                  {...field}
                  value={field.value || ""}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Orientation & Resolution */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="orientation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orientation *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "square"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {orientationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
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
            name="resolution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resolution</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "full_hd"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {resolutionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "india"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Event & Expiry Dates */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <FormLabel>Template Image *</FormLabel>
          
          {imagePreview && (
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border max-w-md">
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
          
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleImageChange(file || null);
              }}
              className="cursor-pointer"
            />
          </div>
          
          {selectedImageFile && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Selected: {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Upload PNG, JPG, or WebP image (recommended size: 1080x1080 for square, 1080x1920 for portrait)
          </p>
        </div>

        {/* Occasions */}
        <div className="space-y-2">
          <FormLabel>Occasions / Festivals</FormLabel>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
            {occasionOptions.map((option) => (
              <Badge
                key={option.value}
                variant={selectedOccasions.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => toggleArraySelection(selectedOccasions, setSelectedOccasions, option.value)}
              >
                {option.label}
              </Badge>
            ))}
            {selectedOccasions.filter(o => !occasionOptions.find(opt => opt.value === o)).map((custom) => (
              <Badge
                key={custom}
                variant="default"
                className="cursor-pointer"
                onClick={() => setSelectedOccasions(selectedOccasions.filter(o => o !== custom))}
              >
                {custom} ✕
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom occasion..."
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomOccasion())}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addCustomOccasion} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Offer Types */}
        <div className="space-y-2">
          <FormLabel>Offer Types</FormLabel>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
            {offerTypeOptions.map((option) => (
              <Badge
                key={option.value}
                variant={selectedOfferTypes.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => toggleArraySelection(selectedOfferTypes, setSelectedOfferTypes, option.value)}
              >
                {option.label}
              </Badge>
            ))}
            {selectedOfferTypes.filter(o => !offerTypeOptions.find(opt => opt.value === o)).map((custom) => (
              <Badge
                key={custom}
                variant="default"
                className="cursor-pointer"
                onClick={() => setSelectedOfferTypes(selectedOfferTypes.filter(o => o !== custom))}
              >
                {custom} ✕
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom offer type..."
              value={customOfferType}
              onChange={(e) => setCustomOfferType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomOfferType())}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addCustomOfferType} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Industries */}
        <div className="space-y-2">
          <FormLabel>Industries / Categories</FormLabel>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
            {industryOptions.map((option) => (
              <Badge
                key={option.value}
                variant={selectedIndustries.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => toggleArraySelection(selectedIndustries, setSelectedIndustries, option.value)}
              >
                {option.label}
              </Badge>
            ))}
            {selectedIndustries.filter(i => !industryOptions.find(opt => opt.value === i)).map((custom) => (
              <Badge
                key={custom}
                variant="default"
                className="cursor-pointer"
                onClick={() => setSelectedIndustries(selectedIndustries.filter(i => i !== custom))}
              >
                {custom} ✕
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add custom industry..."
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomIndustry())}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addCustomIndustry} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <FormField
            control={form.control}
            name="hasEditableText"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Editable Text</FormLabel>
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
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Logo Support</FormLabel>
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
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Products</FormLabel>
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
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Services</FormLabel>
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
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Offers</FormLabel>
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
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Platform Branding</FormLabel>
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
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm">Mark Trending</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
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
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filter states
  const [selectedPosterTypes, setSelectedPosterTypes] = useState<string[]>([]);
  const [selectedOrientations, setSelectedOrientations] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: templates = [], isLoading } = useQuery<GreetingTemplate[]>({
    queryKey: ["/api/greeting-templates"],
  });

  // Apply filters
  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (searchQuery && !template.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status tab filter
    if (activeTab === "published" && template.status !== "published") return false;
    if (activeTab === "draft" && template.status !== "draft") return false;
    if (activeTab === "archived" && template.status !== "archived") return false;
    if (activeTab === "trending" && !template.isTrending) return false;
    
    // Poster type filter
    if (selectedPosterTypes.length > 0 && !selectedPosterTypes.some(pt => template.offerTypes.includes(pt))) {
      return false;
    }
    
    // Occasion filter
    if (selectedOccasions.length > 0 && !selectedOccasions.some(o => template.occasions.includes(o))) {
      return false;
    }
    
    // Industry filter
    if (selectedIndustries.length > 0 && !selectedIndustries.some(i => template.industries.includes(i))) {
      return false;
    }
    
    // Status filter
    if (selectedStatus && template.status !== selectedStatus) {
      return false;
    }
    
    return true;
  });

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

  const clearAllFilters = () => {
    setSelectedPosterTypes([]);
    setSelectedOrientations([]);
    setSelectedOccasions([]);
    setSelectedIndustries([]);
    setSelectedStatus("");
    setSearchQuery("");
  };

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

  const cloneMutation = useMutation({
    mutationFn: async (template: GreetingTemplate) => {
      const cloneData = {
        title: `${template.title} (Copy)`,
        description: template.description,
        imageUrl: template.imageUrl,
        thumbnailUrl: template.thumbnailUrl,
        occasions: template.occasions,
        offerTypes: template.offerTypes,
        industries: template.industries,
        hasEditableText: template.hasEditableText,
        supportsLogo: template.supportsLogo,
        supportsProducts: template.supportsProducts,
        supportsServices: template.supportsServices,
        supportsOffers: template.supportsOffers,
        includesPlatformBranding: template.includesPlatformBranding,
        isTrending: false,
        status: "draft",
      };
      return apiRequest("POST", "/api/greeting-templates", cloneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/greeting-templates"] });
      toast({ title: "Template cloned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to clone template", variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
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

  // Stats
  const stats = {
    total: templates.length,
    published: templates.filter(t => t.status === "published").length,
    draft: templates.filter(t => t.status === "draft").length,
    trending: templates.filter(t => t.isTrending).length,
    totalDownloads: templates.reduce((sum, t) => sum + t.downloadCount, 0),
    totalShares: templates.reduce((sum, t) => sum + t.shareCount, 0),
  };

  const hasActiveFilters = selectedPosterTypes.length > 0 || selectedOrientations.length > 0 || 
                           selectedOccasions.length > 0 || selectedIndustries.length > 0 || 
                           selectedStatus !== "";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Poster & Banner Management</h1>
          <p className="text-muted-foreground text-sm">Create and manage marketing templates for vendors</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
              onClose={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">Trending</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.trending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-muted-foreground">Downloads</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <div>
                <p className="text-xs text-muted-foreground">Shares</p>
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{stats.totalShares}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

        {/* Filters Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Poster Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Tag className="w-4 h-4 mr-2" />
                Poster Type
                {selectedPosterTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-full px-2">
                    {selectedPosterTypes.length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Poster Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {posterTypeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedPosterTypes.includes(option.value)}
                  onCheckedChange={() => toggleArraySelection(selectedPosterTypes, setSelectedPosterTypes, option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Occasion Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Calendar className="w-4 h-4 mr-2" />
                Occasions
                {selectedOccasions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-full px-2">
                    {selectedOccasions.length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Occasions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {occasionOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedOccasions.includes(option.value)}
                  onCheckedChange={() => toggleArraySelection(selectedOccasions, setSelectedOccasions, option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Industry Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Sparkles className="w-4 h-4 mr-2" />
                Industry
                {selectedIndustries.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-full px-2">
                    {selectedIndustries.length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Industries</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {industryOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selectedIndustries.includes(option.value)}
                  onCheckedChange={() => toggleArraySelection(selectedIndustries, setSelectedIndustries, option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="w-4 h-4 mr-2" />
                Status
                {selectedStatus && (
                  <Badge variant="secondary" className="ml-2 rounded-full px-2">
                    1
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "published"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "published" ? "" : "published")}
              >
                Published
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "draft"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "draft" ? "" : "draft")}
              >
                Draft
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "archived"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "archived" ? "" : "archived")}
              >
                Archived
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="flex-shrink-0">
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No templates found</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearAllFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
          </CardContent>
        </Card>
      ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTemplates.map((template) => (
                <Card key={template.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square bg-muted overflow-hidden">
                  <img
                    src={template.thumbnailUrl || template.imageUrl}
                    alt={template.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant={template.status === "published" ? "default" : "secondary"}>
                        {template.status}
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
                        onClick={() => cloneMutation.mutate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => togglePublishMutation.mutate({
                          id: template.id,
                          status: template.status === "published" ? "draft" : "published"
                        })}
                      >
                        {template.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this template?")) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{template.title}</h3>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
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

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory?.name?.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    updateCategoryMutation.mutate({ id: editingCategory.id, data: editingCategory });
  };

  const getIconComponent = (iconName: string) => {
    const iconItem = availableIcons.find(i => i.value === iconName);
    return iconItem?.Icon || Sparkles;
  };

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-500" />
            Category Management
          </h2>
          <p className="text-muted-foreground text-sm">Create and manage poster categories for vendors</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>Add a new category for marketing templates</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  placeholder="e.g., Diwali Specials"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-7 gap-2 mt-1">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon: icon.value })}
                      className={`p-2 rounded-lg border-2 flex items-center justify-center transition-all ${
                        newCategory.icon === icon.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <icon.Icon className="w-5 h-5" style={{ color: newCategory.color }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 mt-1">
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
                <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCategory} 
                  disabled={createCategoryMutation.isPending}
                  className="flex-1"
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading categories...</div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No categories created yet</p>
            <p className="text-sm">Create your first category to organize templates</p>
              </CardContent>
            </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category: any) => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <Card key={category.id} className="group overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: category.color }} />
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this category?")) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1">{category.name}</h3>
                  {category.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{category.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
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
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description..."
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-7 gap-2 mt-1">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, icon: icon.value })}
                      className={`p-2 rounded-lg border-2 flex items-center justify-center transition-all ${
                        editingCategory.icon === icon.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <icon.Icon className="w-5 h-5" style={{ color: editingCategory.color }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 mt-1">
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
                <Button variant="outline" onClick={() => setEditingCategory(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCategory} 
                  disabled={updateCategoryMutation.isPending}
                  className="flex-1"
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
