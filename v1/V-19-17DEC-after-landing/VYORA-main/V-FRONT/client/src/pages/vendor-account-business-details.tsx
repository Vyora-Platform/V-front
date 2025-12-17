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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
            {/* Logo Info Banner */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <Avatar className="h-12 w-12 border-2 border-blue-500">
                {(vendor?.logo || localStorage.getItem(`vendor_logo_${vendorId}`)) ? (
                  <AvatarImage src={localStorage.getItem(`vendor_logo_${vendorId}`) || vendor?.logo || ""} alt={vendor?.businessName} />
                  ) : null}
                <AvatarFallback className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {vendor?.businessName ? getInitials(vendor.businessName) : "VH"}
                  </AvatarFallback>
                </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Business Logo</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Tap the camera icon on your Profile page to change logo</p>
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
