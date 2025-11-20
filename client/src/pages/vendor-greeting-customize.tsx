import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, Share2, Send, Twitter, Package, ShoppingBag, Tag, Globe, Store, ImageIcon, Upload } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram, SiLinkedin } from "react-icons/si";
import type { GreetingTemplate } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { ImageEditorDialog } from "@/components/ImageEditorDialog";

export default function VendorGreetingCustomize() {
  const params = useParams<{ vendorId: string; templateId: string }>();
  const templateId = params.templateId || "";
  const { vendorId: hookVendorId } = useAuth();
  
  // Get vendor ID from params or localStorage
  const vendorId = params.vendorId || hookVendorId;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [customText, setCustomText] = useState("");
  const [businessName, setBusinessName] = useState("My Business");
  const [businessLocation, setBusinessLocation] = useState("Mumbai, India");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("+91 9876543210");
  const [logo, setLogo] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Image editor state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string>("");

  // Handle edited image save
  const handleLogoSave = (editedImage: string) => {
    setLogoPreview(editedImage);
    setLogo(editedImage);
    setLogoFile(null); // Clear file since we're using edited image
    setShowImageEditor(false);
    setImageToEdit("");
  };

  // Handle edit existing logo
  const handleEditLogo = () => {
    if (logoPreview) {
      setImageToEdit(logoPreview);
      setShowImageEditor(true);
    }
  };
  
  // Selected items for sharing
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  // Fetch template
  const { data: template, isLoading } = useQuery<GreetingTemplate>({
    queryKey: ["/api/greeting-templates", templateId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/greeting-templates/${templateId}`));
      if (!res.ok) throw new Error("Failed to fetch template");
      return res.json();
    },
    enabled: !!templateId,
  });

  // Fetch vendor's products
  const { data: vendorProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/vendor-products", vendorId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/vendor-products?vendorId=${vendorId}`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Fetch vendor's services
  const { data: vendorServices = [] } = useQuery<any[]>({
    queryKey: ["/api/vendor-catalogues", vendorId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/vendor-catalogues?vendorId=${vendorId}`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Fetch vendor's coupons/offers
  const { data: vendorOffers = [] } = useQuery<any[]>({
    queryKey: ["/api/coupons", vendorId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/coupons?vendorId=${vendorId}`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Fetch vendor details
  const { data: vendor } = useQuery<any>({
    queryKey: [`/api/vendors/${vendorId}`],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/vendors/${vendorId}`));
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Fetch vendor's miniwebsite
  const { data: miniWebsite } = useQuery<any>({
    queryKey: [`/api/vendors/${vendorId}/mini-website`],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/vendors/${vendorId}/mini-website`));
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Auto-fill vendor details, logo, and miniwebsite link
  useEffect(() => {
    console.log("🔄 Auto-filling store branding...");
    console.log("Vendor data:", vendor);
    console.log("MiniWebsite data:", miniWebsite);
    
    if (vendor) {
      const name = vendor.businessName || vendor.name || "My Business";
      const location = vendor.address || vendor.city || vendor.location || "India";
      const phoneNumber = vendor.phone || vendor.contactNumber || "+91 9876543210";
      
      console.log("✅ Setting business name:", name);
      console.log("✅ Setting location:", location);
      console.log("✅ Setting phone:", phoneNumber);
      
      setBusinessName(name);
      setBusinessLocation(location);
      setPhone(phoneNumber);
      
      // Auto-fill logo from vendor profile or miniwebsite
      const vendorLogo = vendor.logo || vendor.logoUrl || miniWebsite?.logo || miniWebsite?.logoUrl || "";
      if (vendorLogo) {
        console.log("✅ Auto-filling vendor logo:", vendorLogo);
        setLogo(vendorLogo);
        setLogoPreview(vendorLogo);
      } else {
        console.log("⚠️ No logo found in vendor profile or miniwebsite");
      }
    }
    
    // Auto-fill miniwebsite link
    if (miniWebsite) {
      let miniWebsiteUrl = "";
      
      // Check if miniwebsite is published
      if (miniWebsite.isPublished || miniWebsite.status === 'published') {
        // Priority 1: Custom domain
        if (miniWebsite.customDomain) {
          miniWebsiteUrl = `https://${miniWebsite.customDomain}`;
        }
        // Priority 2: Slug-based URL
        else if (miniWebsite.slug) {
          miniWebsiteUrl = `https://vyora.in/${miniWebsite.slug}`;
        }
        // Priority 3: Subdomain
        else if (miniWebsite.subdomain) {
          miniWebsiteUrl = `https://${miniWebsite.subdomain}.vyora.in`;
        }
        // Fallback: Vendor ID
        else {
          miniWebsiteUrl = `https://vyora.in/store/${vendorId}`;
        }
        
        console.log("✅ Setting miniwebsite URL:", miniWebsiteUrl);
        setWebsite(miniWebsiteUrl);
      } else {
        console.log("⚠️ MiniWebsite not published yet");
        setWebsite("");
      }
    }
  }, [vendor, miniWebsite, vendorId]);

  // Create template usage
  const createUsageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(getApiUrl("/api/greeting-template-usage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create usage");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Template customized successfully!" });
    },
  });

  // Track share
  const trackShareMutation = useMutation({
    mutationFn: ({ usageId, platform }: { usageId: string; platform: string }) =>
      apiRequest("POST", `/api/greeting-template-usage/${usageId}/share`, { platform }),
  });

  const handleDownload = async () => {
    try {
      // Create usage record
      const usage = await createUsageMutation.mutateAsync({
        templateId,
        vendorId,
        customText: { text: customText, businessName, location: businessLocation, website, phone, logo: logo || logoPreview },
        includedProducts: selectedProducts,
        includedServices: selectedServices,
        includedOffers: selectedOffers,
      });

      // Track download
      await apiRequest("POST", `/api/greeting-templates/${templateId}/download`, {});

      toast({
        title: "Downloaded!",
        description: "Template has been downloaded to your device",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string, selected: string[], setSelected: (ids: string[]) => void) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleShare = async (platform: string) => {
    try {
      console.log("Starting share flow for platform:", platform);
      console.log("Template ID:", templateId, "Vendor ID:", vendorId);
      
      // Create usage record if not already created
      const usage = await createUsageMutation.mutateAsync({
        templateId,
        vendorId,
        customText: { text: customText, businessName, location: businessLocation, website, phone, logo: logo || logoPreview },
        includedProducts: selectedProducts,
        includedServices: selectedServices,
        includedOffers: selectedOffers,
      });

      console.log("Usage created:", usage);

      if (!usage || !usage.id) {
        console.error("Usage record missing ID:", usage);
        throw new Error("Failed to create usage record");
      }

      console.log("Tracking share for usage ID:", usage.id);
      // Track share
      await trackShareMutation.mutateAsync({ usageId: usage.id, platform });

      // Build share text with selected items and branding
      let shareText = customText ? `${customText}\n\n` : `${template?.title}\n\n`;
      
      // Store branding
      shareText += `📢 ${businessName}`;
      if (businessLocation) shareText += `\n📍 ${businessLocation}`;
      if (phone) shareText += `\n📞 ${phone}`;
      
      // Add miniwebsite link prominently
      if (website) {
        shareText += `\n🌐 Visit our store: ${website}`;
      }
      
      // Add selected products
      if (selectedProducts.length > 0 && template?.supportsProducts) {
        shareText += `\n\n🛍️ Featured Products:`;
        selectedProducts.slice(0, 5).forEach(id => {
          const product = vendorProducts.find(p => p.id === id);
          if (product) {
            shareText += `\n  • ${product.name} - ₹${product.price}`;
          }
        });
        if (selectedProducts.length > 5) {
          shareText += `\n  ... and ${selectedProducts.length - 5} more!`;
        }
      }
      
      // Add selected services
      if (selectedServices.length > 0 && template?.supportsServices) {
        shareText += `\n\n⚙️ Our Services:`;
        selectedServices.slice(0, 5).forEach(id => {
          const service = vendorServices.find(s => s.id === id);
          if (service) {
            shareText += `\n  • ${service.name} - ₹${service.price}`;
          }
        });
        if (selectedServices.length > 5) {
          shareText += `\n  ... and ${selectedServices.length - 5} more!`;
        }
      }
      
      // Add selected offers
      if (selectedOffers.length > 0 && template?.supportsOffers) {
        shareText += `\n\n🎁 Special Offers:`;
        selectedOffers.slice(0, 3).forEach(id => {
          const offer = vendorOffers.find(o => o.id === id);
          if (offer) {
            const discount = offer.discountType === 'percentage' 
              ? `${offer.discountValue}% OFF` 
              : `₹${offer.discountValue} OFF`;
            shareText += `\n  • Use code: ${offer.code} - Get ${discount}`;
          }
        });
        if (selectedOffers.length > 3) {
          shareText += `\n  ... and ${selectedOffers.length - 3} more offers!`;
        }
      }
      
      // Add call to action with miniwebsite
      if (website) {
        shareText += `\n\n👉 Browse more & order online:\n${website}`;
      }
      
      // Add Vyora platform branding
      shareText += `\n\n✨ Powered by Vyora - Smart Business Management`;
      
      const shareUrl = template?.imageUrl || "";

      let url = "";
      switch (platform) {
        case "whatsapp":
          url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`;
          break;
        case "facebook":
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
          break;
        case "twitter":
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case "linkedin":
          url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
          break;
        case "instagram":
          // Instagram doesn't support direct web sharing
          toast({
            title: "Instagram Sharing",
            description: "Please use the Instagram app to share this template",
          });
          return;
      }

      if (url) {
        window.open(url, "_blank");
        toast({
          title: "Shared!",
          description: `Template shared to ${platform}`,
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Error",
        description: "Failed to share template",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Template not found</p>
          <Button onClick={() => setLocation(`/vendors/${vendorId}/greeting`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/vendors/${vendorId}/greeting`)}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Customize Template</h1>
          <p className="text-muted-foreground">{template.title}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
              <img
                src={template.imageUrl}
                alt={template.title}
                className="w-full h-full object-cover"
              />
              {/* Logo overlay on preview if logo is present */}
              {logoPreview && template.supportsLogo && (
                <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-lg shadow-xl p-2 flex items-center justify-center border-2 border-white">
                  <img
                    src={logoPreview}
                    alt="Store Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 text-xs">
                    ✓
                  </div>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {template.occasions.map((occasion) => (
                  <Badge key={occasion} variant="outline" className="text-xs">
                    {occasion}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{template.downloadCount} downloads</span>
              <span>{template.shareCount} shares</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Customization Options */}
        <Card>
          <CardHeader>
            <CardTitle>Customize & Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Store Branding Section */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Store Branding</h3>
                </div>
                
                <div className="grid gap-3">
                  {/* Logo Upload/Preview */}
                  {template.supportsLogo && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <label className="text-xs font-medium text-muted-foreground">Store Logo</label>
                      </div>
                      
                      {logoPreview ? (
                        <div className="space-y-2">
                          <div className="relative w-32 h-32 border-2 border-dashed border-primary rounded-lg overflow-hidden bg-white flex items-center justify-center p-3">
                            <img
                              src={logoPreview}
                              alt="Store logo"
                              className="max-w-full max-h-full object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => {
                                setLogoFile(null);
                                const originalLogo = vendor?.logo || vendor?.logoUrl || miniWebsite?.logo || miniWebsite?.logoUrl || "";
                                setLogoPreview(originalLogo);
                                setLogo(originalLogo);
                              }}
                            >
                              ✕
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white border-2"
                              onClick={handleEditLogo}
                              title="Edit logo"
                            >
                              ✏️
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary" className="text-xs">
                              {logoFile ? "Custom Upload" : "Profile Logo"}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-32 h-32 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <label className="cursor-pointer flex flex-col items-center gap-1">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Upload Logo</span>
                            <Input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const result = reader.result as string;
                                    setImageToEdit(result);
                                    setShowImageEditor(true);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {logoPreview ? "✓ Logo will appear on shared greeting" : "Upload your store logo (PNG/JPG)"}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Business Name</label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your Business Name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Location</label>
                    <Input
                      value={businessLocation}
                      onChange={(e) => setBusinessLocation(e.target.value)}
                      placeholder="City, State"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Phone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-primary" />
                      <label className="text-xs font-medium text-muted-foreground">MiniWebsite Link</label>
                    </div>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="www.vyora.in/yourstore"
                      className="mt-1"
                    />
                    {miniWebsite?.isPublished && (
                      <p className="text-xs text-green-600 mt-1">✓ Your miniwebsite is live!</p>
                    )}
                    {!miniWebsite?.isPublished && (
                      <p className="text-xs text-amber-600 mt-1">⚠ Set up your miniwebsite to share</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Message */}
              {template.hasEditableText && (
                <div>
                  <label className="text-sm font-medium">Custom Message</label>
                  <Textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add your festive greeting or promotional message..."
                    rows={4}
                    data-testid="textarea-custom-message"
                  />
                </div>
              )}

              {/* Select Products */}
              {template.supportsProducts && vendorProducts.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <label className="text-sm font-medium">Select Products to Feature</label>
                    </div>
                    <Badge variant="secondary">{selectedProducts.length} selected</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose products to showcase in your greeting</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {vendorProducts.slice(0, 20).map((product: any) => (
                      <div key={product.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelection(product.id, selectedProducts, setSelectedProducts)}
                          data-testid={`checkbox-product-${product.id}`}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">₹{product.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Services */}
              {template.supportsServices && vendorServices.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      <label className="text-sm font-medium">Select Services to Feature</label>
                    </div>
                    <Badge variant="secondary">{selectedServices.length} selected</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose services to highlight in your greeting</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {vendorServices.slice(0, 20).map((service: any) => (
                      <div key={service.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() => toggleSelection(service.id, selectedServices, setSelectedServices)}
                          data-testid={`checkbox-service-${service.id}`}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">₹{service.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Offers */}
              {template.supportsOffers && vendorOffers.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <label className="text-sm font-medium">Select Offers & Coupons</label>
                    </div>
                    <Badge variant="secondary">{selectedOffers.length} selected</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose special offers to share with customers</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {vendorOffers.filter((o: any) => o.status === 'active').slice(0, 20).map((offer: any) => (
                      <div key={offer.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedOffers.includes(offer.id)}
                          onCheckedChange={() => toggleSelection(offer.id, selectedOffers, setSelectedOffers)}
                          data-testid={`checkbox-offer-${offer.id}`}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{offer.code}</div>
                          <div className="text-xs text-green-600 font-medium">
                            {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Button */}
              <div className="border-t pt-4">
                <Button
                  className="w-full"
                  onClick={handleDownload}
                  disabled={createUsageMutation.isPending}
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {createUsageMutation.isPending ? "Downloading..." : "Download Template"}
                </Button>
              </div>

              {/* Social Sharing Icons */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Share on Social Media</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* WhatsApp */}
                  <Button
                    variant="outline"
                    className="justify-center"
                    onClick={() => handleShare("whatsapp")}
                    disabled={trackShareMutation.isPending}
                    data-testid="button-share-whatsapp"
                  >
                    <SiWhatsapp className="w-5 h-5 text-[#25D366]" />
                  </Button>

                  {/* Facebook */}
                  <Button
                    variant="outline"
                    className="justify-center"
                    onClick={() => handleShare("facebook")}
                    disabled={trackShareMutation.isPending}
                    data-testid="button-share-facebook"
                  >
                    <SiFacebook className="w-5 h-5 text-[#1877F2]" />
                  </Button>

                  {/* Instagram */}
                  <Button
                    variant="outline"
                    className="justify-center"
                    onClick={() => handleShare("instagram")}
                    disabled={trackShareMutation.isPending}
                    data-testid="button-share-instagram"
                  >
                    <SiInstagram className="w-5 h-5 text-[#E4405F]" />
                  </Button>

                  {/* Twitter */}
                  <Button
                    variant="outline"
                    className="justify-center"
                    onClick={() => handleShare("twitter")}
                    disabled={trackShareMutation.isPending}
                    data-testid="button-share-twitter"
                  >
                    <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                  </Button>

                  {/* LinkedIn */}
                  <Button
                    variant="outline"
                    className="justify-center"
                    onClick={() => handleShare("linkedin")}
                    disabled={trackShareMutation.isPending}
                    data-testid="button-share-linkedin"
                  >
                    <SiLinkedin className="w-5 h-5 text-[#0A66C2]" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Editor Dialog */}
      <ImageEditorDialog
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
        imageSrc={imageToEdit}
        onSave={handleLogoSave}
        aspectRatio={1} // Square aspect ratio for logos
      />
    </div>
  );
}
