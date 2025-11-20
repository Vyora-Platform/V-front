import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Award,
  BarChart3,
  Plus,
  Minus,
  Bell
} from "lucide-react";
import { VendorProduct, StockMovement, StockAlert } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const USER_ID = "user-1";

// Form schemas
const stockInSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  supplier: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  batchNo: z.string().optional(),
  expiryDate: z.string().optional(),
  warrantyDate: z.string().optional(),
  purchasingCost: z.coerce.number().optional(),
});

const stockOutSchema = z.object({
  reason: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

const setAlertSchema = z.object({
  minStockLevel: z.coerce.number().min(0, "Minimum stock level must be at least 0"),
  maxStockLevel: z.coerce.number().min(1, "Maximum stock level must be at least 1"),
  reorderPoint: z.coerce.number().min(0, "Reorder point must be at least 0"),
});

type StockInForm = z.infer<typeof stockInSchema>;
type StockOutForm = z.infer<typeof stockOutSchema>;
type SetAlertForm = z.infer<typeof setAlertSchema>;

export default function VendorStockTurnover() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [stockInDialogOpen, setStockInDialogOpen] = useState(false);
  const [stockOutDialogOpen, setStockOutDialogOpen] = useState(false);
  const [setAlertDialogOpen, setSetAlertDialogOpen] = useState(false);

  const { data: analytics } = useQuery<{
    totalStockValue: number;
    lowStockItems: number;
    highStockItems: number;
    outOfStockItems: number;
    bestSellingItems: number;
    leastSellingItems: number;
  }>({
    queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`],
    enabled: !!vendorId,
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-movements`],
    enabled: !!vendorId,
  });

  const { data: alerts = [] } = useQuery<StockAlert[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-alerts`],
    enabled: !!vendorId,
  });

  // Stock In form
  const stockInForm = useForm<StockInForm>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      reason: "",
      supplier: "",
      quantity: 1,
      batchNo: "",
      expiryDate: "",
      warrantyDate: "",
      purchasingCost: 0,
    },
  });

  // Stock Out form
  const stockOutForm = useForm<StockOutForm>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      reason: "",
      quantity: 1,
    },
  });

  // Set Alert form
  const setAlertForm = useForm<SetAlertForm>({
    resolver: zodResolver(setAlertSchema),
    defaultValues: {
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 20,
    },
  });

  // Stock In mutation
  const stockInMutation = useMutation({
    mutationFn: async (data: StockInForm & { productId: string }) => {
      const batchData = data.batchNo ? {
        vendorProductId: data.productId,
        batchNumber: data.batchNo,
        quantity: data.quantity,
        remainingQuantity: data.quantity,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        manufacturingDate: data.warrantyDate ? new Date(data.warrantyDate) : null,
        costPrice: data.purchasingCost || 0,
        supplier: data.supplier || null,
      } : null;

      if (batchData) {
        await apiRequest("POST", "/api/stock-batches", batchData);
      }

      return await apiRequest("POST", `/api/vendors/${vendorId}/products/${data.productId}/stock-in`, {
        quantity: data.quantity,
        reason: data.reason,
        supplier: data.supplier,
        userId: USER_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-movements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`] });
      toast({
        title: "Stock In Successful",
        description: "Stock has been added successfully",
      });
      setStockInDialogOpen(false);
      stockInForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
    },
  });

  // Stock Out mutation
  const stockOutMutation = useMutation({
    mutationFn: async (data: StockOutForm & { productId: string }) => {
      return await apiRequest("POST", `/api/vendors/${vendorId}/products/${data.productId}/stock-out`, {
        quantity: data.quantity,
        reason: data.reason || "Manual adjustment",
        userId: USER_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-movements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`] });
      toast({
        title: "Stock Out Successful",
        description: "Stock has been removed successfully",
      });
      setStockOutDialogOpen(false);
      stockOutForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove stock",
        variant: "destructive",
      });
    },
  });

  // Set Alert mutation
  const setAlertMutation = useMutation({
    mutationFn: async (data: SetAlertForm & { productId: string }) => {
      return await apiRequest("POST", "/api/stock-configs", {
        vendorProductId: data.productId,
        minStockLevel: data.minStockLevel,
        maxStockLevel: data.maxStockLevel,
        reorderPoint: data.reorderPoint,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-turnover-analytics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-alerts`] });
      toast({
        title: "Alert Set Successfully",
        description: "Stock alert levels have been updated",
      });
      setSetAlertDialogOpen(false);
      setAlertForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set alert",
        variant: "destructive",
      });
    },
  });

  const handleStockIn = (product: VendorProduct) => {
    setSelectedProduct(product);
    setStockInDialogOpen(true);
  };

  const handleStockOut = (product: VendorProduct) => {
    setSelectedProduct(product);
    setStockOutDialogOpen(true);
  };

  const handleSetAlert = (product: VendorProduct) => {
    setSelectedProduct(product);
    setSetAlertDialogOpen(true);
  };

  const onStockInSubmit = (data: StockInForm) => {
    if (selectedProduct) {
      stockInMutation.mutate({ ...data, productId: selectedProduct.id });
    }
  };

  const onStockOutSubmit = (data: StockOutForm) => {
    if (selectedProduct) {
      stockOutMutation.mutate({ ...data, productId: selectedProduct.id });
    }
  };

  const onSetAlertSubmit = (data: SetAlertForm) => {
    if (selectedProduct) {
      setAlertMutation.mutate({ ...data, productId: selectedProduct.id });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const getStockStatus = (product: VendorProduct) => {
    if (product.stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (product.stock < 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };


  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h1 className="text-xl font-bold" data-testid="text-page-title">Stock Turnover</h1>
        <p className="text-xs text-muted-foreground">Inventory analytics</p>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Card className="p-3" data-testid="card-total-stock-value">
            <p className="text-xs text-muted-foreground mb-1">Stock Value</p>
            <p className="text-lg font-bold" data-testid="text-total-stock-value">
              {formatCurrency(analytics?.totalStockValue || 0)}
            </p>
          </Card>
          <Card className="p-3" data-testid="card-low-stock-items">
            <p className="text-xs text-muted-foreground mb-1">Low Stock</p>
            <p className="text-lg font-bold text-orange-600" data-testid="text-low-stock-items">
              {analytics?.lowStockItems || 0}
            </p>
          </Card>
          <Card className="p-3" data-testid="card-high-stock-items">
            <p className="text-xs text-muted-foreground mb-1">High Stock</p>
            <p className="text-lg font-bold text-green-600" data-testid="text-high-stock-items">
              {analytics?.highStockItems || 0}
            </p>
          </Card>
          <Card className="p-3" data-testid="card-out-of-stock-items">
            <p className="text-xs text-muted-foreground mb-1">Out of Stock</p>
            <p className="text-lg font-bold text-red-600" data-testid="text-out-of-stock-items">
              {analytics?.outOfStockItems || 0}
            </p>
          </Card>
          <Card className="p-3" data-testid="card-best-selling-items">
            <p className="text-xs text-muted-foreground mb-1">Best Selling</p>
            <p className="text-lg font-bold text-blue-600" data-testid="text-best-selling-items">
              {analytics?.bestSellingItems || 0}
            </p>
          </Card>
          <Card className="p-3" data-testid="card-least-selling-items">
            <p className="text-xs text-muted-foreground mb-1">Least Selling</p>
            <p className="text-lg font-bold" data-testid="text-least-selling-items">
              {analytics?.leastSellingItems || 0}
            </p>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
      {/* Tabs Section */}
      <Tabs defaultValue="all-products" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="all-products" data-testid="tab-all-products">
            All Products
          </TabsTrigger>
          <TabsTrigger value="stock-movement" data-testid="tab-stock-movement">
            Stock Movement
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* All Products Tab */}
        <TabsContent value="all-products" className="space-y-4">
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No products found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const status = getStockStatus(product);
                const stockWorth = product.price * product.stock;
                
                return (
                  <Card key={product.id} data-testid={`card-product-${product.id}`} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center">
                            <Award className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-foreground mb-1" data-testid={`text-product-name-${product.id}`}>
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`text-product-category-${product.id}`}>
                            ({product.category})
                          </p>
                          <div className="space-y-1">
                            <p className="text-base font-semibold" data-testid={`text-product-price-${product.id}`}>
                              PRICE-{formatCurrency(product.price)}
                            </p>
                            <p className="text-base font-semibold" data-testid={`text-product-stock-worth-${product.id}`}>
                              STOCK WORTH-{formatCurrency(stockWorth)}
                            </p>
                          </div>
                        </div>

                        {/* Stock Quantity */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-4xl font-bold text-foreground" data-testid={`text-product-stock-${product.id}`}>
                            {product.stock}
                          </div>
                          <div className="text-sm font-semibold text-muted-foreground mt-1">
                            PACKETS
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button
                          onClick={() => handleSetAlert(product)}
                          data-testid={`button-set-alert-${product.id}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          SET REMINDER
                        </Button>
                        <Button
                          onClick={() => handleStockIn(product)}
                          data-testid={`button-stock-in-${product.id}`}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          + STOCK IN
                        </Button>
                        <Button
                          onClick={() => handleStockOut(product)}
                          data-testid={`button-stock-out-${product.id}`}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                        >
                          + STOCK OUT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Stock Movement Tab */}
        <TabsContent value="stock-movement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No stock movements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.slice(0, 20).map((movement) => (
                      <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                        <TableCell data-testid={`text-movement-date-${movement.id}`}>
                          {new Date(movement.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={movement.movementType === 'in' ? 'default' : 'destructive'}
                            data-testid={`badge-movement-type-${movement.id}`}
                          >
                            {movement.movementType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-movement-quantity-${movement.id}`}>
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </TableCell>
                        <TableCell data-testid={`text-movement-reason-${movement.id}`}>
                          {movement.reason || '-'}
                        </TableCell>
                        <TableCell data-testid={`text-movement-reference-${movement.id}`}>
                          {movement.referenceId || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No alerts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.slice(0, 20).map((alert) => (
                      <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`}>
                        <TableCell>
                          <Badge data-testid={`badge-alert-type-${alert.id}`}>
                            {alert.alertType.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-alert-message-${alert.id}`}>
                          {alert.message}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={alert.status === 'active' ? 'destructive' : 'default'}
                            data-testid={`badge-alert-status-${alert.id}`}
                          >
                            {alert.status}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-alert-created-${alert.id}`}>
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock In Dialog */}
      <Dialog open={stockInDialogOpen} onOpenChange={setStockInDialogOpen}>
        <DialogContent data-testid="dialog-stock-in">
          <DialogHeader>
            <DialogTitle>Stock In - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Add stock for this product
            </DialogDescription>
          </DialogHeader>
          <Form {...stockInForm}>
            <form onSubmit={stockInForm.handleSubmit(onStockInSubmit)} className="space-y-4">
              <FormField
                control={stockInForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-stock-in-reason">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Return">Return</SelectItem>
                        <SelectItem value="Transfer In">Transfer In</SelectItem>
                        <SelectItem value="Adjustment">Adjustment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter quantity" 
                        {...field}
                        data-testid="input-stock-in-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter supplier name" 
                        {...field}
                        data-testid="input-stock-in-supplier"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="batchNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter batch number" 
                        {...field}
                        data-testid="input-stock-in-batch-no"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        data-testid="input-stock-in-expiry-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="warrantyDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        data-testid="input-stock-in-warranty-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockInForm.control}
                name="purchasingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchasing Cost</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter cost" 
                        {...field}
                        data-testid="input-stock-in-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStockInDialogOpen(false)}
                  data-testid="button-cancel-stock-in"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={stockInMutation.isPending}
                  data-testid="button-submit-stock-in"
                >
                  {stockInMutation.isPending ? "Adding..." : "Add Stock"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stock Out Dialog */}
      <Dialog open={stockOutDialogOpen} onOpenChange={setStockOutDialogOpen}>
        <DialogContent data-testid="dialog-stock-out">
          <DialogHeader>
            <DialogTitle>Stock Out - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Remove stock for this product
            </DialogDescription>
          </DialogHeader>
          <Form {...stockOutForm}>
            <form onSubmit={stockOutForm.handleSubmit(onStockOutSubmit)} className="space-y-4">
              <FormField
                control={stockOutForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-stock-out-reason">
                          <SelectValue placeholder="Select reason (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Damage">Damage</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Transfer Out">Transfer Out</SelectItem>
                        <SelectItem value="Adjustment">Adjustment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockOutForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter quantity" 
                        {...field}
                        data-testid="input-stock-out-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStockOutDialogOpen(false)}
                  data-testid="button-cancel-stock-out"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={stockOutMutation.isPending}
                  data-testid="button-submit-stock-out"
                >
                  {stockOutMutation.isPending ? "Removing..." : "Remove Stock"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Set Alert Dialog */}
      <Dialog open={setAlertDialogOpen} onOpenChange={setSetAlertDialogOpen}>
        <DialogContent data-testid="dialog-set-alert">
          <DialogHeader>
            <DialogTitle>Set Stock Alert - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Configure stock alert levels for this product
            </DialogDescription>
          </DialogHeader>
          <Form {...setAlertForm}>
            <form onSubmit={setAlertForm.handleSubmit(onSetAlertSubmit)} className="space-y-4">
              <FormField
                control={setAlertForm.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter minimum stock level" 
                        {...field}
                        data-testid="input-alert-min-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={setAlertForm.control}
                name="maxStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Stock Level *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter maximum stock level" 
                        {...field}
                        data-testid="input-alert-max-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={setAlertForm.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Point *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter reorder point" 
                        {...field}
                        data-testid="input-alert-reorder-point"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSetAlertDialogOpen(false)}
                  data-testid="button-cancel-alert"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={setAlertMutation.isPending}
                  data-testid="button-submit-alert"
                >
                  {setAlertMutation.isPending ? "Setting..." : "Set Alert"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
