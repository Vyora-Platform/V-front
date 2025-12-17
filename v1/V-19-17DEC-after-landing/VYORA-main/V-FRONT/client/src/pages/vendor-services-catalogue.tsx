import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Search, Copy, ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComprehensiveServiceForm from "@/components/ComprehensiveServiceForm";
import type { VendorCatalogue, MasterService, Category, Subcategory } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorServicesCatalogue() {
  const [, setLocation] = useLocation();
  
  // Get real vendor ID from localStorage
  const { vendorId } = useAuth();
  
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vendor/dashboard")}
          className="md:hidden flex-shrink-0"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Services</h1>
          <p className="text-xs text-muted-foreground">Manage catalogue</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="my-catalogue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-catalogue" data-testid="tab-my-catalogue">My Catalogue</TabsTrigger>
          <TabsTrigger value="browse-services" data-testid="tab-browse-services">Browse Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-catalogue">
          <MyCatalogueTab vendorId={vendorId} />
        </TabsContent>
        
        <TabsContent value="browse-services">
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
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this service from your catalogue?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleCreateNew = () => {
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (id: string) => {
    setLocation(`/vendor/services/${id}`);
  };


  // Show loading while vendor ID initializes
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">My Services</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage your services and pricing</p>
        </div>
        <Button onClick={handleCreateNew} data-testid="button-create-service" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Services</p>
          <p className="text-xl sm:text-2xl font-bold">{catalogue.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Services</p>
          <p className="text-xl sm:text-2xl font-bold text-chart-2">{activeServices.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Inactive Services</p>
          <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{inactiveServices.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Filtered Results</p>
          <p className="text-xl sm:text-2xl font-bold text-primary">{filteredServices.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
          <div>
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setSubcategoryFilter("all");
            }}>
              <SelectTrigger data-testid="select-category-filter">
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
          <div>
            <Select 
              value={subcategoryFilter} 
              onValueChange={setSubcategoryFilter}
              disabled={categoryFilter === "all"}
            >
              <SelectTrigger data-testid="select-subcategory-filter">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {filteredSubcategoriesForFilter.map(sub => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Services Grid - Urban Company Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServices.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <p className="text-muted-foreground">
              {catalogue.length === 0 ? "No services in your catalogue yet" : "No services match your filters"}
            </p>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="hover:shadow-lg cursor-pointer transition-all overflow-hidden group" 
              onClick={() => handleViewDetails(service.id)}
              data-testid={`service-card-${service.id}`}
            >
              {/* Service Image/Icon */}
              <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <div className="text-6xl">{service.icon}</div>
                {service.isActive ? (
                  <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    Inactive
                  </Badge>
                )}
                {service.serviceType === "package" && (
                  <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
                    Package
                  </Badge>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Service Name */}
                <div>
                  <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{service.category}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                  <span className="text-xs text-muted-foreground">(2.5K)</span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {service.shortDescription || service.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  {service.offerPrice && service.offerPrice < service.price ? (
                    <>
                      <span className="text-xl font-bold text-primary">₹{service.offerPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{service.price}</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold">₹{service.price}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(service);
                      }}
                      data-testid={`button-edit-${service.id}`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(service.id);
                      }}
                      data-testid={`button-duplicate-${service.id}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(service.id);
                      }}
                      data-testid={`button-delete-${service.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant={service.isActive ? "outline" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActiveMutation.mutate({ id: service.id, isActive: !service.isActive });
                    }}
                    data-testid={`button-toggle-${service.id}`}
                    className="w-full"
                  >
                    {service.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
          </DialogHeader>
          <ComprehensiveServiceForm
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Browse Services Tab Content
function BrowseServicesTab({ vendorId }: { vendorId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");

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

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
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
      toast({ title: "Service added to your catalogue successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add service", variant: "destructive" });
    },
  });

  const handleViewDetails = (id: string) => {
    setLocation(`/vendor/services/${id}`);
  };

  const filteredSubcategoriesForFilter = categoryFilter !== "all"
    ? subcategories.filter(sub => sub.categoryId === categoryFilter)
    : subcategories;

  const filteredServices = masterServices
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === "all" || service.categoryId === categoryFilter;
      const matchesSubcategory = subcategoryFilter === "all" || service.subcategoryId === subcategoryFilter;

      return matchesSearch && matchesCategory && matchesSubcategory;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isServiceAdded = (serviceId: string) => {
    return vendorCatalogue.some((item: VendorCatalogue) => item.masterServiceId === serviceId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold">Browse Master Catalogue</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Add services from the platform catalogue</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-master"
              />
            </div>
          </div>
          <div>
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setSubcategoryFilter("all");
            }}>
              <SelectTrigger data-testid="select-category-filter-master">
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
          <div>
            <Select 
              value={subcategoryFilter} 
              onValueChange={setSubcategoryFilter}
              disabled={categoryFilter === "all"}
            >
              <SelectTrigger data-testid="select-subcategory-filter-master">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {filteredSubcategoriesForFilter.map(sub => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Services Grid - Urban Company Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServices.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <p className="text-muted-foreground">No services found in master catalogue</p>
          </Card>
        ) : (
          filteredServices.map((service) => {
            const added = isServiceAdded(service.id);
            return (
              <Card 
                key={service.id} 
                className="hover:shadow-lg cursor-pointer transition-all overflow-hidden group" 
                onClick={() => handleViewDetails(service.id)}
                data-testid={`master-service-card-${service.id}`}
              >
                {/* Service Image/Icon */}
                <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-6xl">{service.icon}</div>
                  {added && (
                    <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
                      ✓ Added
                    </Badge>
                  )}
                  {service.serviceType === "package" && (
                    <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
                      Package
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Service Name */}
                  <div>
                    <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{service.category}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                    <span className="text-xs text-muted-foreground">(2.5K)</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.shortDescription || service.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">₹{service.basePrice}</span>
                    <span className="text-xs text-muted-foreground">base price</span>
                  </div>

                  {/* Add to Catalogue Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCatalogueMutation.mutate(service);
                    }}
                    disabled={added || addToCatalogueMutation.isPending}
                    variant={added ? "secondary" : "default"}
                    className="w-full"
                    data-testid={`button-add-service-${service.id}`}
                  >
                    {added ? "✓ Added to Catalogue" : "Add to My Catalogue"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
