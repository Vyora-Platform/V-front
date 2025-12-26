import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, CheckCircle2, MessageSquare, Phone, Mail, 
  Building2, User, Star, Sparkles, ChevronLeft, ChevronRight,
  Shield, Zap, TrendingUp, Clock, Tag, Package
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdditionalService, Vendor } from "@shared/schema";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorAdditionalServiceDetail() {
  const { toast } = useToast();
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/vendor/additional-services/:id");
  const serviceId = params?.id;

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [requirement, setRequirement] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);

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

  // Fetch service details
  const { data: service, isLoading, error } = useQuery<AdditionalService>({
    queryKey: [`/api/additional-services/${serviceId}`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/additional-services/${serviceId}`));
      if (!response.ok) throw new Error("Failed to fetch service");
      return response.json();
    },
    enabled: !!serviceId,
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
      toast({ title: "Inquiry submitted successfully!", description: "We'll contact you soon!" });
      setContactDialogOpen(false);
      setRequirement("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitInquiry = () => {
    if (!service) return;
    if (!requirement.trim()) {
      toast({
        title: "Validation Error",
        description: "Please describe your requirements",
        variant: "destructive",
      });
      return;
    }
    submitInquiryMutation.mutate({
      serviceId: service.id,
      requirement: requirement.trim(),
    });
  };

  const handlePrevImage = () => {
    if (service?.images && service.images.length > 0) {
      setSelectedImageIndex((prev) => (prev === 0 ? service.images!.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (service?.images && service.images.length > 0) {
      setSelectedImageIndex((prev) => (prev === service.images!.length - 1 ? 0 : prev + 1));
    }
  };

  if (!vendorId) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Service not found</p>
        <Button variant="outline" onClick={() => setLocation("/vendor/additional-services")} className="mt-4">
          Back to Services
        </Button>
      </div>
    );
  }

  const hasImages = service.images && service.images.length > 0;

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/additional-services")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground line-clamp-1">{service.name}</h1>
              <p className="text-xs text-muted-foreground">Service Details</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setContactDialogOpen(true)}
            className="gap-1.5"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Contact Us</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="pb-20">
          {/* Image Section */}
          {hasImages ? (
            <div className="relative">
              <div
                className="aspect-video bg-muted cursor-pointer"
                onClick={() => setImageZoomOpen(true)}
              >
                <img
                  src={service.images![selectedImageIndex]}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image Navigation */}
              {service.images!.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {service.images!.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${idx === selectedImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Thumbnail Strip */}
              {service.images!.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
                  {service.images!.map((img, idx) => (
                    <button
                      key={idx}
                      className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        idx === selectedImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img src={img} alt={`${service.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
              <span className="text-8xl">{service.icon}</span>
            </div>
          )}

          {/* Service Info */}
          <div className="p-4 space-y-4">
            {/* Title & Category */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold">{service.name}</h2>
                {service.category && (
                  <Badge variant="outline" className="shrink-0">
                    <Tag className="h-3 w-3 mr-1" />
                    {service.category}
                  </Badge>
                )}
              </div>
              {service.shortDescription && (
                <p className="text-muted-foreground mt-2">{service.shortDescription}</p>
              )}
            </div>

            {/* Price */}
            {service.price && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-3xl font-bold text-primary">₹{service.price.toLocaleString()}</p>
                    </div>
                    <Button onClick={() => setContactDialogOpen(true)} className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">About This Service</h3>
              <p className="text-muted-foreground whitespace-pre-line">{service.description}</p>
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full shrink-0 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {service.benefits && service.benefits.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full shrink-0 mt-0.5">
                          <Star className="h-4 w-4 text-blue-600" />
                        </div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Interested in this service?</h3>
                <p className="text-muted-foreground mb-4">
                  Fill out the contact form and our team will get back to you within 24 hours.
                </p>
                <Button
                  size="lg"
                  onClick={() => setContactDialogOpen(true)}
                  className="gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Contact Us Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Bottom CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t sm:hidden">
        <div className="flex items-center gap-4">
          {service.price && (
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-xl font-bold text-primary">₹{service.price.toLocaleString()}</p>
            </div>
          )}
          <Button
            className="flex-1 gap-2"
            size="lg"
            onClick={() => setContactDialogOpen(true)}
          >
            <MessageSquare className="h-5 w-5" />
            Contact Us
          </Button>
        </div>
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <div className="relative">
            <img
              src={service.images?.[selectedImageIndex]}
              alt={service.name}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            {service.images && service.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Contact Us
            </DialogTitle>
            <DialogDescription>
              {service.name}
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







