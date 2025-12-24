import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { XCircle, ArrowLeft } from "lucide-react";
import ServiceDescriptionPage from "@/components/ServiceDescriptionPage";
import type { MasterService, VendorCatalogue } from "@shared/schema";

export default function VendorServiceDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  // Try to fetch as vendor service first
  const { data: vendorService, isLoading: isLoadingVendor } = useQuery<VendorCatalogue>({
    queryKey: ["/api/vendor-catalogue", id],
    enabled: !!id,
  });

  // If not found, try to fetch as master service
  const { data: masterService, isLoading: isLoadingMaster } = useQuery<MasterService>({
    queryKey: ["/api/master-services", id],
    enabled: !!id && !vendorService,
  });

  const service = vendorService || masterService;
  const isLoading = isLoadingVendor || isLoadingMaster;
  const isVendorService = vendorService !== undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Service Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The service you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/vendor/services-catalogue")} data-testid="button-back-catalogue">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Catalogue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Transform service data for the description page
  const serviceData = {
    ...(service as any),
    // Ensure proper field mapping
    basePrice: isVendorService ? (service as any).price : (service as any).basePrice,
    price: isVendorService ? (service as any).price : (service as any).basePrice,
    // Add any additional fields needed
    isActive: isVendorService ? (service as VendorCatalogue).isActive : true,
  };

  return (
    <ServiceDescriptionPage
      service={serviceData}
      isPreview={false}
      onClose={() => setLocation("/vendor/services-catalogue")}
      showBookingSection={true}
      onBook={() => {
        // Handle booking action
        console.log("Book service:", service.id);
      }}
    />
  );
}
