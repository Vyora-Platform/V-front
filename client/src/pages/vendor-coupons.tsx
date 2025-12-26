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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Tag, Calendar, TrendingUp, Users, Trash2, Package, Layers, Grid3x3, Search, ArrowLeft, Percent, Gift, Clock, Sparkles, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { LoadingSpinner } from "@/components/AuthGuard";
import { Lock } from "lucide-react";

const couponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1, "Discount value must be positive"),
  minOrderAmount: z.number().min(0, "Minimum order amount cannot be negative"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  maxUsage: z.number().min(1, "Max usage must be at least 1"),
  applicationType: z.enum(["all", "all_products", "all_services", "specific_services", "specific_products", "specific_category"]),
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
  
  // Pro subscription check
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<'create' | 'update' | 'delete'>('create');

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

  // Calculate stats - MUST be before early return to follow Rules of Hooks
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c: any) => c.status === "active" && new Date(c.expiryDate) >= new Date()).length;
    const expired = coupons.filter((c: any) => new Date(c.expiryDate) < new Date()).length;
    const totalUsage = coupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0);
    const avgDiscount = total > 0 
      ? Math.round(coupons.filter((c: any) => c.discountType === "percentage").reduce((sum: number, c: any) => sum + c.discountValue, 0) / 
        Math.max(coupons.filter((c: any) => c.discountType === "percentage").length, 1))
      : 0;
    return { total, active, expired, totalUsage, avgDiscount };
  }, [coupons]);

  // Show loading while auth or data loads
  if (authLoading || loadingCoupons || !vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-gray-50/50 dark:bg-background">
      {/* Header - Fixed with Blue Theme */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-b shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="h-10 w-10 shrink-0 md:hidden text-white hover:bg-white/20"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-white hidden md:block" />
              <h1 className="text-xl md:text-2xl font-bold text-white">Coupons</h1>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-white text-blue-600 hover:bg-blue-50 h-10 px-4 font-semibold" 
            data-testid="button-create-coupon"
            onClick={() => {
              const actionCheck = canPerformAction('create');
              if (!actionCheck.allowed) {
                setBlockedAction('create');
                setShowUpgradeModal(true);
                return;
              }
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Create Coupon</span>
            {!isPro && <Lock className="w-3 h-3 ml-1 opacity-60" />}
          </Button>
        </div>
      </div>

      {/* Create Coupon Sheet - Properly aligned */}
      <Sheet open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b mb-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              Create New Coupon
            </SheetTitle>
            <SheetDescription>
              Set up a new discount coupon for your customers
            </SheetDescription>
          </SheetHeader>
          <CouponForm
            services={services}
            products={products}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
        </SheetContent>
      </Sheet>

      {/* Stats Dashboard - Blue Theme */}
      <div className="px-4 md:px-6 py-4 bg-white dark:bg-card border-b max-w-[1440px] mx-auto w-full">
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-5 scrollbar-hide">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ToggleRight className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Active</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">{stats.active}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Expired</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300">{stats.expired}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-indigo-600" />
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Used</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.totalUsage}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-cyan-600" />
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Avg %</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.avgDiscount}%</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-4 flex-1 max-w-[1440px] mx-auto w-full pb-20 md:pb-6">
        {loadingCoupons ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : coupons.length === 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Gift className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No coupons yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                Create your first coupon to offer amazing discounts and attract more customers
              </p>
              <Button 
                onClick={() => {
                  const actionCheck = canPerformAction('create');
                  if (!actionCheck.allowed) {
                    setBlockedAction('create');
                    setShowUpgradeModal(true);
                    return;
                  }
                  setCreateDialogOpen(true);
                }} 
                className="bg-blue-600 hover:bg-blue-700 h-11 px-6" 
                data-testid="button-create-first-coupon"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Coupon
                {!isPro && <Lock className="w-3 h-3 ml-1 opacity-60" />}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {coupons.map((coupon: any) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              services={services}
              products={products}
              onEdit={() => {
                const actionCheck = canPerformAction('update');
                if (!actionCheck.allowed) {
                  setBlockedAction('update');
                  setShowUpgradeModal(true);
                  return;
                }
                setEditingCoupon(coupon);
              }}
              onToggleStatus={() => {
                const actionCheck = canPerformAction('update');
                if (!actionCheck.allowed) {
                  setBlockedAction('update');
                  setShowUpgradeModal(true);
                  return;
                }
                toggleStatusMutation.mutate({ id: coupon.id, status: coupon.status });
              }}
              onDelete={() => {
                const actionCheck = canPerformAction('delete');
                if (!actionCheck.allowed) {
                  setBlockedAction('delete');
                  setShowUpgradeModal(true);
                  return;
                }
                deleteMutation.mutate(coupon.id);
              }}
              isPro={isPro}
            />
            ))}
          </div>
        )}
      </div>

      {/* Edit Coupon Sheet */}
      <Sheet open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b mb-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Edit2 className="h-4 w-4 text-blue-600" />
              </div>
              Edit Coupon
            </SheetTitle>
            <SheetDescription>
              Update your coupon details
            </SheetDescription>
          </SheetHeader>
          {editingCoupon && (
            <CouponForm
              initialData={editingCoupon}
              services={services}
              products={products}
              onSubmit={(data) => updateMutation.mutate({ id: editingCoupon.id, data })}
              isPending={updateMutation.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Pro Subscription Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.location.href = '/vendor/account';
        }}
      />
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
  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      description: initialData?.description || "",
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Coupon Code & Max Usage */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium">Coupon Code *</Label>
          <Input
            id="code"
            {...form.register("code")}
            placeholder="SAVE20"
            className="uppercase h-11 text-base"
            data-testid="input-coupon-code"
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Get 20% off on all services"
            rows={3}
            className="resize-none"
            data-testid="input-description"
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Discount Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30 space-y-4">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Discount Settings
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="discountType" className="text-xs">Type</Label>
            <Select
              value={form.watch("discountType")}
              onValueChange={(value) => form.setValue("discountType", value as "percentage" | "fixed")}
            >
              <SelectTrigger className="h-10" data-testid="select-discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountValue" className="text-xs">Value *</Label>
            <Input
              id="discountValue"
              type="number"
              {...form.register("discountValue", { valueAsNumber: true })}
              placeholder={form.watch("discountType") === "percentage" ? "20" : "500"}
              className="h-10"
              data-testid="input-discount-value"
            />
            {form.formState.errors.discountValue && (
              <p className="text-xs text-destructive">{form.formState.errors.discountValue.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Limits Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minOrderAmount" className="text-sm font-medium">Min Order (₹)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            {...form.register("minOrderAmount", { valueAsNumber: true })}
            placeholder="0"
            className="h-10"
            data-testid="input-min-order"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxUsage" className="text-sm font-medium">Max Usage *</Label>
          <Input
            id="maxUsage"
            type="number"
            {...form.register("maxUsage", { valueAsNumber: true })}
            placeholder="100"
            className="h-10"
            data-testid="input-max-usage"
          />
          {form.formState.errors.maxUsage && (
            <p className="text-xs text-destructive">{form.formState.errors.maxUsage.message}</p>
          )}
        </div>
      </div>

      {/* Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date *</Label>
        <Input
          id="expiryDate"
          type="date"
          {...form.register("expiryDate")}
          min={new Date().toISOString().split('T')[0]}
          className="h-10"
          data-testid="input-expiry-date"
        />
        {form.formState.errors.expiryDate && (
          <p className="text-xs text-destructive">{form.formState.errors.expiryDate.message}</p>
        )}
      </div>

      {/* Apply To Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Apply To *</Label>
        <Select value={applicationType} onValueChange={setApplicationType}>
          <SelectTrigger className="h-10" data-testid="select-application-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products & Services</SelectItem>
            <SelectItem value="all_products">All Products</SelectItem>
            <SelectItem value="all_services">All Services</SelectItem>
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

      <div className="pt-6">
        <Button 
          type="submit" 
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold" 
          disabled={isPending} 
          data-testid="button-submit-coupon"
        >
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
  isPro?: boolean;
}

function CouponCard({ coupon, services, products, onEdit, onToggleStatus, onDelete, isPro = false }: CouponCardProps) {
  const isExpired = new Date(coupon.expiryDate) < new Date();
  const usagePercentage = (coupon.usedCount / coupon.maxUsage) * 100;
  const daysUntilExpiry = Math.ceil((new Date(coupon.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getApplicabilityText = () => {
    if (coupon.applicationType === "all") return "All Products & Services";
    if (coupon.applicationType === "all_products") return "All Products";
    if (coupon.applicationType === "all_services") return "All Services";
    if (coupon.applicationType === "specific_services") return `${coupon.applicableServices?.length || 0} Services`;
    if (coupon.applicationType === "specific_products") return `${coupon.applicableProducts?.length || 0} Products`;
    if (coupon.applicationType === "specific_category") return `${coupon.applicableCategories?.length || 0} Categories`;
    return "Not specified";
  };

  const getStatusColor = () => {
    if (isExpired) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (coupon.status === "active") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400";
  };

  return (
    <Card className="group rounded-2xl overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-card" data-testid={`coupon-card-${coupon.id}`}>
      {/* Coupon Header with Blue Gradient */}
      <div className={`relative p-4 ${coupon.discountType === "percentage" ? "bg-gradient-to-br from-blue-500 to-blue-700" : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 translate-y-6 -translate-x-6" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <Badge className={`${getStatusColor()} border-0 text-[10px] mb-2`}>
              {isExpired ? "Expired" : coupon.status === "active" ? "Active" : "Inactive"}
            </Badge>
            <h3 className="text-lg md:text-xl font-bold text-white font-mono tracking-wider truncate" data-testid="text-coupon-code">
              {coupon.code}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
            </p>
            <p className="text-white/80 text-xs">OFF</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{coupon.description}</p>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Usage</span>
            <span className="text-xs font-semibold">{coupon.usedCount} / {coupon.maxUsage}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercentage >= 90 ? "bg-red-500" : usagePercentage >= 70 ? "bg-amber-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-muted/30 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">
                {isExpired ? "Expired" : daysUntilExpiry <= 7 ? `${daysUntilExpiry}d left` : "Expires"}
              </p>
              <p className="text-xs font-medium truncate">
                {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-muted/30 rounded-lg">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Min Order</p>
              <p className="text-xs font-medium truncate">
                {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Apply To */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Grid3x3 className="w-3.5 h-3.5" />
          <span className="capitalize">{getApplicabilityText()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1 h-9 text-xs gap-1"
            data-testid="button-edit-coupon"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
          {!isExpired && (
            <Button
              size="sm"
              variant={coupon.status === "active" ? "outline" : "default"}
              onClick={onToggleStatus}
              className="flex-1 h-9 text-xs gap-1"
              data-testid="button-toggle-status"
            >
              {coupon.status === "active" ? (
                <>
                  <ToggleLeft className="w-3 h-3" />
                  Pause
                </>
              ) : (
                <>
                  <ToggleRight className="w-3 h-3" />
                  Enable
                </>
              )}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                data-testid="button-delete-coupon"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{coupon.code}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
