import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Plus, Edit, Trash2, Search, Crown, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AdditionalService, AdditionalServiceInquiry } from "@shared/schema";

export default function AdminAdditionalServices() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdditionalService | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    icon: "💼",
    category: "",
    price: "",
    features: [] as string[],
    benefits: [] as string[],
  });
  const [featureInput, setFeatureInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

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
      toast({ title: "Service deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete service", variant: "destructive" });
    },
  });

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
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()],
      });
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      contacted: { variant: "default", icon: CheckCircle2 },
      completed: { variant: "default", icon: CheckCircle2 },
      cancelled: { variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Additional Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage premium services for vendors to purchase
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Service
        </Button>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="inquiries">
            Inquiries ({inquiries.filter((i) => i.status === "pending").length} pending)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center text-muted-foreground">Loading...</div>
            ) : filteredServices.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">
                {search ? "No services found" : "No services created yet"}
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{service.icon}</span>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </div>
                      {!service.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {service.shortDescription && (
                      <CardDescription>{service.shortDescription}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {service.description}
                    </p>
                    {service.price && (
                      <p className="text-lg font-semibold mb-4">₹{service.price.toLocaleString()}</p>
                    )}
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
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-4">
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No inquiries yet
                </CardContent>
              </Card>
            ) : (
              inquiries.map((inquiry) => {
                const service = services.find((s) => s.id === inquiry.serviceId);
                return (
                  <Card key={inquiry.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{service?.name || "Unknown Service"}</CardTitle>
                          <CardDescription>
                            From {inquiry.businessName || inquiry.vendorName}
                          </CardDescription>
                        </div>
                        {getStatusBadge(inquiry.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold">Vendor</p>
                          <p className="text-muted-foreground">{inquiry.vendorName}</p>
                          {inquiry.businessName && (
                            <p className="text-muted-foreground">{inquiry.businessName}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">Contact</p>
                          <p className="text-muted-foreground">{inquiry.vendorEmail}</p>
                          <p className="text-muted-foreground">{inquiry.vendorPhone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Requirement</p>
                        <p className="text-sm text-muted-foreground">{inquiry.requirement}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(`tel:${inquiry.vendorPhone}`)}
                        >
                          📞 Call
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const whatsapp = inquiry.vendorWhatsapp || inquiry.vendorPhone;
                            window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`);
                          }}
                        >
                          💬 WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Create Additional Service"}
            </DialogTitle>
            <DialogDescription>
              Create premium services that vendors can purchase
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="icon">Icon</Label>
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

            <div className="grid grid-cols-2 gap-4">
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
                    <button
                      onClick={() => removeFeature(index)}
                      className="ml-1 hover:text-destructive"
                    >
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
                    <button
                      onClick={() => removeBenefit(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
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


