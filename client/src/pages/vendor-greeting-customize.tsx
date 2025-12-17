import { useState, useEffect, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Share2, Send, Twitter, Package, ShoppingBag, Tag, Globe, Store, ImageIcon, Upload, Loader2, Copy, Check, Smartphone, Monitor, Square, RectangleVertical, RectangleHorizontal, Hash, Smile } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram, SiLinkedin, SiTelegram } from "react-icons/si";
import type { GreetingTemplate } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { ImageEditorDialog } from "@/components/ImageEditorDialog";

// Download size options
const downloadSizeOptions = [
  { value: "instagram_post", label: "Instagram Post", size: "1080x1080", icon: Square },
  { value: "instagram_story", label: "Instagram Story", size: "1080x1920", icon: RectangleVertical },
  { value: "whatsapp_status", label: "WhatsApp Status", size: "1080x1920", icon: RectangleVertical },
  { value: "facebook_post", label: "Facebook Post", size: "1200x630", icon: RectangleHorizontal },
  { value: "twitter", label: "Twitter", size: "1200x675", icon: RectangleHorizontal },
];

// Hashtag suggestions
const hashtagSuggestions = [
  "#offers", "#deals", "#discount", "#sale", "#festival", "#celebration",
  "#shopping", "#business", "#local", "#quality", "#service", "#india",
  "#trending", "#viral", "#bestdeals", "#specialoffer", "#limitedtime"
];

// Emoji picker for quick access
const quickEmojis = ["🎉", "🔥", "⭐", "💯", "🎁", "❤️", "✨", "👍", "🙌", "💰", "🛒", "📣"];

export default function VendorGreetingCustomize() {
  const params = useParams<{ vendorId: string; templateId: string }>();
  const templateId = params.templateId || "";
  const { vendorId: hookVendorId } = useAuth();
  
  // Get vendor ID from params or localStorage
  const vendorId = params.vendorId || hookVendorId;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [customText, setCustomText] = useState("");
  const [businessName, setBusinessName] = useState("My Business");
  const [businessLocation, setBusinessLocation] = useState("Mumbai, India");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("+91 9876543210");
  const [logo, setLogo] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [selectedDownloadSize, setSelectedDownloadSize] = useState("instagram_post");
  const [copied, setCopied] = useState(false);

  // Image editor state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string>("");

  // Handle edited image save
  const handleLogoSave = (editedImage: string) => {
    setLogoPreview(editedImage);
    setLogo(editedImage);
    setLogoFile(null);
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

  // Character count
  const characterCount = customText.length;
  const maxCharacters = 2200; // Instagram limit

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
    if (vendor) {
      const name = vendor.businessName || vendor.name || "My Business";
      const location = vendor.address || vendor.city || vendor.location || "India";
      const phoneNumber = vendor.phone || vendor.contactNumber || "+91 9876543210";
      
      setBusinessName(name);
      setBusinessLocation(location);
      setPhone(phoneNumber);
      
      // Auto-fill logo from vendor profile or miniwebsite
      const vendorLogo = vendor.logo || vendor.logoUrl || miniWebsite?.logo || miniWebsite?.logoUrl || "";
      if (vendorLogo) {
        setLogo(vendorLogo);
        setLogoPreview(vendorLogo);
      }
    }
    
    // Auto-fill miniwebsite link
    if (miniWebsite) {
      let miniWebsiteUrl = "";
      
      if (miniWebsite.isPublished || miniWebsite.status === 'published') {
        if (miniWebsite.customDomain) {
          miniWebsiteUrl = `https://${miniWebsite.customDomain}`;
        } else if (miniWebsite.slug) {
          miniWebsiteUrl = `https://vyora.in/${miniWebsite.slug}`;
        } else if (miniWebsite.subdomain) {
          miniWebsiteUrl = `https://${miniWebsite.subdomain}.vyora.in`;
        } else {
          miniWebsiteUrl = `https://vyora.in/store/${vendorId}`;
        }
        setWebsite(miniWebsiteUrl);
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

  // Add emoji to text
  const addEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = customText.substring(0, start) + emoji + customText.substring(end);
      setCustomText(newText);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setCustomText(prev => prev + emoji);
    }
  };

  // Add hashtag to text
  const addHashtag = (hashtag: string) => {
    if (!customText.includes(hashtag)) {
      setCustomText(prev => prev + (prev ? " " : "") + hashtag);
    }
  };

  // Copy caption to clipboard
  const copyCaption = async () => {
    const captionText = buildShareText();
    await navigator.clipboard.writeText(captionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Caption copied to clipboard!" });
  };

  // Build share text
  const buildShareText = () => {
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
      
    return shareText;
  };

  const handleDownload = async () => {
    try {
      // Create usage record
      await createUsageMutation.mutateAsync({
        templateId,
        vendorId,
        customText: { text: customText, businessName, location: businessLocation, website, phone, logo: logo || logoPreview },
        includedProducts: selectedProducts,
        includedServices: selectedServices,
        includedOffers: selectedOffers,
      });

      // Track download
      await apiRequest("POST", `/api/greeting-templates/${templateId}/download`, {});

      // Download the image
      const response = await fetch(template?.imageUrl || "");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sizeOption = downloadSizeOptions.find(s => s.value === selectedDownloadSize);
      a.download = `${template?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${sizeOption?.value || 'poster'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: `Template downloaded (${sizeOption?.size})`,
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
      // Create usage record if not already created
      const usage = await createUsageMutation.mutateAsync({
        templateId,
        vendorId,
        customText: { text: customText, businessName, location: businessLocation, website, phone, logo: logo || logoPreview },
        includedProducts: selectedProducts,
        includedServices: selectedServices,
        includedOffers: selectedOffers,
      });

      if (!usage || !usage.id) {
        throw new Error("Failed to create usage record");
      }

      // Track share
      await trackShareMutation.mutateAsync({ usageId: usage.id, platform });

      const shareText = buildShareText();
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
        case "telegram":
          url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
          break;
        case "instagram":
          // Instagram doesn't support direct web sharing
          toast({
            title: "Instagram Sharing",
            description: "Download the image and share it via the Instagram app",
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
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/vendors/${vendorId}/greeting`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold truncate">Customize Template</h1>
          <p className="text-muted-foreground text-sm truncate">{template.title}</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Left: Template Preview */}
        <Card className="order-2 lg:order-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden relative">
              <img
                src={template.imageUrl}
                alt={template.title}
                className="w-full h-full object-contain"
              />
              {/* Logo overlay on preview if logo is present */}
              {logoPreview && template.supportsLogo && (
                <div className="absolute top-4 right-4 w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg shadow-xl p-2 flex items-center justify-center border-2 border-white">
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
              {/* Store name overlay */}
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg max-w-[80%]">
                <p className="font-semibold text-sm truncate">{businessName}</p>
                {businessLocation && (
                  <p className="text-xs text-gray-300 truncate">📍 {businessLocation}</p>
                )}
              </div>
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
              <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {template.downloadCount} downloads
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                {template.shareCount} shares
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Customization Options */}
        <Card className="order-1 lg:order-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Customize & Share</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="branding" className="text-xs md:text-sm">
                  <Store className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Branding</span>
                </TabsTrigger>
                <TabsTrigger value="message" className="text-xs md:text-sm">
                  <Send className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Message</span>
                </TabsTrigger>
                <TabsTrigger value="share" className="text-xs md:text-sm">
                  <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </TabsTrigger>
              </TabsList>
                
              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-4">
                  {/* Logo Upload/Preview */}
                  {template.supportsLogo && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" />
                      <label className="text-sm font-medium">Store Logo</label>
                      </div>
                      
                      {logoPreview ? (
                      <div className="flex items-start gap-4">
                        <div className="relative w-24 h-24 border-2 border-dashed border-primary rounded-lg overflow-hidden bg-white flex items-center justify-center p-2">
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
                        </div>
                        <div className="flex-1 space-y-2">
                          <Badge variant="secondary" className="text-xs">
                            {logoFile ? "Custom Upload" : "Profile Logo"}
                          </Badge>
                            <Button
                              type="button"
                              variant="outline"
                            size="sm"
                              onClick={handleEditLogo}
                            >
                            ✏️ Edit Logo
                            </Button>
                          </div>
                        </div>
                      ) : (
                      <div className="relative w-24 h-24 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <label className="cursor-pointer flex flex-col items-center gap-1">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload</span>
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
                    </div>
                  )}
                  
                {/* Business Details */}
                <div className="grid gap-3">
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
                      <label className="text-xs font-medium text-muted-foreground">Website / Store Link</label>
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
                  </div>
                </div>
              </TabsContent>

              {/* Message Tab */}
              <TabsContent value="message" className="space-y-4">
              {/* Custom Message */}
              {template.hasEditableText && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Custom Caption</label>
                      <span className={`text-xs ${characterCount > maxCharacters ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {characterCount}/{maxCharacters}
                      </span>
                    </div>
                  <Textarea
                      ref={textareaRef}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add your festive greeting or promotional message..."
                    rows={4}
                      className="resize-none"
                    />
                    
                    {/* Quick Emoji Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <Smile className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      {quickEmojis.map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg"
                          onClick={() => addEmoji(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>

                    {/* Hashtag Suggestions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Popular Hashtags</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {hashtagSuggestions.slice(0, 8).map((hashtag) => (
                          <Badge
                            key={hashtag}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 text-xs"
                            onClick={() => addHashtag(hashtag)}
                          >
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Copy Caption Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyCaption}
                      className="w-full"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Full Caption
                        </>
                      )}
                    </Button>
                </div>
              )}

              {/* Select Products */}
              {template.supportsProducts && vendorProducts.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                        <label className="text-sm font-medium">Link Products</label>
                    </div>
                    <Badge variant="secondary">{selectedProducts.length} selected</Badge>
                  </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {vendorProducts.slice(0, 20).map((product: any) => (
                      <div key={product.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelection(product.id, selectedProducts, setSelectedProducts)}
                        />
                          <div className="flex-1 text-sm min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">₹{product.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Services */}
              {template.supportsServices && vendorServices.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                        <label className="text-sm font-medium">Link Services</label>
                    </div>
                    <Badge variant="secondary">{selectedServices.length} selected</Badge>
                  </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {vendorServices.slice(0, 20).map((service: any) => (
                      <div key={service.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() => toggleSelection(service.id, selectedServices, setSelectedServices)}
                        />
                          <div className="flex-1 text-sm min-w-0">
                            <div className="font-medium truncate">{service.name}</div>
                          <div className="text-xs text-muted-foreground">₹{service.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Offers */}
              {template.supportsOffers && vendorOffers.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                        <label className="text-sm font-medium">Link Offers</label>
                    </div>
                    <Badge variant="secondary">{selectedOffers.length} selected</Badge>
                  </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {vendorOffers.filter((o: any) => o.status === 'active').slice(0, 20).map((offer: any) => (
                      <div key={offer.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded">
                        <Checkbox
                          checked={selectedOffers.includes(offer.id)}
                          onCheckedChange={() => toggleSelection(offer.id, selectedOffers, setSelectedOffers)}
                        />
                          <div className="flex-1 text-sm min-w-0">
                            <div className="font-medium truncate">{offer.code}</div>
                          <div className="text-xs text-green-600 font-medium">
                            {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </TabsContent>

              {/* Share Tab */}
              <TabsContent value="share" className="space-y-4">
                {/* Download Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Download Size</label>
                  <Select value={selectedDownloadSize} onValueChange={setSelectedDownloadSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {downloadSizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">({option.size})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                <Button
                  className="w-full"
                    variant="outline"
                  onClick={handleDownload}
                  disabled={createUsageMutation.isPending}
                >
                    {createUsageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                  <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Template
                </Button>
              </div>

                {/* Social Sharing */}
                <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Share on Social Media</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                  {/* WhatsApp */}
                  <Button
                    variant="outline"
                      className="flex-col h-auto py-3 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950"
                    onClick={() => handleShare("whatsapp")}
                    disabled={trackShareMutation.isPending}
                  >
                      <SiWhatsapp className="w-6 h-6 text-[#25D366]" />
                      <span className="text-xs mt-1">WhatsApp</span>
                  </Button>

                  {/* Facebook */}
                  <Button
                    variant="outline"
                      className="flex-col h-auto py-3 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
                    onClick={() => handleShare("facebook")}
                    disabled={trackShareMutation.isPending}
                  >
                      <SiFacebook className="w-6 h-6 text-[#1877F2]" />
                      <span className="text-xs mt-1">Facebook</span>
                  </Button>

                  {/* Instagram */}
                  <Button
                    variant="outline"
                      className="flex-col h-auto py-3 hover:bg-pink-50 hover:border-pink-300 dark:hover:bg-pink-950"
                    onClick={() => handleShare("instagram")}
                    disabled={trackShareMutation.isPending}
                    >
                      <SiInstagram className="w-6 h-6 text-[#E4405F]" />
                      <span className="text-xs mt-1">Instagram</span>
                    </Button>

                    {/* Telegram */}
                    <Button
                      variant="outline"
                      className="flex-col h-auto py-3 hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-950"
                      onClick={() => handleShare("telegram")}
                      disabled={trackShareMutation.isPending}
                  >
                      <SiTelegram className="w-6 h-6 text-[#0088cc]" />
                      <span className="text-xs mt-1">Telegram</span>
                  </Button>

                  {/* Twitter */}
                  <Button
                    variant="outline"
                      className="flex-col h-auto py-3 hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-950"
                    onClick={() => handleShare("twitter")}
                    disabled={trackShareMutation.isPending}
                  >
                      <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                      <span className="text-xs mt-1">Twitter</span>
                  </Button>

                  {/* LinkedIn */}
                  <Button
                    variant="outline"
                      className="flex-col h-auto py-3 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
                    onClick={() => handleShare("linkedin")}
                    disabled={trackShareMutation.isPending}
                  >
                      <SiLinkedin className="w-6 h-6 text-[#0A66C2]" />
                      <span className="text-xs mt-1">LinkedIn</span>
                  </Button>
                </div>
              </div>

                {/* Branding Notice */}
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">🔒 Branding Protected</p>
                  <p>Your store logo, name, and website link will be automatically included on all shared templates to maintain brand consistency.</p>
            </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Image Editor Dialog */}
      <ImageEditorDialog
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
        imageSrc={imageToEdit}
        onSave={handleLogoSave}
        aspectRatio={1}
      />
    </div>
  );
}
