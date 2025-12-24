import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Plus, 
  X, 
  Users,
  Calendar,
  FileText,
  Camera,
  Banknote,
  Smartphone,
  Building2,
  CreditCard,
  ChevronDown,
  Repeat,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

const formSchema = z.object({
  customerId: z.string().nullable(),
  type: z.enum(["in", "out"]),
  amount: z.number().min(1, "Amount must be at least 1"),
  transactionDate: z.string().min(1, "Transaction date is required"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  description: z.string().optional(),
  note: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().nullable(),
  recurringStartDate: z.string().optional(),
  recurringEndDate: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "bank", label: "Bank", icon: Building2 },
  { id: "card", label: "Card", icon: CreditCard },
];

const CATEGORIES_IN = [
  { id: "product_sale", label: "Product Sale" },
  { id: "service", label: "Service" },
  { id: "loan_received", label: "Loan Received" },
  { id: "advance", label: "Advance" },
  { id: "subscription", label: "Subscription" },
  { id: "other", label: "Other" },
];

const CATEGORIES_OUT = [
  { id: "expense", label: "Expense" },
  { id: "purchase", label: "Purchase" },
  { id: "refund", label: "Refund" },
  { id: "salary", label: "Salary" },
  { id: "rent", label: "Rent" },
  { id: "utility", label: "Utility" },
  { id: "other", label: "Other" },
];

export default function VendorLedgerTransaction() {
  const { vendorId } = useAuth();
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // ⚠️ LEDGER IMMUTABILITY: Ledgers should not be edited once recorded
  const isEditing = !!id && id !== "new";
  
  useEffect(() => {
    if (isEditing) {
      toast({
        title: "Cannot Edit Ledger Entry",
        description: "Ledger transactions are immutable for accounting integrity. Please add a new correcting entry instead.",
        variant: "destructive",
      });
      navigate("/vendor/ledger");
    }
  }, [isEditing, navigate, toast]);

  // Fetch customers for auto-suggest
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: null,
      type: "in",
      amount: 0,
      transactionDate: new Date().toISOString().split('T')[0],
      category: "other",
      paymentMethod: "cash",
      description: "",
      note: "",
      isRecurring: false,
      recurringPattern: null,
      recurringStartDate: "",
      recurringEndDate: "",
      attachments: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", `/api/vendors/${vendorId}/ledger-transactions`, data),
    onSuccess: () => {
      toast({
        title: "Entry added!",
        description: `₹${form.getValues('amount').toLocaleString()} ${form.getValues('type') === "in" ? "received" : "paid"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "ledger-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "ledger-summary"] });
      navigate("/vendor/ledger");
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

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images and PDF files are allowed",
        variant: "destructive",
      });
      return;
    }

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

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const currentAttachments = form.getValues("attachments");
      form.setValue("attachments", [...currentAttachments, data.url]);

      toast({ title: "File uploaded", description: "Attachment added successfully" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload file.", variant: "destructive" });
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

  const selectedCustomer = customers.find(c => c.id === form.watch("customerId"));
  const isRecurring = form.watch("isRecurring");
  const transactionType = form.watch("type");
  const amount = form.watch("amount");
  const categories = transactionType === "in" ? CATEGORIES_IN : CATEGORIES_OUT;

  if (!vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header - Transaction Type Selection */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
            size="icon"
        onClick={() => navigate("/vendor/ledger")}
            className="-ml-2"
      >
            <ArrowLeft className="h-5 w-5" />
      </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Add Entry</h1>
            <p className="text-xs text-muted-foreground">Record a transaction</p>
          </div>
        </div>

        {/* Transaction Type Toggle */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => {
                form.setValue("type", "in");
                form.setValue("category", "product_sale");
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                transactionType === "in"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>You Got (IN)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue("type", "out");
                form.setValue("category", "expense");
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                transactionType === "out"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingDown className="h-5 w-5" />
              <span>You Gave (OUT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-auto pb-24">
          <Form {...form}>
          <form className="p-4 space-y-4">
            {/* Amount - Big Input */}
            <Card className={`overflow-hidden border-2 ${
              transactionType === "in" ? "border-green-500" : "border-red-500"
            }`}>
              <CardContent className={`p-6 ${
                transactionType === "in" 
                  ? "bg-gradient-to-br from-green-500/10 to-green-500/5" 
                  : "bg-gradient-to-br from-red-500/10 to-red-500/5"
              }`}>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {transactionType === "in" ? "Amount Received" : "Amount Paid"}
                  </p>
                  <div className="flex items-center justify-center">
                    <span className={`text-3xl font-bold mr-2 ${
                      transactionType === "in" ? "text-green-600" : "text-red-600"
                    }`}>₹</span>
                    <input
                      type="number"
                      value={amount || ""}
                      onChange={(e) => form.setValue("amount", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={`text-5xl font-bold bg-transparent border-none outline-none text-center w-full max-w-[200px] ${
                        transactionType === "in" ? "text-green-600" : "text-red-600"
                      } placeholder:text-muted-foreground/50`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Customer Selection */}
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <button
                  type="button"
                  onClick={() => setCustomerSheetOpen(true)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {selectedCustomer ? selectedCustomer.name : "Select Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer ? selectedCustomer.phone : "Link to a customer (optional)"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            {/* Date */}
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

            {/* Payment Method */}
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
                          placeholder="e.g., Payment for order #123"
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

                {form.watch("attachments").length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.watch("attachments").map((attachment, index) => (
                      <div
                        key={index}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted"
                      >
                        {attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={attachment} alt="Attachment" className="w-full h-full object-cover" />
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
                              <FormDescription className="text-xs">Repeat this automatically</FormDescription>
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
                      <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="recurringPattern"
                      render={({ field }) => (
                        <FormItem>
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
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                  </CardContent>
                </Card>
              </div>
            )}
          </form>
        </Form>
                </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom">
                        <Button
          type="submit"
          size="lg"
          disabled={createMutation.isPending || amount <= 0}
          onClick={form.handleSubmit(onSubmit)}
          className={`w-full h-14 rounded-xl text-lg font-semibold ${
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

      {/* Customer Selection Sheet */}
      <Sheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Select Customer</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 overflow-auto h-[calc(100%-60px)] pb-4">
            {/* No Customer Option */}
            <button
              type="button"
              onClick={() => {
                form.setValue("customerId", null);
                setCustomerSheetOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <X className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">No Customer</p>
                <p className="text-xs text-muted-foreground">General transaction</p>
              </div>
            </button>

            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  form.setValue("customerId", customer.id);
                  setCustomerSheetOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors ${
                  form.watch("customerId") === customer.id ? "bg-primary/5 border border-primary" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
