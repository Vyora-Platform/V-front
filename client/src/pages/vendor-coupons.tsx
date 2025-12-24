import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Tag, Calendar, TrendingUp, Users, Trash2, Package, Layers, Grid3x3, Image as ImageIcon, Search, ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

const couponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1, "Discount value must be positive"),
  minOrderAmount: z.number().min(0, "Minimum order amount cannot be negative"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  maxUsage: z.number().min(1, "Max usage must be at least 1"),
  applicationType: z.enum(["all", "specific_services", "specific_products", "specific_category"]),
  applicableServices: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
});

type CouponFormData = z.infer<typeof couponFormSchema>;

export default function VendorCoupons() {
  const { vendorId, isLoading: authLoading } = useAuth(); // Get real vendor ID from localStorage
  const { toast} = useToast();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const { data: coupons = [], isLoading: loadingCoupons } = useQuery<any[]>({
    queryKey: ["/api/vendors", vendorId, "coupons"],
    enabled: !!vendorId,
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors", vendorId, "catalogue"],
    enabled: !!vendorId,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors", vendorId, "products"],
    enabled: !!vendorId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const payload = {
        vendorId: vendorId,
        code: data.code,
        description: data.description,
        image: data.image || null,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        minOrderAmount: Number(data.minOrderAmount || 0),
        expiryDate: new Date(data.expiryDate).toISOString(),
        maxUsage: Number(data.maxUsage),
        usedCount: 0,
        status: "active",
        applicationType: data.applicationType,
        applicableServices: data.applicationType === "specific_services" ? (data.applicableServices || []) : [],
        applicableProducts: data.applicationType === "specific_products" ? (data.applicableProducts || []) : [],
        applicableCategories: data.applicationType === "specific_category" ? (data.applicableCategories || []) : [],
      };
      return await apiRequest("POST", `/api/vendors/${vendorId}/coupons`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "coupons"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      setCreateDialogOpen(false);
      toast({
        title: "Coupon created",
        description: "Your coupon has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create coupon",
        description: "Please check all fields and try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CouponFormData> }) => {
      return await apiRequest("PATCH", `/api/coupons/${id}`, {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "coupons"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      setEditingCoupon(null);
      toast({
        title: "Coupon updated",
        description: "Your coupon has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update coupon",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "coupons"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({
        title: "Coupon deleted",
        description: "The coupon has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete coupon",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/coupons/${id}`, {
        status: status === "active" ? "inactive" : "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "coupons"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({
        title: "Status updated",
        description: "Coupon status has been updated",
      });
    },
  });

  // Show loading while auth or data loads
  if (authLoading || loadingCoupons || !vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b flex items-center justify-between gap-3 sticky top-0 z-10 bg-background">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0 h-9 w-9"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">Coupons</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Manage discount offers</p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9" data-testid="button-create-coupon">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Create</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Set up a new discount coupon for your customers
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              services={services}
              products={products}
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 md:px-6 py-4 flex-1">
        {loadingCoupons ? (
          <div className="text-center py-12 text-muted-foreground">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <Card className="p-8 md:p-12 text-center rounded-xl">
            <Tag className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">No coupons yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Create your first coupon to offer discounts to your customers
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="h-[var(--cta-h)]" data-testid="button-create-first-coupon">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Coupon
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {coupons.map((coupon: any) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              services={services}
              products={products}
              onEdit={() => setEditingCoupon(coupon)}
              onToggleStatus={() => toggleStatusMutation.mutate({ id: coupon.id, status: coupon.status })}
              onDelete={() => deleteMutation.mutate(coupon.id)}
            />
            ))}
          </div>
        )}
      </div>

      {editingCoupon && (
        <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
              <DialogDescription>
                Update your coupon details
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              initialData={editingCoupon}
              services={services}
              products={products}
              onSubmit={(data) => updateMutation.mutate({ id: editingCoupon.id, data })}
              isPending={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface CouponFormProps {
  initialData?: any;
  services: any[];
  products: any[];
  onSubmit: (data: CouponFormData) => void;
  isPending: boolean;
}

function CouponForm({ initialData, services, products, onSubmit, isPending }: CouponFormProps) {
  const [applicationType, setApplicationType] = useState(initialData?.applicationType || "all");
  const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.applicableServices || []);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initialData?.applicableProducts || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.applicableCategories || []);
  const [couponImage, setCouponImage] = useState(initialData?.image || "");
  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      description: initialData?.description || "",
      image: initialData?.image || "",
      discountType: initialData?.discountType || "percentage",
      discountValue: initialData?.discountValue || 10,
      minOrderAmount: initialData?.minOrderAmount || 0,
      expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
      maxUsage: initialData?.maxUsage || 100,
      applicationType: initialData?.applicationType || "all",
      applicableServices: initialData?.applicableServices || [],
      applicableProducts: initialData?.applicableProducts || [],
      applicableCategories: initialData?.applicableCategories || [],
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const submitData = {
      ...data,
      image: couponImage,
      applicationType,
      applicableServices: applicationType === "specific_services" ? selectedServices : [],
      applicableProducts: applicationType === "specific_products" ? selectedProducts : [],
      applicableCategories: applicationType === "specific_category" ? selectedCategories : [],
    };
    onSubmit(submitData);
  });

  const uniqueCategories = Array.from(new Set([
    ...services.map(s => s.category),
    ...products.map(p => p.category),
  ]));

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    return services.filter(service => 
      service.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      service.category?.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [services, serviceSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    return products.filter(product => 
      product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.category?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return uniqueCategories;
    return uniqueCategories.filter(category => 
      category?.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [uniqueCategories, categorySearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Coupon Image (Optional)</Label>
        <FileUpload
          value={couponImage}
          onChange={setCouponImage}
          category="coupon"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Coupon Code *</Label>
          <Input
            id="code"
            {...form.register("code")}
            placeholder="SAVE20"
            className="uppercase"
            data-testid="input-coupon-code"
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.code.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="maxUsage">Max Usage *</Label>
          <Input
            id="maxUsage"
            type="number"
            {...form.register("maxUsage", { valueAsNumber: true })}
            data-testid="input-max-usage"
          />
          {form.formState.errors.maxUsage && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.maxUsage.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Get 20% off on all services"
          rows={2}
          data-testid="input-description"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountType">Discount Type *</Label>
          <Select
            value={form.watch("discountType")}
            onValueChange={(value) => form.setValue("discountType", value as "percentage" | "fixed")}
          >
            <SelectTrigger data-testid="select-discount-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discountValue">Discount Value *</Label>
          <Input
            id="discountValue"
            type="number"
            {...form.register("discountValue", { valueAsNumber: true })}
            placeholder={form.watch("discountType") === "percentage" ? "20" : "500"}
            data-testid="input-discount-value"
          />
          {form.formState.errors.discountValue && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.discountValue.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            {...form.register("minOrderAmount", { valueAsNumber: true })}
            placeholder="0"
            data-testid="input-min-order"
          />
        </div>
        <div>
          <Label htmlFor="expiryDate">Expiry Date *</Label>
          <Input
            id="expiryDate"
            type="date"
            {...form.register("expiryDate")}
            min={new Date().toISOString().split('T')[0]}
            data-testid="input-expiry-date"
          />
          {form.formState.errors.expiryDate && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.expiryDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Apply To *</Label>
        <Select value={applicationType} onValueChange={setApplicationType}>
          <SelectTrigger data-testid="select-application-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products & Services</SelectItem>
            <SelectItem value="specific_services">Specific Services</SelectItem>
            <SelectItem value="specific_products">Specific Products</SelectItem>
            <SelectItem value="specific_category">Specific Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {applicationType === "specific_services" && (
        <div>
          <Label>Select Services</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-services"
            />
          </div>
          <ScrollArea className="h-48 border rounded-md p-3 mt-2">
            {filteredServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No services found
              </p>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices([...selectedServices, service.id]);
                      } else {
                        setSelectedServices(selectedServices.filter((id) => id !== service.id));
                      }
                    }}
                    data-testid={`checkbox-service-${service.id}`}
                  />
                  <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                    {service.name} - ₹{service.price}
                  </label>
                </div>
              ))
            )}
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedServices.length} service(s) selected
          </p>
        </div>
      )}

      {applicationType === "specific_products" && (
        <div>
          <Label>Select Products</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-products"
            />
          </div>
          <ScrollArea className="h-48 border rounded-md p-3 mt-2">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No products found
              </p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                      }
                    }}
                    data-testid={`checkbox-product-${product.id}`}
                  />
                  <label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer">
                    {product.name} - ₹{product.price}
                  </label>
                </div>
              ))
            )}
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedProducts.length} product(s) selected
          </p>
        </div>
      )}

      {applicationType === "specific_category" && (
        <div>
          <Label>Select Categories</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-categories"
            />
          </div>
          <ScrollArea className="h-48 border rounded-md p-3 mt-2">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories found
              </p>
            ) : (
              filteredCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, category]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((c) => c !== category));
                      }
                    }}
                    data-testid={`checkbox-category-${category}`}
                  />
                  <label htmlFor={`category-${category}`} className="text-sm cursor-pointer capitalize">
                    {category}
                  </label>
                </div>
              ))
            )}
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCategories.length} category/categories selected
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isPending} data-testid="button-submit-coupon">
          {isPending ? "Saving..." : initialData ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}

interface CouponCardProps {
  coupon: any;
  services: any[];
  products: any[];
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function CouponCard({ coupon, services, products, onEdit, onToggleStatus, onDelete }: CouponCardProps) {
  const isExpired = new Date(coupon.expiryDate) < new Date();
  const usagePercentage = (coupon.usedCount / coupon.maxUsage) * 100;

  const getApplicabilityText = () => {
    if (coupon.applicationType === "all") return "All Products & Services";
    if (coupon.applicationType === "specific_services") return `${coupon.applicableServices?.length || 0} Services`;
    if (coupon.applicationType === "specific_products") return `${coupon.applicableProducts?.length || 0} Products`;
    if (coupon.applicationType === "specific_category") return `${coupon.applicableCategories?.length || 0} Categories`;
    return "Not specified";
  };

  return (
    <Card className="hover-elevate rounded-xl min-h-[var(--card-min-h)]" data-testid={`coupon-card-${coupon.id}`}>
      {coupon.image && (
        <div className="relative h-28 md:h-32 w-full overflow-hidden rounded-t-xl">
          <img
            src={coupon.image}
            alt={coupon.code}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-3 md:p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold text-foreground font-mono truncate" data-testid="text-coupon-code">
                {coupon.code}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{coupon.description}</p>
            </div>
          </div>
          <Badge
            variant={coupon.status === "active" ? "default" : "secondary"}
            className={isExpired ? "text-destructive" : ""}
            data-testid={`badge-status-${coupon.status}`}
          >
            {isExpired ? "Expired" : coupon.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground">
                {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Discount</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold text-foreground">{coupon.usedCount}/{coupon.maxUsage}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Used</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Usage</span>
            <span>{usagePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          {coupon.minOrderAmount > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="w-3 h-3" />
              <span>Min order: ₹{coupon.minOrderAmount}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Grid3x3 className="w-3 h-3" />
            <span className="capitalize">{getApplicabilityText()}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1 h-9 text-xs"
            data-testid="button-edit-coupon"
          >
            Edit
          </Button>
          {!isExpired && (
            <Button
              size="sm"
              variant={coupon.status === "active" ? "outline" : "default"}
              onClick={onToggleStatus}
              className="flex-1 h-9 text-xs"
              data-testid="button-toggle-status"
            >
              {coupon.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="h-9 w-9 p-0"
                data-testid="button-delete-coupon"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this coupon? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
