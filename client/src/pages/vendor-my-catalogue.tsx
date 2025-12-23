import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Check, X, Plus, ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import type { VendorCatalogue } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// TODO: Replace with actual vendor ID from auth
export default function VendorMyCatalogue() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch vendor's catalogue
  const { data: catalogue = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  // Toggle active status
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

  // Delete service
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

  const activeServices = catalogue.filter(item => item.isActive);
  const inactiveServices = catalogue.filter(item => !item.isActive);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 pb-20 md:pb-6 pt-4 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0 h-9 w-9"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              My Catalogue
            </h1>
            <p className="text-sm text-muted-foreground">Manage your services and pricing</p>
          </div>
        </div>
        <Link href="/vendor/catalogue/create">
          <Button data-testid="button-create-service" className="h-[var(--cta-h)] text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4 rounded-xl min-h-[var(--card-min-h)]">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Services</p>
          <p className="text-xl md:text-2xl font-bold">{catalogue.length}</p>
        </Card>
        <Card className="p-4 rounded-xl min-h-[var(--card-min-h)]">
          <p className="text-xs text-chart-2 font-medium mb-1">Active Services</p>
          <p className="text-xl md:text-2xl font-bold text-chart-2">{activeServices.length}</p>
        </Card>
        <Card className="p-4 rounded-xl col-span-2 md:col-span-1 min-h-[var(--card-min-h)]">
          <p className="text-xs text-muted-foreground font-medium mb-1">Inactive Services</p>
          <p className="text-xl md:text-2xl font-bold text-muted-foreground">{inactiveServices.length}</p>
        </Card>
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Active Services ({activeServices.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((service) => (
              <Card key={service.id} className="p-4 hover-elevate rounded-xl" data-testid={`service-${service.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{service.icon}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                    </div>
                  </div>
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: service.id, isActive: checked })
                    }
                    data-testid={`switch-active-${service.id}`}
                  />
                </div>

                <p className="text-sm text-muted-foreground mb-3">{service.description}</p>

                {/* Pricing */}
                <div className="mb-4">
                  <p className="text-2xl font-bold text-primary">₹{service.price}</p>
                  {service.homeCollectionAvailable && (
                    <p className="text-sm text-muted-foreground">
                      + ₹{service.homeCollectionCharges} home collection
                    </p>
                  )}
                </div>

                {/* Inclusions/Exclusions Count */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-chart-2">
                    <Check className="w-4 h-4" />
                    <span>{service.inclusions?.length || 0} inclusions</span>
                  </div>
                  <div className="flex items-center gap-1 text-destructive">
                    <X className="w-4 h-4" />
                    <span>{service.exclusions?.length || 0} exclusions</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(service.tags || []).slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/vendor/catalogue/edit/${service.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-xs"
                      data-testid={`button-edit-${service.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() => deleteMutation.mutate(service.id)}
                    data-testid={`button-delete-${service.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Inactive Services ({inactiveServices.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveServices.map((service) => (
              <Card key={service.id} className="p-4 opacity-60 rounded-xl" data-testid={`service-inactive-${service.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{service.icon}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                    </div>
                  </div>
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: service.id, isActive: checked })
                    }
                    data-testid={`switch-active-${service.id}`}
                  />
                </div>

                <p className="text-2xl font-bold text-muted-foreground">₹{service.price}</p>

                <div className="flex gap-2 mt-3">
                  <Link href={`/vendor/catalogue/edit/${service.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-xs"
                      data-testid={`button-edit-${service.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() => deleteMutation.mutate(service.id)}
                    data-testid={`button-delete-${service.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {catalogue.length === 0 && (
        <Card className="p-8 text-center rounded-xl">
          <p className="text-base text-muted-foreground mb-4">
            You haven't added any services yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/vendor/catalogue">
              <Button variant="outline" className="h-[var(--cta-h)] text-sm" data-testid="button-browse-catalogue">
                Browse Master Catalogue
              </Button>
            </Link>
            <Link href="/vendor/catalogue/create">
              <Button className="h-[var(--cta-h)] text-sm" data-testid="button-create-service-empty">
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Service
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
