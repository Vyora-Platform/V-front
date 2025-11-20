import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Tag, Clock, FileText, Package, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
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
  const serviceData = service as any; // Type assertion for optional fields

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
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

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/vendor/services-catalogue")}
          className="mb-2"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalogue
        </Button>

        {/* Header Section */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="text-4xl sm:text-5xl" data-testid="text-service-icon">
              {service.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-service-name">
                {service.name}
              </h1>
              <p className="text-muted-foreground" data-testid="text-service-category">
                {service.category}
              </p>
              {service.subcategory && (
                <p className="text-sm text-muted-foreground" data-testid="text-service-subcategory">
                  → {service.subcategory}
                </p>
              )}
            </div>
            {isVendorService && 'isActive' in service && (
              <Badge
                variant={service.isActive ? "default" : "secondary"}
                className={service.isActive ? "bg-green-600" : ""}
                data-testid="badge-service-status"
              >
                {service.isActive ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </>
                ) : (
                  "Inactive"
                )}
              </Badge>
            )}
          </div>
        </Card>

        {/* Pricing Information */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Pricing</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Base Price</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary" data-testid="text-service-price">
                ₹{'price' in service ? service.price : 'basePrice' in service ? service.basePrice || 0 : 0}
              </p>
            </div>
            {service.serviceType && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Service Type</p>
                <Badge variant="outline" className="mt-1" data-testid="badge-service-type">
                  {service.serviceType}
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Description */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Description</h3>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed" data-testid="text-service-description">
            {service.description || "No description provided"}
          </p>
          {service.shortDescription && service.shortDescription !== service.description && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-1">Short Description</p>
              <p className="text-sm text-muted-foreground">{service.shortDescription}</p>
            </div>
          )}
        </Card>

        {/* Duration & Availability */}
        {(serviceData.duration || serviceData.availability) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serviceData.duration && (
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Duration</h3>
                </div>
                <p className="text-sm" data-testid="text-service-duration">{serviceData.duration}</p>
              </Card>
            )}
            {serviceData.availability && (
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Availability</h3>
                </div>
                <p className="text-sm" data-testid="text-service-availability">{serviceData.availability}</p>
              </Card>
            )}
          </div>
        )}

        {/* Inclusions & Exclusions */}
        {((serviceData.inclusions && serviceData.inclusions.length > 0) || 
          (serviceData.exclusions && serviceData.exclusions.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceData.inclusions && serviceData.inclusions.length > 0 && (
              <Card className="p-4 sm:p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  What's Included
                </h3>
                <ul className="space-y-2">
                  {serviceData.inclusions.map((item: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2" data-testid={`text-inclusion-${idx}`}>
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {serviceData.exclusions && serviceData.exclusions.length > 0 && (
              <Card className="p-4 sm:p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  What's Not Included
                </h3>
                <ul className="space-y-2">
                  {serviceData.exclusions.map((item: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2" data-testid={`text-exclusion-${idx}`}>
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {service.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" data-testid={`badge-tag-${idx}`}>
                  {tag}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Packages */}
        {serviceData.packages && serviceData.packages.length > 0 && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Available Packages</h3>
            </div>
            <div className="space-y-3">
              {serviceData.packages.map((pkg: any, idx: number) => (
                <Card key={idx} className="p-4 border-2" data-testid={`card-package-${idx}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <h4 className="font-medium text-lg">{pkg.name}</h4>
                    <Badge variant="secondary" className="text-lg px-3 py-1 w-fit">
                      ₹{pkg.price}
                    </Badge>
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                  )}
                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="space-y-1.5 border-t pt-3">
                      {pkg.features.map((feature: string, fIdx: number) => (
                        <li key={fIdx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Terms & Conditions */}
        {serviceData.termsAndConditions && (
          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-lg mb-3">Terms & Conditions</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" data-testid="text-terms">
              {serviceData.termsAndConditions}
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-16 md:bottom-6 bg-background/95 backdrop-blur-sm p-4 border rounded-lg">
          <Button
            size="lg"
            className="flex-1"
            data-testid="button-book-now"
          >
            Book Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            data-testid="button-contact"
          >
            Contact Vendor
          </Button>
        </div>
      </div>
    </div>
  );
}
