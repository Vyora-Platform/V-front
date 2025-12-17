import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Search, Crown, MessageSquare, CheckCircle2 } from "lucide-react";
import type { AdditionalService, Vendor } from "@shared/schema";

export default function VendorAdditionalServices() {
  const { toast } = useToast();
  const { vendorId } = useAuth();
  const [search, setSearch] = useState("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AdditionalService | null>(null);
  const [requirement, setRequirement] = useState("");

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
      toast({ title: "Inquiry submitted successfully", description: "We'll contact you soon!" });
      setContactDialogOpen(false);
      setSelectedService(null);
      setRequirement("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Additional Services</h1>
        <p className="text-muted-foreground mt-1">
          Premium services to enhance your business
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? "No services found" : "No additional services available"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{service.icon}</span>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                {service.shortDescription && (
                  <CardDescription>{service.shortDescription}</CardDescription>
                )}
                {service.category && (
                  <Badge variant="outline" className="w-fit mt-2">
                    {service.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                  {service.description}
                </p>

                {service.features && service.features.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold mb-2">Features:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {service.price && (
                  <p className="text-2xl font-bold mb-4">
                    ₹{service.price.toLocaleString()}
                  </p>
                )}

                <Button
                  onClick={() => handleContactUs(service)}
                  className="w-full"
                  variant="default"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Us Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Us - {selectedService?.name}</DialogTitle>
            <DialogDescription>
              Fill in your details and describe your requirements. We'll get back to you soon!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {vendor && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={vendor.businessName} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input value={vendor.ownerName} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={vendor.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={vendor.phone} disabled />
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInquiry}
              disabled={submitInquiryMutation.isPending || !requirement.trim()}
            >
              {submitInquiryMutation.isPending ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


