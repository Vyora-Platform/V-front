import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  FileText, 
  Camera,
  Calculator,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Repeat,
  Clock,
  Plus,
  Minus,
  IndianRupee,
  ChevronDown,
  Image
} from "lucide-react";

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

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "bank_transfer", label: "Bank", icon: Building2 },
  { id: "card", label: "Card", icon: CreditCard },
];

const CATEGORIES_IN = [
  { id: "product_sale", label: "Product Sale" },
  { id: "service", label: "Service" },
  { id: "loan_received", label: "Loan Received" },
  { id: "advance", label: "Advance Payment" },
  { id: "other", label: "Other" },
];

const CATEGORIES_OUT = [
  { id: "purchase", label: "Purchase" },
  { id: "refund", label: "Refund" },
  { id: "loan_given", label: "Loan Given" },
  { id: "salary", label: "Salary" },
  { id: "rent", label: "Rent" },
  { id: "utility", label: "Utility Bill" },
  { id: "other", label: "Other" },
];

export default function VendorLedgerCustomerTransaction() {
  const params = useParams<{ vendorId: string; customerId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

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
        title: "Entry added!",
        description: `₹${form.getValues('amount').toLocaleString()} ${transactionType === "in" ? "received" : "paid"} successfully`,
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
        description: "Only images and PDF files are allowed",
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
  const amount = form.watch("amount");
  const categories = transactionType === "in" ? CATEGORIES_IN : CATEGORIES_OUT;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header - Khatabook Style */}
      <div className={`sticky top-0 z-30 ${transactionType === "in" ? "bg-green-600" : "bg-red-600"}`}>
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/vendors/${vendorId}/ledger/customer/${customerId}`)}
              className="text-white hover:bg-white/20 -ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
              <h1 className="text-lg font-semibold">
            {transactionType === "in" ? "You Got Money" : "You Gave Money"}
          </h1>
              <p className="text-xs opacity-90">
                {transactionType === "in" ? "Received from" : "Paid to"} {customer?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Big Amount Display */}
        <div className="px-4 pb-6 pt-2">
          <div className="flex items-center justify-center">
            <span className="text-3xl font-bold text-white mr-1">₹</span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => form.setValue("amount", parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="text-5xl font-bold text-white bg-transparent border-none outline-none text-center w-full placeholder:text-white/50"
              style={{ maxWidth: "280px" }}
            />
          </div>
          <p className="text-center text-white/80 text-sm mt-2">
            Enter {transactionType === "in" ? "received" : "paid"} amount
          </p>
        </div>
      </div>

      {/* Form Content - Scrollable with extra padding for fixed button */}
      <div className="flex-1 overflow-auto pb-44">
          <Form {...form}>
          <form className="p-4 space-y-4">
            {/* Date Field - Prominent */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
              <FormField
                control={form.control}
                  name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <FormLabel className="text-sm font-medium">Date</FormLabel>
                            <p className="text-xs text-muted-foreground">When did this happen?</p>
                          </div>
                        </div>
                    <FormControl>
                      <Input
                            type="date" 
                        {...field}
                            className="w-auto border-0 bg-muted/50 rounded-lg text-right"
                      />
                    </FormControl>
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            {/* Payment Method - Visual Selection */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
              <FormField
                control={form.control}
                  name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-sm font-medium mb-3 block">Payment Mode</FormLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {PAYMENT_METHODS.map((method) => {
                          const Icon = method.icon;
                          const isSelected = field.value === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => field.onChange(method.id)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                isSelected 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-transparent bg-muted/50 text-muted-foreground hover:border-muted-foreground/30"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs font-medium">{method.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

              {/* Description */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <FormLabel className="text-sm font-medium">Details (Optional)</FormLabel>
                          <p className="text-xs text-muted-foreground">Add a note about this entry</p>
                        </div>
                      </div>
                    <FormControl>
                      <Textarea
                          placeholder="e.g., Payment for invoice #123"
                        {...field}
                        value={field.value || ""}
                          className="rounded-xl border-muted resize-none"
                          rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Attach Bill/Receipt</p>
                    <p className="text-xs text-muted-foreground">Add photo proof</p>
                  </div>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      uploadingFile ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      {uploadingFile ? "Uploading..." : "Add Photo"}
                    </div>
                  </label>
                </div>

                {/* Attachments Preview */}
                {form.watch("attachments").length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.watch("attachments").map((attachment, index) => (
                      <div
                        key={index}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted"
                      >
                        {attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={attachment} 
                            alt="Attachment" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* More Options Toggle */}
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{showMoreOptions ? "Hide" : "Show"} more options</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMoreOptions ? "rotate-180" : ""}`} />
            </button>

            {/* More Options */}
            {showMoreOptions && (
              <div className="space-y-4">
                  {/* Category */}
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-sm font-medium mb-3 block">Category</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => field.onChange(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                  field.value === cat.id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:border-primary/50"
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </CardContent>
                </Card>

                {/* Private Note */}
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                          <FormLabel className="text-sm font-medium">Private Note</FormLabel>
                          <FormDescription className="text-xs">Only visible to you</FormDescription>
                      <FormControl>
                        <Textarea
                              placeholder="Add a private note..."
                          {...field}
                          value={field.value || ""}
                              className="rounded-xl border-muted resize-none mt-2"
                              rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  </CardContent>
                </Card>

                {/* Recurring */}
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Repeat className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <FormLabel className="text-sm font-medium">Recurring Entry</FormLabel>
                              <FormDescription className="text-xs">Repeat this entry automatically</FormDescription>
                            </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
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
                          <FormItem className="mt-4">
                            <FormLabel className="text-sm font-medium">Repeat</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue placeholder="Select frequency" />
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
                  </CardContent>
                </Card>
              </div>
            )}
          </form>
        </Form>
              </div>

      {/* Save Entry Button - Inline in scrollable content with gap from footer */}
      <div className="px-4 pb-28 md:pb-8">
        <Button
          type="submit"
          size="lg"
          disabled={createMutation.isPending || amount <= 0}
          onClick={form.handleSubmit(onSubmit)}
          className={`w-full h-14 rounded-xl text-lg font-semibold shadow-lg ${
            transactionType === "in" 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {createMutation.isPending ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Entry
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
