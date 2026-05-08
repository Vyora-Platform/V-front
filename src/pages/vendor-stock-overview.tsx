import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { VendorProduct, StockMovement, StockAlert } from "@shared/schema";
import { format } from "date-fns";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive("Quantity must be a positive number"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export default function VendorStockOverview() {
  const { vendorId } = useAuth();
  const queryClient = useQueryClient();
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  // Fetch vendor products
  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/vendor-products`],
    enabled: !!vendorId,
  });

  // Fetch stock movements
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-movements`],
    enabled: !!vendorId,
  });

  // Fetch stock alerts
  const { data: alerts = [] } = useQuery<StockAlert[]>({
    queryKey: [`/api/vendors/${vendorId}/stock-alerts`],
    enabled: !!vendorId,
  });

  // Fetch stock value
  const { data: stockValueData } = useQuery<{ totalValue: number }>({
    queryKey: [`/api/vendors/${vendorId}/stock/value`],
    enabled: !!vendorId,
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ productId, type, qty, rsn }: { productId: string; type: "in" | "out"; qty: number; rsn: string }) => {
      const endpoint = type === "in" 
        ? `/api/vendor-products/${productId}/stock-in`
        : `/api/vendor-products/${productId}/stock-out`;
      
      return apiRequest("POST", endpoint, {
        quantity: qty,
        reason: rsn,
        referenceType: "manual",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/vendor-products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-movements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-alerts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock/value`] });
      setAdjustmentDialog(false);
      setQuantity("");
      setReason("");
    },
  });

  // Alert actions
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest("POST", `/api/stock-alerts/${alertId}/acknowledge`, {
        userId: "user-1",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-alerts`] });
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest("POST", `/api/stock-alerts/${alertId}/dismiss`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/stock-alerts`] });
    },
  });

  const handleAdjustStock = () => {
    if (!selectedProduct || !quantity || !reason) return;

    const qty = parseInt(quantity);
    
    // Validate the adjustment
    const validation = stockAdjustmentSchema.safeParse({
      quantity: qty,
      reason: reason,
    });

    if (!validation.success) {
      console.error("Validation error:", validation.error.errors);
      return;
    }

    adjustStockMutation.mutate({
      productId: selectedProduct,
      type: adjustmentType,
      qty,
      rsn: reason,
    });
  };

  // Calculate summary metrics
  const lowStockProducts = products.filter(p => p.stock <= 10);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const activeAlerts = alerts.filter(a => a.status === "active");

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "in": return "text-green-600 dark:text-green-400";
      case "out": return "text-orange-600 dark:text-orange-400";
      case "sale": return "text-blue-600 dark:text-blue-400";
      case "adjustment": return "text-gray-600 dark:text-gray-400";
      default: return "";
    }
  };

  const getAlertSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive" data-testid={`badge-severity-critical`}>Critical</Badge>;
      case "high": return <Badge className="bg-orange-500 hover:bg-orange-600" data-testid={`badge-severity-high`}>High</Badge>;
      case "medium": return <Badge className="bg-yellow-500 hover:bg-yellow-600" data-testid={`badge-severity-medium`}>Medium</Badge>;
      case "low": return <Badge variant="secondary" data-testid={`badge-severity-low`}>Low</Badge>;
      default: return <Badge variant="outline" data-testid={`badge-severity-default`}>{severity}</Badge>;
    }
  };


  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-stock-overview">Stock Turnover Management</h1>
          <p className="text-muted-foreground">Track inventory, manage stock levels, and monitor alerts</p>
        </div>
        
        <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-adjust-stock">
              <Package className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-adjust-stock">
            <DialogHeader>
              <DialogTitle>Adjust Stock Levels</DialogTitle>
              <DialogDescription>
                Add or remove stock for a product manually
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="product" data-testid="select-product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                        {product.name} (Current: {product.stock} {product.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as "in" | "out")}>
                  <SelectTrigger id="type" data-testid="select-adjustment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in" data-testid="option-stock-in">Stock In (Add)</SelectItem>
                    <SelectItem value="out" data-testid="option-stock-out">Stock Out (Remove)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  data-testid="input-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Manual count adjustment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="input-reason"
                />
              </div>

              <Button
                onClick={handleAdjustStock}
                disabled={!selectedProduct || !quantity || !reason || adjustStockMutation.isPending}
                className="w-full"
                data-testid="button-submit-adjustment"
              >
                {adjustStockMutation.isPending ? "Processing..." : "Submit Adjustment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-total-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stock-value">
              ₹{stockValueData?.totalValue.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">{products.length} products</p>
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-low-stock-count">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-out-of-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-out-of-stock-count">
              {outOfStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">Urgent restocking needed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-alerts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-alerts-count">
              {activeAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">Pending action</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements" data-testid="tab-movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">All Products</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Track all stock in and out transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">New Stock</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 20).map((movement) => {
                    const product = products.find(p => p.id === movement.vendorProductId);
                    return (
                      <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                        <TableCell className="text-xs">
                          {format(new Date(movement.createdAt), "MMM dd, HH:mm")}
                        </TableCell>
                        <TableCell className="font-medium">{product?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${getMovementTypeColor(movement.movementType)}`}>
                            {movement.movementType === "in" && <ArrowUpCircle className="w-4 h-4" />}
                            {(movement.movementType === "out" || movement.movementType === "sale") && <ArrowDownCircle className="w-4 h-4" />}
                            <span className="capitalize">{movement.movementType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{movement.previousStock}</TableCell>
                        <TableCell className="text-right font-medium">{movement.newStock}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{movement.reason}</TableCell>
                      </TableRow>
                    );
                  })}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No stock movements yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            {activeAlerts.map((alert) => {
              const product = products.find(p => p.id === alert.vendorProductId);
              return (
                <Alert key={alert.id} data-testid={`alert-${alert.id}`}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {alert.alertType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    {getAlertSeverityBadge(alert.severity)}
                  </AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product?.name}</p>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.createdAt), "PPp")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                        data-testid={`button-acknowledge-${alert.id}`}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlertMutation.mutate(alert.id)}
                        data-testid={`button-dismiss-${alert.id}`}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
            {activeAlerts.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No active alerts
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>All Products Stock Status</CardTitle>
              <CardDescription>Current stock levels for all products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell className="text-right font-mono">{product.stock}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">₹{product.price}</TableCell>
                      <TableCell>
                        {product.stock === 0 && (
                          <Badge variant="destructive" data-testid={`badge-status-${product.id}`}>Out of Stock</Badge>
                        )}
                        {product.stock > 0 && product.stock <= 10 && (
                          <Badge className="bg-orange-500 hover:bg-orange-600" data-testid={`badge-status-${product.id}`}>Low Stock</Badge>
                        )}
                        {product.stock > 10 && (
                          <Badge variant="secondary" data-testid={`badge-status-${product.id}`}>In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No products available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
