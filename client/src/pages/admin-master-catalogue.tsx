import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Copy, Search, Filter, X, ChevronDown, ArrowUpDown, Eye, ImageIcon, Star } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ServiceListingForm from "@/components/ServiceListingForm";
import ServiceDetailDialog from "@/components/ServiceDetailDialog";
import type { MasterService, Category, Subcategory, Unit, Vendor } from "@shared/schema";

const SERVICE_TYPE_OPTIONS = [
  { value: "service", label: "Service" },
  { value: "product", label: "Product" },
  { value: "package", label: "Package" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created Date" },
  { value: "name", label: "Name" },
  { value: "basePrice", label: "Base Price" },
  { value: "category", label: "Category" },
];

export default function AdminMasterCatalogue() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MasterService | null>(null);
  const [viewingService, setViewingService] = useState<MasterService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<MasterService | null>(null);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch vendors
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch subcategories
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  // Fetch units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (search) params.append("search", search);
    selectedVendors.forEach(v => params.append("vendorIds", v));
    selectedCategories.forEach(c => params.append("categoryIds", c));
    selectedSubcategories.forEach(s => params.append("subcategoryIds", s));
    selectedServiceTypes.forEach(t => params.append("serviceType", t));
    selectedUnits.forEach(u => params.append("unitIds", u));
    if (priceMin) params.append("priceMin", priceMin);
    if (priceMax) params.append("priceMax", priceMax);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    
    return params.toString();
  };

  // Fetch catalogue with filters - React Query will refetch when any of these values change
  const { data, isLoading } = useQuery<{ services: MasterService[]; total: number }>({
    queryKey: [
      "/api/admin/catalogue",
      search,
      selectedVendors,
      selectedCategories,
      selectedSubcategories,
      selectedServiceTypes,
      selectedUnits,
      priceMin,
      priceMax,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/admin/catalogue?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch catalogue");
      return response.json();
    },
  });

  const services = data?.services || [];
  const total = data?.total || 0;

  // Create master service mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/master-services", {
        ...data,
        isUniversal: true,
        createdBy: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/catalogue"] });
      toast({ title: "Service created successfully" });
      setIsDialogOpen(false);
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Failed to create service", variant: "destructive" });
    },
  });

  // Update master service mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/master-services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/catalogue"] });
      toast({ title: "Service updated successfully" });
      setIsDialogOpen(false);
      setEditingService(null);
    },
    onError: () => {
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  // Delete master service mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/master-services/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/catalogue"] });
      toast({ title: "Service deleted successfully" });
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete service", variant: "destructive" });
    },
  });

  // Duplicate master service mutation
  const duplicateMutation = useMutation({
    mutationFn: async (service: MasterService) => {
      // Create duplicate data
      const duplicateData = {
        ...service,
        name: `${service.name} (Copy)`,
        id: undefined, // Let the server generate new ID
        createdAt: undefined,
        updatedAt: undefined,
      };
      const response = await apiRequest("POST", "/api/master-services", {
        ...duplicateData,
        isUniversal: true,
        createdBy: null,
      });
      return response.json();
    },
    onSuccess: (data: MasterService) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/catalogue"] });
      toast({ title: "Service duplicated successfully" });
      // Open the duplicated service for editing
      setEditingService(data);
      setIsDialogOpen(true);
    },
    onError: () => {
      toast({ title: "Failed to duplicate service", variant: "destructive" });
    },
  });

  const handleFormSubmit = (data: any) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: MasterService) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (service: MasterService) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = (service: MasterService) => {
    duplicateMutation.mutate(service);
  };

  const handlePreview = (service: MasterService) => {
    setViewingService(service);
    setIsDetailDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (service: MasterService) => {
    setViewingService(service);
    setIsDetailDialogOpen(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedVendors([]);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedServiceTypes([]);
    setSelectedUnits([]);
    setPriceMin("");
    setPriceMax("");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  // Check if any filter is active
  const hasActiveFilters = search || selectedVendors.length > 0 || selectedCategories.length > 0 || 
    selectedSubcategories.length > 0 || selectedServiceTypes.length > 0 || selectedUnits.length > 0 || 
    priceMin || priceMax || startDate || endDate;

  // Filter subcategories based on selected categories
  const availableSubcategories = selectedCategories.length > 0
    ? subcategories.filter(sub => selectedCategories.includes(sub.categoryId))
    : subcategories;

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-20 md:pb-6">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Master Services</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${total} service${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Button onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3 md:p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-sm rounded-xl">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Services</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold">{total}</p>
            )}
          </Card>
          <Card className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0 shadow-sm rounded-xl">
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 mb-1">Categories</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{categories.length}</p>
          </Card>
            <Card className="p-3 md:p-4 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-0 shadow-sm rounded-xl min-h-[var(--card-min-h)]">
            <p className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 mb-1">Subcategories</p>
            <p className="text-xl sm:text-2xl font-bold text-violet-700 dark:text-violet-300">{subcategories.length}</p>
          </Card>
          <Card className="p-3 md:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-0 shadow-sm rounded-xl min-h-[var(--card-min-h)]">
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 mb-1">Units</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{units.length}</p>
          </Card>
        </div>

        {/* Filters - Enterprise Level Single Row */}
        <Card className="p-4 rounded-xl">
          <div className="space-y-4">
            {/* Primary Filters Row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-[var(--input-h)] text-sm"
                />
            </div>

              {/* Vendors Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between h-[var(--input-h)] text-sm">
                  <span className="truncate">
                    {selectedVendors.length > 0 
                      ? `${selectedVendors.length} Vendor${selectedVendors.length > 1 ? 's' : ''}`
                      : "Vendors"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vendor-${vendor.id}`}
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVendors([...selectedVendors, vendor.id]);
                          } else {
                            setSelectedVendors(selectedVendors.filter(v => v !== vendor.id));
                          }
                        }}
                      />
                      <label htmlFor={`vendor-${vendor.id}`} className="text-sm cursor-pointer flex-1">
                        {vendor.businessName || vendor.contactName}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

              {/* Categories Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between h-[var(--input-h)] text-sm">
                  <span className="truncate">
                    {selectedCategories.length > 0 
                      ? `${selectedCategories.length} Category${selectedCategories.length > 1 ? 'ies' : ''}`
                      : "Categories"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                            // Clear subcategories from this category
                            const subIds = subcategories.filter(s => s.categoryId === cat.id).map(s => s.id);
                            setSelectedSubcategories(selectedSubcategories.filter(s => !subIds.includes(s)));
                          }
                        }}
                      />
                      <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer flex-1">
                        {cat.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

              {/* Subcategories Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="min-w-[140px] justify-between h-[var(--input-h)] text-sm"
                    disabled={selectedCategories.length === 0}
                  >
                  <span className="truncate">
                    {selectedSubcategories.length > 0 
                      ? `${selectedSubcategories.length} Subcat${selectedSubcategories.length > 1 ? 's' : ''}`
                      : "Subcategories"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableSubcategories.map((sub) => (
                    <div key={sub.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sub-${sub.id}`}
                        checked={selectedSubcategories.includes(sub.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubcategories([...selectedSubcategories, sub.id]);
                          } else {
                            setSelectedSubcategories(selectedSubcategories.filter(s => s !== sub.id));
                          }
                        }}
                      />
                      <label htmlFor={`sub-${sub.id}`} className="text-sm cursor-pointer flex-1">
                        {sub.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

              {/* Service Type Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-between h-[var(--input-h)] text-sm">
                  <span className="truncate">
                    {selectedServiceTypes.length > 0 
                      ? `${selectedServiceTypes.length} Type${selectedServiceTypes.length > 1 ? 's' : ''}`
                      : "Service Type"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-4">
                <div className="space-y-2">
                  {SERVICE_TYPE_OPTIONS.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={selectedServiceTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServiceTypes([...selectedServiceTypes, type.value]);
                          } else {
                            setSelectedServiceTypes(selectedServiceTypes.filter(t => t !== type.value));
                          }
                        }}
                      />
                      <label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

              {/* More Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-[var(--input-h)] text-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    More
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-[350px] p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Units</label>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                      {units.map((unit) => (
                        <div key={unit.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`unit-${unit.id}`}
                            checked={selectedUnits.includes(unit.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUnits([...selectedUnits, unit.id]);
                              } else {
                                setSelectedUnits(selectedUnits.filter(u => u !== unit.id));
                              }
                            }}
                          />
                          <label htmlFor={`unit-${unit.id}`} className="text-sm cursor-pointer">
                            {unit.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-sm">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Sorting Row */}
            <div className="flex gap-3 items-center border-t pt-3">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="h-9 text-sm"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Services Grid - Urban Company Style */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        ) : services.length === 0 ? (
          <Card className="p-12 text-center rounded-xl">
            <p className="text-muted-foreground text-lg">No services found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {services.map((service) => {
            const hasImage = service.images && service.images.length > 0;
            const displayImage = hasImage ? service.images[0] : null;
            const basePrice = service.basePrice || 0;
            
            return (
              <Card 
                key={service.id} 
                className="hover:shadow-lg transition-all overflow-hidden group cursor-pointer border-0 shadow-sm rounded-xl"
                onClick={() => handleViewDetails(service)}
              >
              {/* Service Image/Icon */}
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
                  
                {service.serviceType === "package" && (
                    <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600 text-white border-0">
                    Package
                  </Badge>
                )}

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => { e.stopPropagation(); handlePreview(service); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => { e.stopPropagation(); handleEdit(service); }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
              </div>

              <CardContent className="p-4 space-y-3">
                  {/* Category */}
                  <Badge variant="outline" className="text-xs font-normal">
                    {service.category}
                  </Badge>

                {/* Service Name */}
                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-medium">4.8</span>
                </div>
                    <span className="text-muted-foreground text-xs">(2.5K)</span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.shortDescription || service.description || "No description available"}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  {service.offerPrice && service.offerPrice < basePrice ? (
                    <>
                      <span className="text-xl font-bold text-primary">₹{service.offerPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{basePrice}</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold">₹{basePrice}</span>
                  )}
                </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs"
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(service); }}
                      disabled={duplicateMutation.isPending}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(service); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog - Full Screen on Mobile */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[100vh] md:max-h-[95vh] h-full md:h-auto overflow-hidden p-0 md:p-6 gap-0">
          <DialogHeader className="hidden md:block px-0 pb-4">
            <DialogTitle className="text-2xl">
              {editingService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto md:overflow-visible">
            <ServiceListingForm
            initialData={editingService || {}}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingService(null);
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            mode={editingService ? "edit" : "create"}
            userType="admin"
          />
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Detail Dialog */}
      <ServiceDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        service={viewingService}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service
              {serviceToDelete && ` "${serviceToDelete.name}"`} from the catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (serviceToDelete) {
                  deleteMutation.mutate(serviceToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
