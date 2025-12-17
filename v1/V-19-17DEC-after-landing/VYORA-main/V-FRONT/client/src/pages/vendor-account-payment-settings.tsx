import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CreditCard, Loader2 } from "lucide-react";
import type { Vendor } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const paymentSettingsSchema = z.object({
  bankAccountName: z.string().min(2, "Account holder name is required"),
  bankAccountNumber: z.string().min(9, "Valid account number is required"),
  bankIfscCode: z.string().min(11, "Valid IFSC code is required (11 characters)").max(11),
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;

export default function VendorAccountPaymentSettings() {
  const { vendorId } = useAuth();
  const { toast } = useToast();

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });

  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      bankAccountName: "",
      bankAccountNumber: "",
      bankIfscCode: "",
    },
  });

  // Update form when vendor data loads
  useEffect(() => {
    if (vendor) {
      form.reset({
        bankAccountName: vendor.bankAccountName || "",
        bankAccountNumber: vendor.bankAccountNumber || "",
        bankIfscCode: vendor.bankIfscCode || "",
      });
    }
  }, [vendor, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: PaymentSettingsFormValues) => {
      const response = await apiRequest("PATCH", `/api/vendors/${vendorId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
      toast({
        title: "Success",
        description: "Payment settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentSettingsFormValues) => {
    updateMutation.mutate(data);
  };

  if (!vendorId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/vendor/account">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Payment Settings</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading payment settings...</p>
          </div>
        </div>
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
          <h1 className="text-xl font-semibold">Payment Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>
              Add your bank account information to receive payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="bankAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="As per bank records" data-testid="input-account-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number *</FormLabel>
                      <FormControl>
                        <Input {...field} type="text" data-testid="input-account-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankIfscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., SBIN0001234" 
                          data-testid="input-ifsc-code"
                          onChange={(e) => {
                            // Convert to uppercase and limit to 11 characters
                            const value = e.target.value.toUpperCase().slice(0, 11);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
