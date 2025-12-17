import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Save, Loader2, X } from "lucide-react";
import type { Vendor } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const businessDetailsSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  whatsappNumber: z.string().min(10, "WhatsApp number must be at least 10 digits"),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  gstNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
});

type BusinessDetailsFormValues = z.infer<typeof businessDetailsSchema>;

export default function VendorAccountBusinessDetails() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });

  const form = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      description: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      gstNumber: "",
      licenseNumber: "",
    },
  });

  // Update form when vendor data loads
  useEffect(() => {
    if (vendor) {
      form.reset({
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        email: vendor.email,
        phone: vendor.phone,
        whatsappNumber: vendor.whatsappNumber,
        description: vendor.description || "",
        street: vendor.street || "",
        city: vendor.city || "",
        state: vendor.state || "",
        pincode: vendor.pincode || "",
        gstNumber: vendor.gstNumber || "",
        licenseNumber: vendor.licenseNumber || "",
      });
    }
  }, [vendor, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: BusinessDetailsFormValues) => {
      const response = await apiRequest("PATCH", `/api/vendors/${vendorId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
      toast({
        title: "Success",
        description: "Business details updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business details",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessDetailsFormValues) => {
    updateMutation.mutate(data);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, WebP, or GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB for logo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload/logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update vendor with new logo URL
      await apiRequest("PATCH", `/api/vendors/${vendorId}`, {
        logo: data.url,
      });
      
      // Invalidate and refetch vendor data
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
      
      toast({
        title: "Logo uploaded",
        description: "Your business logo has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!vendor?.logo) return;

    try {
      // Update vendor to remove logo
      await apiRequest("PATCH", `/api/vendors/${vendorId}`, {
        logo: null,
      });
      
      // Invalidate and refetch vendor data
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
      
      toast({
        title: "Logo removed",
        description: "Your business logo has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/vendor/account">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Business Details</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Business Information</CardTitle>
            <CardDescription>Update your business profile and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Logo */}
            <div className="flex items-center gap-4 pb-6 border-b">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {vendor?.logo ? (
                    <AvatarImage src={vendor.logo} alt={vendor.businessName} />
                  ) : null}
                  <AvatarFallback className="text-xl bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    {vendor?.businessName ? getInitials(vendor.businessName) : "VH"}
                  </AvatarFallback>
                </Avatar>
                {vendor?.logo && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                    onClick={handleLogoRemove}
                    disabled={logoUploading || updateMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Business Logo</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a square logo (recommended: 512x512px, max 5MB)
                </p>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploading || updateMutation.isPending}
                    data-testid="input-logo-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    disabled={logoUploading || updateMutation.isPending}
                    data-testid="button-upload-logo"
                    asChild
                  >
                    <span>
                      {logoUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {vendor?.logo ? "Change Logo" : "Upload Logo"}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Basic Information</h4>
                  
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-business-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-owner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={3}
                            placeholder="Describe your business..."
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Contact Information</h4>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-whatsapp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Address */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Business Address</h4>

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Registration */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Business Registration</h4>

                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional" data-testid="input-gst" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional" data-testid="input-license" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <Link href="/vendor/account">
                    <Button type="button" variant="outline" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    data-testid="button-save"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
