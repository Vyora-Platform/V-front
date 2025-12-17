import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  FileText,
  Clock,
  Calendar,
  Tag,
  Package,
  CheckCircle2,
  XCircle,
  Home,
  Gift,
  Percent,
  Settings,
  CalendarDays,
  Sparkles,
  Star,
  Zap,
  Award,
  Image as ImageIcon
} from "lucide-react";
import type { MasterService, VendorCatalogue } from "@shared/schema";
import { useState, useEffect } from "react";

interface ServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: MasterService | VendorCatalogue | null;
}

export default function ServiceDetailDialog({ open, onOpenChange, service }: ServiceDetailDialogProps) {
  if (!service) return null;

  const isVendorService = 'vendorId' in service;
  const serviceData = service as any;
  const [selectedImage, setSelectedImage] = useState(0);

  // Calculate pricing details
  const basePrice = isVendorService ? serviceData.price : serviceData.basePrice;
  const hasOfferPrice = serviceData.offerPrice && serviceData.offerPrice < basePrice;
  const discount = hasOfferPrice 
    ? Math.round(((basePrice - serviceData.offerPrice) / basePrice) * 100)
    : 0;

  // Get images array
  const images = serviceData.images || [];
  const hasImages = images.length > 0;
  
  // Reset selected image when service changes or when selected index is out of bounds
  useEffect(() => {
    setSelectedImage(0);
  }, [service?.id, images.length]);

  // Get display image with proper fallback handling
  const displayImage = hasImages && selectedImage < images.length 
    ? images[selectedImage] 
    : (serviceData.thumbnailImage || serviceData.bannerImage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{service.name}</DialogTitle>
              {serviceData.tagline && (
                <p className="text-muted-foreground mt-1 text-base">{serviceData.tagline}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="font-normal">
                  {service.category}
                </Badge>
                {service.subcategory && (
                  <Badge variant="outline" className="font-normal">
                    {service.subcategory}
                  </Badge>
                )}
                {serviceData.serviceType && (
                  <Badge variant="secondary" className="capitalize">
                    {serviceData.serviceType.replace('-', ' ')}
                  </Badge>
                )}
              </div>
            </div>
            {isVendorService && (
              <Badge 
                variant={service.isActive ? "default" : "secondary"} 
                className={service.isActive ? "bg-green-600" : ""}
              >
                {service.isActive ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Image Gallery - Always render with placeholder fallback */}
          <div className="space-y-3">
            <div className="relative w-full h-64 md:h-80 bg-muted rounded-lg overflow-hidden">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`${displayImage ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-muted absolute inset-0`}
              >
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
            
            {/* Image Thumbnails */}
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === idx 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img
                      src={img}
                      alt={`${service.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Promotional Caption */}
          {serviceData.promotionalCaption && (
            <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 text-center">
                {serviceData.promotionalCaption}
              </p>
            </Card>
          )}
          {/* Pricing Card */}
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Pricing</h3>
                </div>
                
                <div className="flex items-baseline gap-3">
                  {hasOfferPrice ? (
                    <>
                      <span className="text-3xl font-bold text-primary">
                        ₹{serviceData.offerPrice}
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        ₹{basePrice}
                      </span>
                      <Badge variant="destructive" className="text-sm">
                        {discount}% OFF
                      </Badge>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      ₹{basePrice || 0}
                    </span>
                  )}
                </div>

                {serviceData.customUnit && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {serviceData.customUnit}
                  </p>
                )}
              </div>

              {/* GST Information */}
              {(serviceData.taxPercentage !== undefined && serviceData.taxPercentage !== null) && (
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                    <Percent className="h-4 w-4" />
                    <span>GST: {serviceData.taxPercentage}%</span>
                  </div>
                  {serviceData.gstIncluded && (
                    <Badge variant="outline" className="text-xs">
                      GST Included
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Descriptions */}
          <div className="grid grid-cols-1 gap-4">
            {serviceData.shortDescription && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Quick Overview</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                  {serviceData.shortDescription}
                </p>
              </div>
            )}

            {serviceData.detailedDescription && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Detailed Description</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {serviceData.detailedDescription}
                </p>
              </div>
            )}

            {!serviceData.shortDescription && !serviceData.detailedDescription && service.description && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Description</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Benefits, Features, and Highlights */}
          {((serviceData.benefits && serviceData.benefits.length > 0) || 
            (serviceData.features && serviceData.features.length > 0) || 
            (serviceData.highlights && serviceData.highlights.length > 0)) && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Benefits */}
                {serviceData.benefits && serviceData.benefits.length > 0 && (
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Benefits</h3>
                    </div>
                    <ul className="space-y-2">
                      {serviceData.benefits.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          <span className="text-blue-800 dark:text-blue-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Features */}
                {serviceData.features && serviceData.features.length > 0 && (
                  <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">Features</h3>
                    </div>
                    <ul className="space-y-2">
                      {serviceData.features.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                          <span className="text-purple-800 dark:text-purple-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Highlights */}
                {serviceData.highlights && serviceData.highlights.length > 0 && (
                  <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">Highlights</h3>
                    </div>
                    <ul className="space-y-2">
                      {serviceData.highlights.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <span className="text-amber-800 dark:text-amber-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Inclusions & Exclusions */}
          {((serviceData.inclusions && serviceData.inclusions.length > 0) || 
            (serviceData.exclusions && serviceData.exclusions.length > 0)) && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Inclusions */}
                {serviceData.inclusions && serviceData.inclusions.length > 0 && (
                  <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">What's Included</h3>
                    </div>
                    <ul className="space-y-2">
                      {serviceData.inclusions.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                          <span className="text-green-800 dark:text-green-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Exclusions */}
                {serviceData.exclusions && serviceData.exclusions.length > 0 && (
                  <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <h3 className="font-semibold text-red-900 dark:text-red-100">Not Included</h3>
                    </div>
                    <ul className="space-y-2">
                      {serviceData.exclusions.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                          <span className="text-red-800 dark:text-red-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Package Details */}
          {serviceData.serviceType === 'package' && (
            <>
              <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Package Details</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {serviceData.packageName && (
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Package Name</p>
                      <p className="font-medium text-purple-900 dark:text-purple-100">{serviceData.packageName}</p>
                    </div>
                  )}
                  {serviceData.packageType && (
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Package Type</p>
                      <p className="font-medium text-purple-900 dark:text-purple-100 capitalize">
                        {serviceData.packageType.replace('-', ' ')}
                      </p>
                    </div>
                  )}
                  {serviceData.packageDuration && (
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Duration</p>
                      <p className="font-medium text-purple-900 dark:text-purple-100">{serviceData.packageDuration}</p>
                    </div>
                  )}
                  {serviceData.packageSessions && (
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Sessions</p>
                      <p className="font-medium text-purple-900 dark:text-purple-100">{serviceData.packageSessions} sessions</p>
                    </div>
                  )}
                </div>
              </Card>
              <Separator />
            </>
          )}

          {/* Availability & Schedule */}
          {((serviceData.availableDays && serviceData.availableDays.length > 0) || 
            (serviceData.availableTimeSlots && serviceData.availableTimeSlots.length > 0)) && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Availability</h3>
                </div>
                
                <div className="space-y-4">
                  {serviceData.availableDays && serviceData.availableDays.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Available Days</p>
                      <div className="flex flex-wrap gap-2">
                        {serviceData.availableDays.map((day: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="font-normal">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {serviceData.availableTimeSlots && serviceData.availableTimeSlots.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Time Slots</p>
                      <div className="flex flex-wrap gap-2">
                        {serviceData.availableTimeSlots.map((slot: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="font-normal">
                            <Clock className="h-3 w-3 mr-1" />
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Service Features */}
          {(serviceData.bookingRequired || serviceData.homeCollectionAvailable || serviceData.freeTrialAvailable) && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Service Features</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {serviceData.bookingRequired && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Booking Required
                      </span>
                    </div>
                  )}
                  {serviceData.homeCollectionAvailable && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-900">
                      <Home className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                        Home Collection Available
                      </span>
                    </div>
                  )}
                  {serviceData.freeTrialAvailable && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                      <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Free Trial Available
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Legacy Packages Display */}
          {serviceData.packages && serviceData.packages.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Available Packages</h3>
                </div>
                <div className="grid gap-3">
                  {serviceData.packages.map((pkg: any, idx: number) => (
                    <Card key={idx} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-lg">{pkg.name}</h4>
                        <Badge variant="default" className="text-base">
                          ₹{pkg.price}
                        </Badge>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {pkg.description}
                        </p>
                      )}
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="space-y-1.5">
                          {pkg.features.map((feature: string, fIdx: number) => (
                            <li key={fIdx} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Terms & Conditions */}
          {serviceData.termsAndConditions && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                  {serviceData.termsAndConditions}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
