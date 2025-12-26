import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Edit, Trash2, Plus, Search, Copy, ArrowLeft, Eye, 
  ToggleLeft, ToggleRight, Star, Clock, MapPin, Package,
  ChevronRight, Filter, SlidersHorizontal, ImageIcon, Grid3X3, List
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceListingForm from "@/components/ServiceListingForm";
import type { VendorCatalogue, MasterService, Category, Subcategory } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { LoadingSpinner } from "@/components/AuthGuard";
import { Lock } from "lucide-react";

export default function VendorServicesCatalogue() {
  const [, setLocation] = useLocation();
  const { vendorId } = useAuth();
  
  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden shrink-0 -ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Services</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Manage your service catalogue</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="my-catalogue" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="my-catalogue" className="text-sm">My Catalogue</TabsTrigger>
              <TabsTrigger value="browse-services" className="text-sm">Browse Services</TabsTrigger>
        </TabsList>
          </div>
        
          <TabsContent value="my-catalogue" className="flex-1 mt-0">
          <MyCatalogueTab vendorId={vendorId} />
        </TabsContent>
        
          <TabsContent value="browse-services" className="flex-1 mt-0">
          <BrowseServicesTab vendorId={vendorId} />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// My Catalogue Tab Content
function MyCatalogueTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<VendorCatalogue | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Pro subscription check
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<'create' | 'update' | 'delete'>('create');

  const { data: catalogue = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/catalogue`, {
        ...data,
        vendorId: vendorId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service created successfully" });
      setIsDialogOpen(false);
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Failed to create service", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/vendor-catalogue/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service updated successfully" });
      setIsDialogOpen(false);
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/vendor-catalogue/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service removed from catalogue" });
    },
    onError: () => {
      toast({ title: "Failed to remove service", variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/vendor-catalogue/${id}/duplicate`, {});
      return response.json();
    },
    onSuccess: (data: VendorCatalogue) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service duplicated successfully" });
      setEditingService(data);
      setIsDialogOpen(true);
    },
    onError: () => {
      toast({ title: "Failed to duplicate service", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/vendor-catalogue/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  const handleFormSubmit = (data: any) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: VendorCatalogue) => {
    // PRO SUBSCRIPTION CHECK - Block edit for non-Pro users
    const actionCheck = canPerformAction('update');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] Service edit blocked - User is not Pro');
      setBlockedAction('update');
      setShowUpgradeModal(true);
      return;
    }
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // PRO SUBSCRIPTION CHECK - Block delete for non-Pro users
    const actionCheck = canPerformAction('delete');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] Service delete blocked - User is not Pro');
      setBlockedAction('delete');
      setShowUpgradeModal(true);
      return;
    }
    if (confirm("Are you sure you want to remove this service from your catalogue?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    // PRO SUBSCRIPTION CHECK - Block duplicate for non-Pro users
    const actionCheck = canPerformAction('create');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] Service duplicate blocked - User is not Pro');
      setBlockedAction('create');
      setShowUpgradeModal(true);
      return;
    }
    duplicateMutation.mutate(id);
  };

  const handleCreateNew = () => {
    // PRO SUBSCRIPTION CHECK - Block create for non-Pro users
    const actionCheck = canPerformAction('create');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] Service create blocked - User is not Pro');
      setBlockedAction('create');
      setShowUpgradeModal(true);
      return;
    }
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (id: string) => {
    setLocation(`/vendor/services/${id}`);
  };

  if (!vendorId) { return <LoadingSpinner />; }

  const filteredSubcategoriesForFilter = categoryFilter !== "all"
    ? subcategories.filter(sub => sub.categoryId === categoryFilter)
    : subcategories;

  const filteredServices = catalogue
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === "all" || service.categoryId === categoryFilter;
      const matchesSubcategory = subcategoryFilter === "all" || service.subcategoryId === subcategoryFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && service.isActive) || (statusFilter === "inactive" && !service.isActive);

      return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeServices = catalogue.filter(item => item.isActive);
  const inactiveServices = catalogue.filter(item => !item.isActive);

  return (
    <div className="p-4 space-y-4 pb-24 md:pb-4">
      {/* Stats Cards - Desktop Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-sm rounded-xl min-h-[var(--card-min-h)]">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Services</p>
          <p className="text-xl md:text-2xl font-bold">{catalogue.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-0 shadow-sm rounded-xl min-h-[var(--card-min-h)]">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Active</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeServices.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-0 shadow-sm rounded-xl min-h-[var(--card-min-h)]">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Inactive</p>
          <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300">{inactiveServices.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-0 shadow-sm rounded-xl min-h-[var(--card-min-h)]">
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mb-1">Filtered</p>
          <p className="text-xl md:text-2xl font-bold text-violet-700 dark:text-violet-300">{filteredServices.length}</p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-[var(--input-h)] text-sm"
              />
            </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setSubcategoryFilter("all");
            }}>
            <SelectTrigger className="w-[140px] h-[var(--input-h)] text-sm shrink-0">
              <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-[var(--input-h)] text-sm shrink-0">
              <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          <div className="hidden md:flex border rounded-xl">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-[var(--input-h)] w-11 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-[var(--input-h)] w-11 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleCreateNew} className="h-[var(--input-h)] px-4 shrink-0 text-sm">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Service</span>
            {!isPro && <Lock className="h-3.5 w-3.5 ml-1.5 opacity-60" />}
          </Button>
        </div>
      </div>

      {/* Services Grid */}
        {filteredServices.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {catalogue.length === 0 ? "No services yet" : "No matching services"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {catalogue.length === 0 
                ? "Start by adding your first service to the catalogue" 
                : "Try adjusting your filters or search term"}
            </p>
            {catalogue.length === 0 && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            )}
          </div>
          </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((service) => (
            <ServiceCard 
              key={service.id}
              service={service}
              onView={() => handleViewDetails(service.id)}
              onEdit={() => handleEdit(service)}
              onDuplicate={() => handleDuplicate(service.id)}
              onDelete={() => handleDelete(service.id)}
              onToggle={() => toggleActiveMutation.mutate({ id: service.id, isActive: !service.isActive })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <ServiceListItem 
              key={service.id}
              service={service}
              onView={() => handleViewDetails(service.id)}
              onEdit={() => handleEdit(service)}
              onDuplicate={() => handleDuplicate(service.id)}
              onDelete={() => handleDelete(service.id)}
              onToggle={() => toggleActiveMutation.mutate({ id: service.id, isActive: !service.isActive })}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog - Full Screen on Mobile, Scrollable on Desktop */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[100vh] md:max-h-[95vh] h-full md:h-[95vh] flex flex-col p-0 md:p-6 gap-0 overflow-hidden">
          <DialogHeader className="hidden md:block px-0 pb-4 shrink-0">
            <DialogTitle className="text-2xl">
              {editingService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
            <ServiceListingForm
              initialData={editingService || {}}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingService(null);
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              mode={editingService ? "edit" : "create"}
              userType="vendor"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pro Subscription Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.location.href = '/vendor/account';
        }}
      />
    </div>
  );
}

// Helper function to get duration display
function getDurationDisplay(service: any): string | null {
  if (service.durationType === "fixed" && service.durationValue) {
    return `${service.durationValue} ${service.durationUnit || "min"}`;
  }
  if (service.durationType === "variable" && service.durationMin && service.durationMax) {
    return `${service.durationMin}-${service.durationMax} ${service.durationUnit || "min"}`;
  }
  if (service.durationType === "session" && service.sessionCount) {
    return `${service.sessionCount} sessions`;
  }
  if (service.durationType === "project" && service.durationMin && service.durationMax) {
    return `${service.durationMin}-${service.durationMax} days`;
  }
  if (service.durationType === "long" && service.durationValue) {
    return `${service.durationValue} ${service.durationUnit || "days"}`;
  }
  return null;
}

// Helper function to get pricing type display
function getPricingTypeLabel(pricingType: string | undefined): string {
  const types: Record<string, string> = {
    "per-service": "One-time",
    "price-range": "Price Range",
    "hourly": "Per Hour",
    "daily": "Per Day",
    "weekly": "Per Week",
    "monthly": "Per Month",
    "per-session": "Per Session",
    "per-person": "Per Person",
    "package": "Package",
  };
  return types[pricingType || "per-service"] || "";
}

// Service Card Component
function ServiceCard({ 
  service, 
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggle 
}: {
  service: VendorCatalogue;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const hasImage = service.images && service.images.length > 0;
  const displayImage = hasImage ? service.images[0] : null;
  const serviceData = service as any;
  const duration = getDurationDisplay(serviceData);
  const pricingTypeLabel = getPricingTypeLabel(serviceData.pricingType);
  const timeSlots = serviceData.availableTimeSlots || [];
  const availableDays = serviceData.availableDays || [];

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm rounded-xl"
      onClick={onView}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {service.icon ? (
              <span className="text-5xl">{service.icon}</span>
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            className={service.isActive 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0" 
              : "bg-slate-500 hover:bg-slate-600 text-white border-0"
            }
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Duration Badge on Image */}
        {duration && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 gap-1">
              <Clock className="h-3 w-3" />
              {duration}
            </Badge>
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-2.5">
        {/* Category */}
        <Badge variant="outline" className="text-xs font-normal">
          {service.category}
        </Badge>

        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
          {service.name}
        </h3>

        {/* Price with Pricing Type - One Line */}
        <div className="flex items-center gap-1.5 text-sm">
          {service.offerPrice && service.offerPrice < service.price ? (
            <>
              <span className="font-bold text-primary">₹{service.offerPrice}</span>
              <span className="text-muted-foreground line-through text-xs">₹{service.price}</span>
            </>
          ) : (
            <span className="font-bold">₹{service.price}</span>
          )}
          {pricingTypeLabel && <span className="text-muted-foreground">/{pricingTypeLabel}</span>}
          {duration && <span className="text-muted-foreground">• {duration}</span>}
        </div>

        {/* Key Info - One Line Each */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {availableDays.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3 w-3 shrink-0" />
              <span>{availableDays.length} days/week • {timeSlots.length || 0} time slots</span>
            </div>
          )}
          {serviceData.deliveryModes && serviceData.deliveryModes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>
                {serviceData.deliveryModes.includes("business-location") && "At Business"}
                {serviceData.deliveryModes.includes("business-location") && serviceData.deliveryModes.includes("home-service") && " • "}
                {serviceData.deliveryModes.includes("home-service") && "Home Service"}
              </span>
            </div>
          )}
          {serviceData.gstIncluded && (
            <div className="flex items-center gap-1.5">
              <span>Incl. {serviceData.taxPercentage}% GST</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {service.shortDescription || service.description || "No description available"}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={service.isActive ? "outline" : "default"}
            size="sm"
            className="flex-1 h-9 text-xs"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            {service.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Service List Item Component
function ServiceListItem({ 
  service, 
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggle 
}: {
  service: VendorCatalogue;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const hasImage = service.images && service.images.length > 0;
  const displayImage = hasImage ? service.images[0] : null;
  const serviceData = service as any;
  const duration = getDurationDisplay(serviceData);
  const pricingTypeLabel = getPricingTypeLabel(serviceData.pricingType);
  const timeSlots = serviceData.availableTimeSlots || [];
  const availableDays = serviceData.availableDays || [];

  return (
    <Card 
      className="group overflow-hidden hover:shadow-md transition-all cursor-pointer rounded-xl"
      onClick={onView}
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl bg-muted overflow-hidden shrink-0">
          {displayImage ? (
            <img
              src={displayImage}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {service.icon ? (
                <span className="text-3xl">{service.icon}</span>
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
          )}
          {/* Duration Badge */}
          {duration && (
            <div className="absolute bottom-1 left-1 right-1">
              <Badge className="bg-black/70 backdrop-blur-sm text-white border-0 gap-1 text-[10px] w-full justify-center">
                <Clock className="h-2.5 w-2.5" />
                {duration}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-normal shrink-0">
                  {service.category}
                </Badge>
                <Badge 
                  className={`shrink-0 text-xs border-0 ${service.isActive 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-500 text-white"
                  }`}
                >
                  {service.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
            </div>
            <div className="text-right shrink-0">
              {service.offerPrice && service.offerPrice < service.price ? (
                <span className="text-lg font-bold text-primary">₹{service.offerPrice}</span>
              ) : (
                <span className="text-lg font-bold">₹{service.price}</span>
              )}
              {pricingTypeLabel && <span className="text-xs text-muted-foreground">/{pricingTypeLabel}</span>}
            </div>
          </div>

          {/* Key Info - One Line */}
          <div className="text-xs text-muted-foreground">
            <span>
              {duration && `${duration}`}
              {duration && availableDays.length > 0 && " • "}
              {availableDays.length > 0 && `${availableDays.length} days/week`}
              {(duration || availableDays.length > 0) && timeSlots.length > 0 && " • "}
              {timeSlots.length > 0 && `${timeSlots.length} slots`}
            </span>
          </div>

          {/* Delivery Mode & Description - One Line Each */}
          {serviceData.deliveryModes && serviceData.deliveryModes.includes("home-service") && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>Home Service Available</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground line-clamp-1">
            {service.shortDescription || service.description || "No description available"}
          </p>

          <div className="flex items-center justify-between pt-0.5">
            {serviceData.gstIncluded && (
              <span className="text-[10px] text-muted-foreground">Incl. {serviceData.taxPercentage}% GST</span>
            )}
            {!serviceData.gstIncluded && <span></span>}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                {service.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Browse Services Tab Content
function BrowseServicesTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: masterServices = [] } = useQuery<MasterService[]>({
    queryKey: ["/api/master-services"],
  });

  const { data: vendorCatalogue = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const addToCatalogueMutation = useMutation({
    mutationFn: async (service: MasterService) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/catalogue`, {
        vendorId: vendorId,
        masterServiceId: service.id,
        name: service.name,
        category: service.category,
        categoryId: service.categoryId,
        subcategory: service.subcategory,
        subcategoryId: service.subcategoryId,
        icon: service.icon,
        description: service.description,
        shortDescription: service.shortDescription,
        detailedDescription: service.detailedDescription,
        benefits: service.benefits,
        features: service.features,
        highlights: service.highlights,
        inclusions: service.inclusions,
        exclusions: service.exclusions,
        tags: service.tags,
        price: service.basePrice || 0,
        offerPrice: service.offerPrice,
        taxPercentage: service.taxPercentage,
        gstIncluded: service.gstIncluded,
        availableDays: service.availableDays,
        availableTimeSlots: service.availableTimeSlots,
        bookingRequired: service.bookingRequired,
        freeTrialAvailable: service.freeTrialAvailable,
        packageName: service.packageName,
        packageType: service.packageType,
        packageDuration: service.packageDuration,
        packageSessions: service.packageSessions,
        tagline: service.tagline,
        promotionalCaption: service.promotionalCaption,
        serviceType: service.serviceType,
        customUnit: service.customUnit,
        sampleType: service.sampleType,
        tat: service.tat,
        isActive: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service added to your catalogue!" });
    },
    onError: () => {
      toast({ title: "Failed to add service", variant: "destructive" });
    },
  });

  const handleViewDetails = (id: string) => {
    setLocation(`/vendor/services/${id}`);
  };

  const filteredServices = masterServices
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || service.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isServiceAdded = (serviceId: string) => {
    return vendorCatalogue.some((item: VendorCatalogue) => item.masterServiceId === serviceId);
  };

  return (
    <div className="p-4 space-y-4 pb-24 md:pb-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
            placeholder="Search master services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-[var(--input-h)] text-sm"
              />
            </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-[var(--input-h)] text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

      {/* Services Grid */}
        {filteredServices.length === 0 ? (
        <Card className="p-12 text-center">
            <p className="text-muted-foreground">No services found in master catalogue</p>
          </Card>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((service) => {
            const added = isServiceAdded(service.id);
            const hasImage = service.images && service.images.length > 0;
            const displayImage = hasImage ? service.images[0] : null;

            return (
              <Card 
                key={service.id} 
                className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm rounded-xl"
                onClick={() => handleViewDetails(service.id)}
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {service.icon ? (
                        <span className="text-5xl">{service.icon}</span>
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                  
                  {added && (
                    <Badge className="absolute top-3 right-3 bg-emerald-500 text-white">
                      ✓ Added
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <Badge variant="outline" className="text-xs font-normal">
                    {service.category}
                  </Badge>

                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.shortDescription || service.description}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">₹{service.basePrice}</span>
                    <span className="text-xs text-muted-foreground">base price</span>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCatalogueMutation.mutate(service);
                    }}
                    disabled={added || addToCatalogueMutation.isPending}
                    variant={added ? "secondary" : "default"}
                    className="w-full h-[var(--cta-h)] text-sm"
                  >
                    {added ? "✓ Added" : "Add to Catalogue"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}
    </div>
  );
}
