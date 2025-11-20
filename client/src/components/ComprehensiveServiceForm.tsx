import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category, Subcategory, MasterService, VendorCatalogue } from "@shared/schema";

const INDUSTRIES = [
  "Healthcare", "Fitness Centers", "Education", "Real Estate", "Beauty Salons",
  "Hostel & PG", "Restaurants", "Professional Services", "Food & Beverage",
  "Fashion", "Renting Services", "Repairing Services", "Home Services", "Others"
];

const SERVICE_TYPES = [
  { value: "one-time", label: "One-time" },
  { value: "subscription", label: "Subscription / Recurring" },
  { value: "package", label: "Package / Combo" }
];

const PACKAGE_TYPES = [
  { value: "fixed-duration", label: "Fixed Duration" },
  { value: "session-based", label: "Session-based" }
];

const GST_SLABS = [
  { value: "0", label: "0% (Exempt)" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
  { value: "custom", label: "Custom GST Rate" }
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface ComprehensiveServiceFormProps {
  initialData?: Partial<MasterService | VendorCatalogue>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "create" | "edit";
  userType: "admin" | "vendor";
}

export default function ComprehensiveServiceForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
  userType
}: ComprehensiveServiceFormProps) {
  // Fetch categories and subcategories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  // Form state - Basic Information
  const [name, setName] = useState(initialData.name || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [categoryId, setCategoryId] = useState(initialData.categoryId || "");
  const [subcategory, setSubcategory] = useState(initialData.subcategory || "");
  const [subcategoryId, setSubcategoryId] = useState(initialData.subcategoryId || "");
  const [customUnit, setCustomUnit] = useState(initialData.customUnit || "");
  const [serviceType, setServiceType] = useState(initialData.serviceType || "one-time");

  // Form state - Description & Details
  const [shortDescription, setShortDescription] = useState(initialData.shortDescription || "");
  const [detailedDescription, setDetailedDescription] = useState(initialData.detailedDescription || "");
  const [inclusions, setInclusions] = useState<string[]>(initialData.inclusions || []);
  const [exclusions, setExclusions] = useState<string[]>(initialData.exclusions || []);

  // Form state - Pricing & Availability
  const [basePrice, setBasePrice] = useState((initialData as any).basePrice || (initialData as any).price || 0);
  const [offerPrice, setOfferPrice] = useState(initialData.offerPrice || 0);
  const [gstSlab, setGstSlab] = useState(
    initialData.taxPercentage && [0, 5, 12, 18, 28].includes(initialData.taxPercentage) 
      ? String(initialData.taxPercentage) 
      : "custom"
  );
  const [customGstRate, setCustomGstRate] = useState(
    initialData.taxPercentage && ![0, 5, 12, 18, 28].includes(initialData.taxPercentage)
      ? initialData.taxPercentage
      : 0
  );
  const [gstIncluded, setGstIncluded] = useState(initialData.gstIncluded || false);
  const [availableDays, setAvailableDays] = useState<string[]>(initialData.availableDays || []);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(initialData.availableTimeSlots || []);
  const [homeServiceAvailable, setHomeServiceAvailable] = useState(initialData.bookingRequired || false);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(initialData.freeTrialAvailable || false);

  // Form state - Package Details
  const [packageName, setPackageName] = useState(initialData.packageName || "");
  const [packageType, setPackageType] = useState(initialData.packageType || "");
  const [packageDuration, setPackageDuration] = useState(initialData.packageDuration || "");
  const [packageSessions, setPackageSessions] = useState(initialData.packageSessions || 0);

  // Form state - Media
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // Temp input states
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");

  // Filter subcategories based on selected category
  const filteredSubcategories = categoryId 
    ? allSubcategories.filter(sub => sub.categoryId === categoryId)
    : [];

  // Handle category change
  const handleCategoryChange = (value: string) => {
    const selectedCategory = categories.find(cat => cat.id === value);
    if (selectedCategory) {
      setCategoryId(value);
      setCategory(selectedCategory.name);
      setSubcategoryId("");
      setSubcategory("");
    } else if (value === "custom") {
      setCategoryId("");
      setSubcategoryId("");
    }
  };

  // Handle subcategory change
  const handleSubcategoryChange = (value: string) => {
    const selectedSubcategory = allSubcategories.find(sub => sub.id === value);
    if (selectedSubcategory) {
      setSubcategoryId(value);
      setSubcategory(selectedSubcategory.name);
    } else if (value === "custom") {
      setSubcategoryId("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate final GST percentage
    const finalGstRate = gstSlab === "custom" ? customGstRate : Number(gstSlab);
    
    const formData = {
      // Basic Information
      name,
      category,
      categoryId: categoryId || undefined,
      subcategory: subcategory || undefined,
      subcategoryId: subcategoryId || undefined,
      customUnit,
      serviceType,
      icon: "💼", // Default icon since emoji picker removed
      
      // Description & Details
      shortDescription,
      detailedDescription,
      description: shortDescription, // Fallback for backward compatibility
      inclusions,
      exclusions,
      benefits: [], // Empty for removed field
      features: [], // Empty for removed field
      highlights: [], // Empty for removed field
      tags: [], // Empty for removed field
      
      // Pricing & Availability
      ...(userType === "admin" ? { basePrice } : { price: basePrice }),
      offerPrice: offerPrice || undefined,
      taxPercentage: finalGstRate,
      gstIncluded,
      availableDays,
      availableTimeSlots,
      bookingRequired: homeServiceAvailable, // Mapping homeServiceAvailable to bookingRequired for backward compatibility
      freeTrialAvailable,
      
      // Package Details
      packageName: serviceType === "package" ? packageName : undefined,
      packageType: serviceType === "package" ? packageType : undefined,
      packageDuration: serviceType === "package" && packageType === "fixed-duration" ? packageDuration : undefined,
      packageSessions: serviceType === "package" && packageType === "session-based" ? packageSessions : undefined,
      
      // Media - TODO: Implement actual file upload to object storage
      // For now, storing file metadata for future backend integration
      mediaFileNames: mediaFiles.map(f => f.name),
      mediaFileCount: mediaFiles.length,
      tagline: "", // Removed field
      promotionalCaption: "", // Removed field
      
      // Legacy fields
      sampleType: "",
      tat: "",
    };

    // TODO: Backend Integration Required
    // The mediaFiles array contains File objects that need to be uploaded
    // Options for future implementation:
    // 1. Use @replit/object-storage to upload files to Replit storage
    // 2. Convert to FormData and update API to handle multipart/form-data
    // 3. Use base64 encoding for small images (not recommended for large files)
    // For now, the file selection UI is in place and metadata is captured

    onSubmit(formData);
  };

  const addToList = (list: string[], setList: (arr: string[]) => void, value: string) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
    }
  };

  const removeFromList = (list: string[], setList: (arr: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Basic Service Information */}
      <Card>
        <CardHeader>
          <CardTitle>1️⃣ Basic Service Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Industry / Category *</Label>
              <Select value={categoryId || "custom"} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                  <SelectItem value="custom">Others (Custom)</SelectItem>
                </SelectContent>
              </Select>
              {!categoryId && (
                <Input 
                  className="mt-2" 
                  placeholder="Enter custom category" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label>Subcategory</Label>
              {categoryId ? (
                <>
                  <Select value={subcategoryId || "custom"} onValueChange={handleSubcategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubcategories.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                      <SelectItem value="custom">Others (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                  {!subcategoryId && (
                    <Input 
                      className="mt-2" 
                      placeholder="Enter custom subcategory" 
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                    />
                  )}
                </>
              ) : (
                <Input 
                  placeholder="Enter custom subcategory" 
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label>Service Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Personal Training Session" />
            </div>

            <div>
              <Label>Custom Unit / Duration</Label>
              <Input value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} placeholder="e.g., per session, per month, per visit" />
            </div>

            <div>
              <Label>Service Type *</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Description & Details */}
      <Card>
        <CardHeader>
          <CardTitle>2️⃣ Description & Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Short Description</Label>
            <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Quick summary for list view" />
          </div>

          <div>
            <Label>Detailed Description</Label>
            <Textarea 
              value={detailedDescription} 
              onChange={(e) => setDetailedDescription(e.target.value)} 
              placeholder="Full description for service page"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Inclusions</Label>
              <div className="flex gap-2 mb-2">
                <Input value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} placeholder="What's included" />
                <Button type="button" size="sm" onClick={() => { addToList(inclusions, setInclusions, newInclusion); setNewInclusion(""); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {inclusions.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-green-600">
                    ✓ {item} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeFromList(inclusions, setInclusions, i)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Exclusions</Label>
              <div className="flex gap-2 mb-2">
                <Input value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} placeholder="What's not included" />
                <Button type="button" size="sm" onClick={() => { addToList(exclusions, setExclusions, newExclusion); setNewExclusion(""); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {exclusions.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-red-600">
                    ✗ {item} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeFromList(exclusions, setExclusions, i)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Pricing & Availability */}
      <Card>
        <CardHeader>
          <CardTitle>3️⃣ Pricing & Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{userType === "admin" ? "Base Price (₹)" : "Price (₹)"} *</Label>
              <Input type="number" required value={basePrice} onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)} placeholder="1000" />
            </div>

            <div>
              <Label>Offer Price (₹)</Label>
              <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(parseInt(e.target.value) || 0)} placeholder="900" />
            </div>

            <div>
              <Label>GST Rate *</Label>
              <Select value={gstSlab} onValueChange={setGstSlab}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GST slab" />
                </SelectTrigger>
                <SelectContent>
                  {GST_SLABS.map(slab => (
                    <SelectItem key={slab.value} value={slab.value}>{slab.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {gstSlab === "custom" && (
            <div className="max-w-xs">
              <Label>Custom GST Rate (%)</Label>
              <Input 
                type="number" 
                value={customGstRate} 
                onChange={(e) => setCustomGstRate(parseFloat(e.target.value) || 0)} 
                placeholder="Enter custom GST rate" 
                step="0.01"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox id="gstIncluded" checked={gstIncluded} onCheckedChange={(checked) => setGstIncluded(!!checked)} />
            <Label htmlFor="gstIncluded">GST Included in price</Label>
          </div>

          <div>
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={day}
                    checked={availableDays.includes(day)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAvailableDays([...availableDays, day]);
                      } else {
                        setAvailableDays(availableDays.filter(d => d !== day));
                      }
                    }}
                  />
                  <Label htmlFor={day}>{day.substring(0, 3)}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Available Time Slots</Label>
            <div className="flex gap-2 mb-2">
              <Input value={newTimeSlot} onChange={(e) => setNewTimeSlot(e.target.value)} placeholder="e.g., 9:00-10:00" />
              <Button type="button" size="sm" onClick={() => { addToList(availableTimeSlots, setAvailableTimeSlots, newTimeSlot); setNewTimeSlot(""); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTimeSlots.map((slot, i) => (
                <Badge key={i} variant="outline">
                  {slot} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeFromList(availableTimeSlots, setAvailableTimeSlots, i)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="homeServiceAvailable" checked={homeServiceAvailable} onCheckedChange={(checked) => setHomeServiceAvailable(!!checked)} />
              <Label htmlFor="homeServiceAvailable">Home Service Available</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="freeTrialAvailable" checked={freeTrialAvailable} onCheckedChange={(checked) => setFreeTrialAvailable(!!checked)} />
              <Label htmlFor="freeTrialAvailable">Free Trial / Demo Available</Label>
            </div>
          </div>

          {/* Package Details - Only shown when service type is package */}
          {serviceType === "package" && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Package Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Package Name</Label>
                    <Input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="e.g., 3-Month Fitness Plan" />
                  </div>

                  <div>
                    <Label>Package Type</Label>
                    <Select value={packageType} onValueChange={setPackageType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {packageType === "fixed-duration" && (
                    <div>
                      <Label>Duration</Label>
                      <Input value={packageDuration} onChange={(e) => setPackageDuration(e.target.value)} placeholder="e.g., 1-month, 3-months, yearly" />
                    </div>
                  )}

                  {packageType === "session-based" && (
                    <div>
                      <Label>Number of Sessions</Label>
                      <Input type="number" value={packageSessions} onChange={(e) => setPackageSessions(parseInt(e.target.value) || 0)} placeholder="e.g., 10, 25" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Service Image */}
      <Card>
        <CardHeader>
          <CardTitle>4️⃣ Service Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Service Image</Label>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setMediaFiles([e.target.files[0]]);
                }
              }}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload a service image (JPG, PNG, or WebP recommended)
            </p>
            {mediaFiles.length > 0 && (
              <div className="mt-2">
                <Badge variant="secondary">
                  {mediaFiles[0].name}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setMediaFiles([])} 
                  />
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {mode === "create" ? "Create Service" : "Update Service"}
        </Button>
      </div>
    </form>
  );
}
