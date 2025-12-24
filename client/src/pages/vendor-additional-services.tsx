import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, Crown, MessageSquare, CheckCircle2, ArrowLeft, 
  Star, Sparkles, Clock, ChevronRight, History, Filter,
  Phone, Mail, Building2, User, FileText, TrendingUp, 
  Package, Zap, Shield, Eye
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import type { AdditionalService, AdditionalServiceInquiry, Vendor } from "@shared/schema";

export default function VendorAdditionalServices() {
  const { toast } = useToast();
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AdditionalService | null>(null);
  const [requirement, setRequirement] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "history">("services");

  // Fetch vendor details
  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}`));
      if (!response.ok) throw new Error("Failed to fetch vendor");
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch active services
  const { data: services = [], isLoading } = useQuery<AdditionalService[]>({
    queryKey: ["/api/additional-services"],
    queryFn: async () => {
      const response = await fetch(getApiUrl("/api/additional-services"));
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  // Fetch vendor's inquiries (history)
  const { data: myInquiries = [], isLoading: isLoadingInquiries } = useQuery<AdditionalServiceInquiry[]>({
    queryKey: [`/api/vendors/${vendorId}/additional-service-inquiries`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/additional-service-inquiries`));
      if (!response.ok) throw new Error("Failed to fetch inquiries");
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Submit inquiry mutation
  const submitInquiryMutation = useMutation({
    mutationFn: async (data: { serviceId: string; requirement: string }) => {
      if (!vendor || !vendorId) throw new Error("Vendor information not available");

      const response = await fetch(getApiUrl("/api/additional-service-inquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: data.serviceId,
          vendorId: vendorId,
          vendorName: vendor.ownerName,
          vendorEmail: vendor.email,
          vendorPhone: vendor.phone,
          vendorWhatsapp: vendor.whatsappNumber,
          businessName: vendor.businessName,
          requirement: data.requirement,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to submit inquiry");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/additional-service-inquiries"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/additional-service-inquiries`] });
      toast({ title: "Inquiry submitted successfully", description: "We'll contact you soon!" });
      setContactDialogOpen(false);
      setSelectedService(null);
      setRequirement("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = services.map(s => s.category).filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(cats))];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    let result = services;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(s => s.category === categoryFilter);
    }

    return result;
  }, [services, search, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const pending = myInquiries.filter(i => i.status === "pending").length;
    const contacted = myInquiries.filter(i => i.status === "contacted").length;
    const completed = myInquiries.filter(i => i.status === "completed").length;
    return { pending, contacted, completed, total: myInquiries.length };
  }, [myInquiries]);

  const handleContactUs = (service: AdditionalService) => {
    setSelectedService(service);
    setRequirement("");
    setContactDialogOpen(true);
  };

  const handleSubmitInquiry = () => {
    if (!selectedService) return;
    if (!requirement.trim()) {
      toast({
        title: "Validation Error",
        description: "Please describe your requirements",
        variant: "destructive",
      });
      return;
    }
    submitInquiryMutation.mutate({
      serviceId: selectedService.id,
      requirement: requirement.trim(),
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-5"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "contacted":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 h-5"><Phone className="h-3 w-3 mr-1" />Contacted</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-5"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-5">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 h-5">{status}</Badge>;
    }
  };

  // Get service name for inquiry
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
              onClick={() => setLocation("/vendor/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Additional Services
              </h1>
              <p className="text-xs text-muted-foreground">Premium services for your business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 rounded-xl min-h-[var(--card-min-h)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-xl">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Available</p>
                <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400">{services.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 rounded-xl min-h-[var(--card-min-h)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200/50 dark:bg-amber-800/50 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending</p>
                <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 rounded-xl min-h-[var(--card-min-h)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-200/50 dark:bg-purple-800/50 rounded-xl">
                <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Contacted</p>
                <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.contacted}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 rounded-xl min-h-[var(--card-min-h)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200/50 dark:bg-green-800/50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 pb-20 md:pb-6 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-[var(--input-h)]">
            <TabsTrigger value="services" className="gap-1.5 text-sm">
              <Package className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-sm">
              <History className="h-4 w-4" />
              My Requests
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              {categories.length > 2 && (
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-2 min-w-max">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={categoryFilter === cat ? "default" : "outline"}
                        onClick={() => setCategoryFilter(cat)}
                        className="h-8 text-xs capitalize"
                      >
                        {cat === "all" ? "All" : cat}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Services Grid */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : filteredServices.length === 0 ? (
                <Card className="p-8 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No services found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search ? "Try adjusting your search" : "Check back later for new services"}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {filteredServices.map((service) => (
                    <Card
                      key={service.id}
                      className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer rounded-xl"
                      onClick={() => setLocation(`/vendor/additional-services/${service.id}`)}
                    >
                      {/* Service Image */}
                      {service.images && service.images.length > 0 ? (
                        <div className="h-40 bg-muted overflow-hidden">
                          <img
                            src={service.images[0]}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                          <span className="text-5xl">{service.icon}</span>
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1">{service.name}</CardTitle>
                            {service.shortDescription && (
                              <CardDescription className="line-clamp-1 mt-1">
                                {service.shortDescription}
                              </CardDescription>
                            )}
                          </div>
                          {service.category && (
                            <Badge variant="outline" className="shrink-0 ml-2 text-[10px]">
                              {service.category}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col pt-0">
                        {/* Features Preview */}
                        {service.features && service.features.length > 0 && (
                          <div className="mb-3">
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {service.features.slice(0, 2).map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                  <span className="line-clamp-1">{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {service.features.length > 2 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                +{service.features.length - 2} more features
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-3 border-t">
                          {service.price ? (
                            <p className="text-xl font-bold text-primary">
                              ₹{service.price.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Contact for pricing</p>
                          )}
                          <Button size="sm" className="gap-1.5 h-9 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-auto space-y-4">
            {isLoadingInquiries ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : myInquiries.length === 0 ? (
              <Card className="p-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your service inquiries will appear here
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("services")}
                >
                  Browse Services
                </Button>
              </Card>
            ) : (
              <div className="space-y-3 pb-4">
                {myInquiries.map((inquiry) => (
                  <Card key={inquiry.id} className="overflow-hidden rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold truncate">{getServiceName(inquiry.serviceId)}</h3>
                            {getStatusBadge(inquiry.status)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {inquiry.requirement}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
                            </span>
                            {inquiry.contactedAt && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Contacted: {format(new Date(inquiry.contactedAt), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocation(`/vendor/additional-services/${inquiry.serviceId}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      {inquiry.adminNotes && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response:</p>
                          <p className="text-sm">{inquiry.adminNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Us Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Contact Us
            </DialogTitle>
            <DialogDescription>
              {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {vendor && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Business</p>
                    <p className="font-medium">{vendor.businessName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{vendor.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{vendor.email}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="requirement">Describe Your Requirements *</Label>
              <Textarea
                id="requirement"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                rows={5}
                placeholder="Please describe what you're looking for, your specific needs, timeline, budget (if applicable), and any other relevant details..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide as much detail as possible to help us serve you better
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setContactDialogOpen(false)} className="h-[var(--cta-h)] text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInquiry}
              disabled={submitInquiryMutation.isPending || !requirement.trim()}
              className="h-[var(--cta-h)] text-sm"
            >
              {submitInquiryMutation.isPending ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
