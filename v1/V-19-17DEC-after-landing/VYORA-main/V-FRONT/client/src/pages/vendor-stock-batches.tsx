import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Package, Calendar, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { VendorProduct } from "@shared/schema";
import { format, differenceInDays, isPast } from "date-fns";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const batchSchema = z.object({
  vendorProductId: z.string().min(1, "Product is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  expiryDate: z.string().optional(),
  manufacturingDate: z.string().optional(),
  costPrice: z.coerce.number().nonnegative("Cost price cannot be negative").optional().or(z.literal("")),
  supplier: z.string().optional(),
});

interface StockBatch {
  id: string;
  vendorProductId: string;
  batchNumber: string;
  quantity: number;
  remainingQuantity: number;
  expiryDate: string | null;
  manufacturingDate: string | null;
  costPrice: number | null;
  supplier: string | null;
  locationId: string | null;
  createdAt: string;
}

export default function VendorStockBatches() {
  const { vendorId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [batchDialog, setBatchDialog] = useState(false);

  const form = useForm<z.infer<typeof batchSchema>>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      vendorProductId: "",
      batchNumber: "",
      quantity: 0,
      expiryDate: "",
      manufacturingDate: "",
      costPrice: "",
      supplier: "",
    },
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const { data: batches = [] } = useQuery<StockBatch[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-batches`],
    enabled: !!vendorId,
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/stock-batches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-batches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
      setBatchDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create batch",
        variant: "destructive",
      });
    },
  });

  const handleCreateBatch = (values: z.infer<typeof batchSchema>) => {
    const costPriceValue = values.costPrice && values.costPrice !== "" 
      ? (typeof values.costPrice === "string" ? parseFloat(values.costPrice) : values.costPrice)
      : null;
      
    createBatchMutation.mutate({
      vendorProductId: values.vendorProductId,
      batchNumber: values.batchNumber,
      quantity: values.quantity,
      remainingQuantity: values.quantity,
      expiryDate: values.expiryDate || null,
      manufacturingDate: values.manufacturingDate || null,
      costPrice: costPriceValue,
      supplier: values.supplier || null,
    });
  };

  const getBatchStatus = (batch: StockBatch) => {
    if (!batch.expiryDate) return null;
    
    const expiryDateObj = new Date(batch.expiryDate);
    if (isPast(expiryDateObj)) {
      return { label: "Expired", variant: "destructive" as const };
    }
    
    const daysUntilExpiry = differenceInDays(expiryDateObj, new Date());
    if (daysUntilExpiry <= 7) {
      return { label: `Expires in ${daysUntilExpiry}d`, variant: "destructive" as const };
    } else if (daysUntilExpiry <= 30) {
      return { label: `Expires in ${daysUntilExpiry}d`, variant: "default" as const };
    }
    
    return { label: `Expires ${format(expiryDateObj, "MMM dd, yyyy")}`, variant: "secondary" as const };
  };

  const expiringBatches = batches.filter(b => {
    if (!b.expiryDate) return false;
    const daysUntilExpiry = differenceInDays(new Date(b.expiryDate), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  const expiredBatches = batches.filter(b => {
    if (!b.expiryDate) return false;
    return isPast(new Date(b.expiryDate));
  });

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Batches</h1>
          <p className="text-muted-foreground">Manage inventory batches with expiry tracking</p>
        </div>
        <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-batch">
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-batch">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>Add a new inventory batch with tracking details</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateBatch)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendorProductId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-batch-product">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input data-testid="input-batch-number" placeholder="e.g., BATCH-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input data-testid="input-batch-quantity" type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-expiry-date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturing Date (Optional)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-manufacturing-date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price (Optional)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-cost-price" type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier (Optional)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-supplier" placeholder="Supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setBatchDialog(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-batch"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBatchMutation.isPending}
                    data-testid="button-submit-batch"
                  >
                    {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-batches">{batches.length}</div>
            <p className="text-xs text-muted-foreground">Active inventory batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-expiring-batches">{expiringBatches.length}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-expired-batches">
              {expiredBatches.length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>View and manage all inventory batches</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No batches found. Create your first batch to get started.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => {
                  const status = getBatchStatus(batch);
                  return (
                    <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                      <TableCell className="font-medium" data-testid={`text-batch-number-${batch.id}`}>
                        {batch.batchNumber}
                      </TableCell>
                      <TableCell data-testid={`text-batch-product-${batch.id}`}>
                        {getProductName(batch.vendorProductId)}
                      </TableCell>
                      <TableCell data-testid={`text-batch-quantity-${batch.id}`}>
                        {batch.quantity}
                      </TableCell>
                      <TableCell data-testid={`text-batch-remaining-${batch.id}`}>
                        {batch.remainingQuantity}
                      </TableCell>
                      <TableCell data-testid={`text-batch-expiry-${batch.id}`}>
                        {batch.expiryDate ? format(new Date(batch.expiryDate), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell data-testid={`text-batch-status-${batch.id}`}>
                        {status && <Badge variant={status.variant}>{status.label}</Badge>}
                      </TableCell>
                      <TableCell data-testid={`text-batch-supplier-${batch.id}`}>
                        {batch.supplier || "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
