import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { ArrowLeft, Save, Upload, X, FileText } from "lucide-react";

const formSchema = z.object({
  customerId: z.string(),
  type: z.enum(["in", "out"]),
  amount: z.number().min(1, "Amount must be at least 1"),
  transactionDate: z.string().min(1, "Transaction date is required"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  description: z.string().optional(),
  note: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().nullable(),
  attachments: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

type Customer = {
  id: string;
  name: string;
  phone: string;
};

export default function VendorLedgerCustomerTransaction() {
  const params = useParams<{ vendorId: string; customerId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadingFile, setUploadingFile] = useState(false);

  const vendorId = params.vendorId!;
  const customerId = params.customerId!;

  // Get transaction type from URL query
  const searchParams = new URLSearchParams(window.location.search);
  const transactionType = (searchParams.get("type") as "in" | "out") || "in";

  // Fetch customer details
  const { data: customer } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: customerId,
      type: transactionType,
      amount: 0,
      transactionDate: new Date().toISOString().split('T')[0],
      category: transactionType === "in" ? "product_sale" : "purchase",
      paymentMethod: "cash",
      description: "",
      note: "",
      isRecurring: false,
      recurringPattern: null,
      attachments: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", `/api/vendors/${vendorId}/ledger-transactions`, data),
    onSuccess: () => {
      toast({
        title: "Transaction created",
        description: "The transaction has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "ledger-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "ledger-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "ledger-transactions"] });
      navigate(`/vendors/${vendorId}/ledger/customer/${customerId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images (JPEG, PNG, WebP, GIF) and PDF files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(getApiUrl(`/api/upload/ledger-attachment?vendorId=${vendorId}`), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const currentAttachments = form.getValues("attachments");
      form.setValue("attachments", [...currentAttachments, data.url]);

      toast({
        title: "File uploaded",
        description: "Attachment added successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    const currentAttachments = form.getValues("attachments");
    form.setValue("attachments", currentAttachments.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const isRecurring = form.watch("isRecurring");

  return (
    <div className="flex h-full w-full flex-col gap-6 p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/vendors/${vendorId}/ledger/customer/${customerId}`)}
          className="md:hidden flex-shrink-0"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold" data-testid="heading-transaction">
            {transactionType === "in" ? "You Got Money" : "You Gave Money"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {transactionType === "in" ? "Record money received from" : "Record money paid to"} {customer?.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Date */}
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-transaction-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What was this transaction for?"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional Fields Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Optional Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="product_sale">Product Sale</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="utility">Utility</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
                            <SelectItem value="loan">Loan</SelectItem>
                            <SelectItem value="tax">Tax</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Note (Private) */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a private note (only visible to you)"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-note"
                        />
                      </FormControl>
                      <FormDescription>This note is private and won't be shared</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recurring Transaction */}
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Recurring Transaction</FormLabel>
                        <FormDescription>
                          Set up automatic recurring transactions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-recurring"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <FormField
                    control={form.control}
                    name="recurringPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Pattern</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-recurring-pattern">
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* File Upload Section */}
                <div className="space-y-2">
                  <FormLabel>Attachments</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="cursor-pointer"
                      data-testid="input-file-upload"
                    />
                    {uploadingFile && (
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload receipts, invoices, or bills (Images or PDF, max 10MB)
                  </p>

                  {/* Attachments List */}
                  {form.watch("attachments").length > 0 && (
                    <div className="space-y-2 mt-4">
                      {form.watch("attachments").map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
                          data-testid={`attachment-${index}`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate">{attachment.split('/').pop()}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            data-testid={`button-remove-attachment-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/vendors/${vendorId}/ledger/customer/${customerId}`)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
