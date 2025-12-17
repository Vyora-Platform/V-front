import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

export default function VendorLedgerTransaction() {
  const { vendorId } = useAuth();
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [customerOpen, setCustomerOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");

  // ⚠️ LEDGER IMMUTABILITY: Ledgers should not be edited once recorded
  // Redirect to main ledger if someone tries to edit
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

  // Fetch transaction if editing
  const { data: transaction, isLoading: transactionLoading } = useQuery({
    queryKey: ["/api/ledger-transactions", id],
    enabled: isEditing,
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

  // Populate form when editing
  useEffect(() => {
    if (transaction && isEditing) {
      form.reset({
        customerId: transaction.customerId || null,
        type: transaction.type,
        amount: transaction.amount,
        transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        description: transaction.description || "",
        note: transaction.note || "",
        isRecurring: transaction.isRecurring || false,
        recurringPattern: transaction.recurringPattern || null,
        recurringStartDate: transaction.recurringStartDate ? new Date(transaction.recurringStartDate).toISOString().split('T')[0] : "",
        recurringEndDate: transaction.recurringEndDate ? new Date(transaction.recurringEndDate).toISOString().split('T')[0] : "",
        attachments: transaction.attachments || [],
      });
    }
  }, [transaction, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", `/api/vendors/${vendorId}/ledger-transactions`, data),
    onSuccess: () => {
      toast({
        title: "Transaction created",
        description: "The transaction has been added to your ledger.",
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

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("PATCH", `/api/ledger-transactions/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "ledger-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "ledger-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-transactions", id] });
      navigate("/vendor/ledger");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedCustomer = customers.find(c => c.id === form.watch("customerId"));
  const isRecurring = form.watch("isRecurring");

  const addAttachment = () => {
    if (attachmentUrl.trim()) {
      const currentAttachments = form.getValues("attachments");
      form.setValue("attachments", [...currentAttachments, attachmentUrl.trim()]);
      setAttachmentUrl("");
    }
  };

  const removeAttachment = (index: number) => {
    const currentAttachments = form.getValues("attachments");
    form.setValue("attachments", currentAttachments.filter((_, i) => i !== index));
  };

  if (isEditing && transactionLoading) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/vendor/ledger")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ledger
      </Button>

      <Card>
        <CardHeader>
          <CardTitle data-testid="heading-transaction-form">
            {isEditing ? "Edit Transaction" : "Add New Transaction"}
          </CardTitle>
          <CardDescription>
            {isEditing ? "Update transaction details" : "Record a new money in or out transaction"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between"
                            data-testid="button-select-customer"
                          >
                            {selectedCustomer ? selectedCustomer.name : "Select customer (optional)"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search customer..." data-testid="input-search-customer" />
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                field.onChange(null);
                                setCustomerOpen(false);
                              }}
                            >
                              None (General transaction)
                            </CommandItem>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.id}
                                onSelect={() => {
                                  field.onChange(customer.id);
                                  setCustomerOpen(false);
                                }}
                                data-testid={`customer-option-${customer.id}`}
                              >
                                <div>
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Link this transaction to a customer or leave empty for general transactions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transaction-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in">In (Received)</SelectItem>
                          <SelectItem value="out">Out (Paid)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date */}
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-transaction-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category and Payment Method */}
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="advance">Advance</SelectItem>
                          <SelectItem value="refund">Refund</SelectItem>
                          <SelectItem value="subscription">Subscription</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the transaction"
                        className="resize-none"
                        rows={2}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Internal Note */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes (not visible to customer)"
                        className="resize-none"
                        rows={2}
                        {...field}
                        data-testid="input-note"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring Transaction */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Recurring Transaction</FormLabel>
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
                  <div className="space-y-4 pl-4 border-l-2">
                    <FormField
                      control={form.control}
                      name="recurringPattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-recurring-pattern">
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="recurringStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-recurring-start-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurringEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-recurring-end-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <FormLabel>Attachments (Optional)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter attachment URL"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    data-testid="input-attachment-url"
                  />
                  <Button type="button" onClick={addAttachment} variant="outline" data-testid="button-add-attachment">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.watch("attachments").length > 0 && (
                  <div className="space-y-2 mt-2">
                    {form.watch("attachments").map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1 text-sm truncate">{url}</span>
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

              <div className="flex gap-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-transaction">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Transaction" : "Save Transaction"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/vendor/ledger")} data-testid="button-cancel">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
