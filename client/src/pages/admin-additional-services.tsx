import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Plus, Edit, Trash2, Search, Crown, CheckCircle2, Clock, XCircle,
  ArrowLeft, Image as ImageIcon, X, Upload, Phone, Mail, Building2,
  User, Package, MessageSquare, Sparkles, Eye, ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import type { AdditionalService, AdditionalServiceInquiry } from "@shared/schema";

export default function AdminAdditionalServices() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdditionalService | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "inquiries">("services");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    icon: "💼",
    category: "",
    price: "",
    features: [] as string[],
    benefits: [] as string[],
    images: [] as string[],
  });
  const [featureInput, setFeatureInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch services
  const { data: services = [], isLoading } = useQuery<AdditionalService[]>({
    queryKey: ["/api/admin/additional-services"],
    queryFn: async () => {
      const response = await fetch("/api/admin/additional-services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  // Fetch inquiries
  const { data: inquiries = [] } = useQuery<AdditionalServiceInquiry[]>({
    queryKey: ["/api/admin/additional-service-inquiries"],
    queryFn: async () => {
      const response = await fetch("/api/admin/additional-service-inquiries");
      if (!response.ok) throw new Error("Failed to fetch inquiries");
      return response.json();
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingService
        ? `/api/admin/additional-services/${editingService.id}`
        : "/api/admin/additional-services";
      const method = editingService ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: data.price ? parseInt(data.price) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save service");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/additional-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/additional-services"] });
      toast({ title: editingService ? "Service updated" : "Service created" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/additional-services/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/additional-services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/additional-services"] });
      toast({ title: "Service deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete service", variant: "destructive" });
    },
  });

  // Update inquiry status mutation
  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/additional-service-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) throw new Error("Failed to update inquiry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/additional-service-inquiries"] });
      toast({ title: "Inquiry updated" });
    },
    onError: () => {
      toast({ title: "Failed to update inquiry", variant: "destructive" });
    },
  });

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 4) {
      toast({ title: "Maximum 4 images allowed", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const newImages: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({ title: `${file.name} is not an image`, variant: "destructive" });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: `${file.name} is too large (max 5MB)`, variant: "destructive" });
          continue;
        }

        // Upload to Supabase S3
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append('category', 'additional-services');

        const response = await fetch('/api/upload/public-product-image', {
          method: 'POST',
          body: formDataObj,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const result = await response.json();
        newImages.push(result.url);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));

      toast({ title: `${newImages.length} image(s) uploaded successfully` });
    } catch (error) {
      toast({ title: "Failed to upload images", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleOpenDialog = (service?: AdditionalService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || "",
        shortDescription: service.shortDescription || "",
        icon: service.icon || "💼",
        category: service.category || "",
        price: service.price?.toString() || "",
        features: service.features || [],
        benefits: service.benefits || [],
        images: service.images || [],
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        shortDescription: "",
        icon: "💼",
        category: "",
        price: "",
        features: [],
        benefits: [],
        images: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
    setFeatureInput("");
    setBenefitInput("");
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({ ...formData, benefits: [...formData.benefits, benefitInput.trim()] });
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({ ...formData, benefits: formData.benefits.filter((_, i) => i !== index) });
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInquiries = inquiries.filter(i => 
    statusFilter === "all" || i.status === statusFilter
  );

  // Stats
  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
    pendingInquiries: inquiries.filter(i => i.status === "pending").length,
    totalInquiries: inquiries.length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "contacted":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Phone className="h-3 w-3 mr-1" />Contacted</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || "Unknown Service";
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Additional Services
              </h1>
              <p className="text-xs text-muted-foreground">Manage premium services</p>
            </div>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-lg">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{stats.totalServices}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200/50 dark:bg-green-800/50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.activeServices}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200/50 dark:bg-amber-800/50 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.pendingInquiries}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-200/50 dark:bg-purple-800/50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Inquiries</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{stats.totalInquiries}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="services" className="gap-1.5">
              <Package className="h-4 w-4" />
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Inquiries ({stats.pendingInquiries})
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : filteredServices.length === 0 ? (
                <Card className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No services found</p>
                  <Button onClick={() => handleOpenDialog()} className="mt-4">
                    Create First Service
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="overflow-hidden flex flex-col">
                      {/* Service Image */}
                      {service.images && service.images.length > 0 ? (
                        <div className="h-32 bg-muted overflow-hidden">
                          <img
                            src={service.images[0]}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                          <span className="text-4xl">{service.icon}</span>
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base line-clamp-1">{service.name}</CardTitle>
                          {!service.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        {service.shortDescription && (
                          <CardDescription className="line-clamp-2">{service.shortDescription}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          {service.price && (
                            <p className="text-lg font-bold text-primary">₹{service.price.toLocaleString()}</p>
                          )}
                          {service.category && (
                            <Badge variant="outline" className="text-[10px]">{service.category}</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(service)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this service?")) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Status Filter */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-2 min-w-max">
                {["all", "pending", "contacted", "completed", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    className="h-8 text-xs capitalize"
                  >
                    {status === "all" ? "All" : status}
                    {status === "pending" && stats.pendingInquiries > 0 && (
                      <Badge className="ml-1.5 h-4 px-1 text-[10px]" variant="secondary">
                        {stats.pendingInquiries}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredInquiries.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No inquiries found</p>
                </Card>
              ) : (
                <div className="space-y-3 pb-4">
                  {filteredInquiries.map((inquiry) => (
                    <Card key={inquiry.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold">{getServiceName(inquiry.serviceId)}</h3>
                            <p className="text-sm text-muted-foreground">
                              From {inquiry.businessName || inquiry.vendorName}
                            </p>
                          </div>
                          {getStatusBadge(inquiry.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{inquiry.vendorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{inquiry.vendorPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{inquiry.vendorEmail}</span>
                          </div>
                        </div>

                        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Requirement:</p>
                          <p className="text-sm">{inquiry.requirement}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>Submitted: {format(new Date(inquiry.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                          {inquiry.contactedAt && (
                            <span>Contacted: {format(new Date(inquiry.contactedAt), "MMM d")}</span>
                          )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(`tel:${inquiry.vendorPhone}`)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              const whatsapp = inquiry.vendorWhatsapp || inquiry.vendorPhone;
                              window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`);
                            }}
                          >
                            💬 WhatsApp
                          </Button>
                          {inquiry.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => updateInquiryMutation.mutate({ id: inquiry.id, status: "contacted" })}
                            >
                              Mark Contacted
                            </Button>
                          )}
                          {inquiry.status === "contacted" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateInquiryMutation.mutate({ id: inquiry.id, status: "completed" })}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Create Additional Service"}
            </DialogTitle>
            <DialogDescription>
              Create premium services that vendors can purchase
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Service Images (Max 4)</Label>
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Upload images to showcase your service. Max 5MB per image.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Support"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💼"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief one-line description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Detailed description of the service..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Support, Marketing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  placeholder="Add feature..."
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {feature}
                    <button onClick={() => removeFeature(index)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Benefits</Label>
              <div className="flex gap-2">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                  placeholder="Add benefit..."
                />
                <Button type="button" onClick={addBenefit} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {benefit}
                    <button onClick={() => removeBenefit(index)} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.name || !formData.description}
            >
              {saveMutation.isPending ? "Saving..." : editingService ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
