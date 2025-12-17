import ServiceCard from "@/components/ServiceCard";
import AddServiceDialog from "@/components/AddServiceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MasterService, InsertVendorCatalogue } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// TODO: Replace with actual vendor ID from auth
export default function VendorCatalogueBrowse() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<MasterService | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Fetch master services
  const { data: masterServices = [] } = useQuery<MasterService[]>({
    queryKey: ["/api/master-services"],
  });

  // Fetch vendor's catalogue to check what's already added
  const { data: vendorCatalogue = [] } = useQuery<any[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  // Add to vendor catalogue mutation
  const addToCatalogueMutation = useMutation({
    mutationFn: async (data: InsertVendorCatalogue) => {
      console.log("Attempting to add service to catalogue:", data);
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/catalogue`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/catalogue`] });
      toast({ title: "Service added to your catalogue successfully!" });
      setShowDialog(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      console.error("Error adding service to catalogue:", error);
      toast({ 
        title: "Failed to add service", 
        description: error?.details || error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const filteredServices = masterServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isServiceAdded = (serviceId: string) => {
    return vendorCatalogue.some((item: any) => item.masterServiceId === serviceId);
  };

  const handleAddClick = (service: MasterService) => {
    setSelectedService(service);
    setShowDialog(true);
  };

  const handleConfirmAdd = (data: {
    inclusions: string[];
    exclusions: string[];
    price: number;
    homeCollectionAvailable: boolean;
    homeCollectionCharges: number;
  }) => {
    if (!selectedService) return;

    const catalogueData: InsertVendorCatalogue = {
      vendorId: vendorId,
      masterServiceId: selectedService.id,
      customServiceRequestId: null,
      name: selectedService.name,
      category: selectedService.category,
      icon: selectedService.icon,
      description: selectedService.description,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      tags: selectedService.tags,
      sampleType: selectedService.sampleType,
      tat: selectedService.tat,
      price: data.price,
      homeCollectionAvailable: data.homeCollectionAvailable,
      homeCollectionCharges: data.homeCollectionCharges,
      isActive: true,
      discountPercentage: 0,
    };

    addToCatalogueMutation.mutate(catalogueData);
  };

  const handleDialogClose = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      setSelectedService(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-16 md:pb-6 space-y-6">
      <div className="flex items-center gap-3">
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
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Browse Services
          </h1>
          <p className="text-muted-foreground">Select services from master catalogue to add to your offerings</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services, categories, or tags..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-services"
        />
      </div>

      {/* Services Grid */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredServices.length} of {masterServices.length} services
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              name={service.name}
              category={service.category}
              price={service.basePrice || undefined}
              description={service.description}
              inclusions={service.inclusions}
              exclusions={service.exclusions}
              tags={service.tags}
              tat={service.tat || undefined}
              sampleType={service.sampleType || undefined}
              icon={service.icon}
              onAdd={() => handleAddClick(service)}
              added={isServiceAdded(service.id)}
            />
          ))}
        </div>
      </div>

      {/* Add Service Dialog */}
      {selectedService && (
        <AddServiceDialog
          open={showDialog}
          onOpenChange={handleDialogClose}
          service={selectedService}
          onConfirm={handleConfirmAdd}
        />
      )}
    </div>
  );
}
