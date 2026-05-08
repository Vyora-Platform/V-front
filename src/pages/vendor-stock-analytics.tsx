import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, BarChart3, ArrowLeft } from "lucide-react";
import type { VendorProduct } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

interface StockAnalytics {
  totalStockValue: number;
  averageTurnoverRate: number;
  slowMovingProducts: Array<{
    productId: string;
    productName: string;
    stock: number;
    turnoverRate: number;
  }>;
  topMovingProducts: Array<{
    productId: string;
    productName: string;
    stock: number;
    turnoverRate: number;
  }>;
}

export default function VendorStockAnalytics() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const { data: analytics } = useQuery<StockAnalytics>({
    queryKey: [`/api/vendors/${vendorId}/stock-analytics`],
    enabled: !!vendorId,
  });

  const getTurnoverBadge = (rate: number) => {
    if (rate >= 10) return { label: "Fast Moving", variant: "default" as const };
    if (rate >= 5) return { label: "Moderate", variant: "secondary" as const };
    return { label: "Slow Moving", variant: "outline" as const };
  };

  const totalStockValue = analytics?.totalStockValue || 0;
  const averageTurnoverRate = analytics?.averageTurnoverRate || 0;
  const slowMovingProducts = analytics?.slowMovingProducts || [];
  const topMovingProducts = analytics?.topMovingProducts || [];

  return (
    <div className="flex flex-col gap-6 p-3 sm:p-4 md:p-6 pb-16 md:pb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/vendor/dashboard")}
          className="md:hidden flex-shrink-0"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Analytics</h1>
          <p className="text-muted-foreground">Track inventory performance and turnover rates</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-stock-value">
              ₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Turnover Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-turnover-rate">
              {averageTurnoverRate.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">Per month average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fast Moving</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-fast-moving-count">
              {topMovingProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">High turnover products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Moving</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground" data-testid="text-slow-moving-count">
              {slowMovingProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Moving Products
            </CardTitle>
            <CardDescription>Products with highest turnover rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Turnover Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMovingProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No data available yet
                    </TableCell>
                  </TableRow>
                ) : (
                  topMovingProducts.map((product) => {
                    const badge = getTurnoverBadge(product.turnoverRate);
                    return (
                      <TableRow key={product.productId} data-testid={`row-top-product-${product.productId}`}>
                        <TableCell className="font-medium" data-testid={`text-top-product-name-${product.productId}`}>
                          {product.productName}
                        </TableCell>
                        <TableCell data-testid={`text-top-product-stock-${product.productId}`}>
                          {product.stock}
                        </TableCell>
                        <TableCell data-testid={`text-top-product-turnover-${product.productId}`}>
                          {product.turnoverRate.toFixed(1)}x/mo
                        </TableCell>
                        <TableCell data-testid={`text-top-product-status-${product.productId}`}>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Slow Moving Products
            </CardTitle>
            <CardDescription>Products with low turnover requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Turnover Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowMovingProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No slow moving products
                    </TableCell>
                  </TableRow>
                ) : (
                  slowMovingProducts.map((product) => {
                    const badge = getTurnoverBadge(product.turnoverRate);
                    return (
                      <TableRow key={product.productId} data-testid={`row-slow-product-${product.productId}`}>
                        <TableCell className="font-medium" data-testid={`text-slow-product-name-${product.productId}`}>
                          {product.productName}
                        </TableCell>
                        <TableCell data-testid={`text-slow-product-stock-${product.productId}`}>
                          {product.stock}
                        </TableCell>
                        <TableCell data-testid={`text-slow-product-turnover-${product.productId}`}>
                          {product.turnoverRate.toFixed(1)}x/mo
                        </TableCell>
                        <TableCell data-testid={`text-slow-product-status-${product.productId}`}>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Products - Turnover Analysis
          </CardTitle>
          <CardDescription>Complete inventory turnover breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const stockValue = product.stock * product.price;
                  const stockStatus = product.stock === 0 
                    ? { label: "Out of Stock", variant: "destructive" as const }
                    : product.stock <= 10 
                    ? { label: "Low Stock", variant: "outline" as const }
                    : { label: "In Stock", variant: "secondary" as const };
                  
                  return (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell className="font-medium" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </TableCell>
                      <TableCell data-testid={`text-product-category-${product.id}`}>
                        {product.category}
                      </TableCell>
                      <TableCell data-testid={`text-product-stock-${product.id}`}>
                        {product.stock}
                      </TableCell>
                      <TableCell data-testid={`text-product-price-${product.id}`}>
                        ₹{product.price.toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-product-value-${product.id}`}>
                        ₹{stockValue.toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-product-status-${product.id}`}>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
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
