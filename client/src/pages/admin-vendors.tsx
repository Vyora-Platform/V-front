import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, Search, CreditCard, Users, Calendar, Crown, Shield, Ban, CheckCircle2,
  Phone, MessageCircle, Bell, Eye, Edit, Package, BarChart3, Trash2, ChevronDown,
  ChevronUp, MapPin, Mail, Filter, Download, RefreshCw, TrendingUp, TrendingDown,
  Activity, Clock, AlertTriangle, Zap, Star, Gift, Settings, FileText, ArrowUpRight,
  Smartphone, Globe, ShoppingBag, Briefcase, LayoutGrid, List, MoreVertical, X,
  Send, ExternalLink, Copy, ChevronRight, Sparkles, Target, PieChart, DollarSign,
  UserCheck, Receipt, HeadphonesIcon, MessageSquare, WalletCards, CircleCheck,
  CircleX, Timer, Flame, Award, Hash
} from "lucide-react";
import type { Vendor, VendorSubscription, SubscriptionPlan, BillingHistory, Customer, Lead, VendorProduct, VendorCatalogue, Supplier, Order } from "@shared/schema";
import { format, formatDistanceToNow, differenceInDays, isAfter, isBefore, addDays } from "date-fns";

type VendorWithSubscription = Vendor & {
  subscription?: VendorSubscription;
  plan?: SubscriptionPlan;
  stats?: VendorStats;
};

type VendorStats = {
  productsCount: number;
  servicesCount: number;
  leadsCount: number;
  customersCount: number;
  suppliersCount: number;
  ordersCount: number;
  profileCompletion: number;
  views?: number;
  conversions?: number;
  lastActivity?: string;
};

type ViewMode = 'cards' | 'table';

// Helper to calculate profile completion
const calculateProfileCompletion = (vendor: Vendor): number => {
  const profileFields = [
    vendor.businessName, vendor.ownerName, vendor.email, vendor.phone,
    vendor.category, vendor.subcategory, vendor.city, vendor.state,
    vendor.pincode, vendor.address, vendor.description, vendor.logo,
    vendor.whatsappNumber, vendor.gstNumber, vendor.licenseNumber, vendor.banner
  ];
  const filledFields = profileFields.filter(f => f && String(f).trim() !== '').length;
  return Math.round((filledFields / profileFields.length) * 100);
};

export default function AdminVendors() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedVendor, setSelectedVendor] = useState<VendorWithSubscription | null>(null);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [vendorDetailOpen, setVendorDetailOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");

  // Fetch all vendors
  const { data: vendors = [], isLoading: vendorsLoading, error: vendorsError } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch all vendor subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<VendorSubscription[]>({
    queryKey: ["/api/vendors/subscription"],
  });

  // Fetch all subscription plans
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Fetch billing history for selected vendor
  const { data: billingHistory = [] } = useQuery<BillingHistory[]>({
    queryKey: [`/api/vendors/${selectedVendor?.id}/billing-history`],
    enabled: !!selectedVendor && billingDialogOpen,
  });

  // Fetch vendor stats when detail sheet is opened
  const { data: vendorStats } = useQuery<{
    productsCount: number;
    servicesCount: number;
    leadsCount: number;
    customersCount: number;
    suppliersCount: number;
    ordersCount: number;
  }>({
    queryKey: [`/api/admin/vendors/${selectedVendor?.id}/stats`],
    enabled: !!selectedVendor && vendorDetailOpen,
  });

  const isLoading = vendorsLoading || subscriptionsLoading;

  // Combine vendors with their subscriptions and stats
  const vendorsWithData: VendorWithSubscription[] = useMemo(() => {
    return vendors.map(vendor => {
      const subscription = subscriptions.find(s => s.vendorId === vendor.id);
      const plan = subscription ? plans.find(p => p.id === subscription.planId) : undefined;
      
      // Calculate profile completion
      const profileCompletion = calculateProfileCompletion(vendor);

      // Note: Real stats would come from individual API calls per vendor
      // For now we show placeholders that will be fetched when vendor detail is opened
      const stats: VendorStats = {
        productsCount: 0,
        servicesCount: 0,
        leadsCount: 0,
        customersCount: 0,
        suppliersCount: 0,
        ordersCount: 0,
        profileCompletion,
        views: 0,
        conversions: 0,
        lastActivity: vendor.updatedAt?.toString(),
      };

      return { ...vendor, subscription, plan, stats };
    });
  }, [vendors, subscriptions, plans]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(vendors.map(v => v.category));
    return Array.from(cats).filter(Boolean).sort();
  }, [vendors]);

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    let filtered = vendorsWithData.filter(vendor => {
      // Search filter
      const matchesSearch = 
        vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.phone.includes(searchQuery);
      
      // Status filter
      const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
      
      // Subscription status filter
      const matchesSubStatus = subscriptionFilter === "all" || 
        (subscriptionFilter === "no_subscription" && !vendor.subscription) ||
        vendor.subscription?.status === subscriptionFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter;
      
      // Plan filter
      const matchesPlan = planFilter === "all" || 
        (planFilter === "free" && (!vendor.plan || vendor.plan.price === "0")) ||
        (planFilter === "paid" && vendor.plan && parseFloat(vendor.plan.price) > 0);
      
      // Expiry filter
      let matchesExpiry = true;
      if (expiryFilter !== "all" && vendor.subscription?.currentPeriodEnd) {
        const expiryDate = new Date(vendor.subscription.currentPeriodEnd);
        const today = new Date();
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        
        if (expiryFilter === "expired") matchesExpiry = daysUntilExpiry < 0;
        if (expiryFilter === "expiring_soon") matchesExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
        if (expiryFilter === "expiring_month") matchesExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      }

      return matchesSearch && matchesStatus && matchesSubStatus && matchesCategory && matchesPlan && matchesExpiry;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'expiry':
          const aExp = a.subscription?.currentPeriodEnd ? new Date(a.subscription.currentPeriodEnd).getTime() : 0;
          const bExp = b.subscription?.currentPeriodEnd ? new Date(b.subscription.currentPeriodEnd).getTime() : 0;
          comparison = aExp - bExp;
          break;
        case 'activity':
          const aAct = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bAct = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          comparison = aAct - bAct;
          break;
        case 'name':
          comparison = a.businessName.localeCompare(b.businessName);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [vendorsWithData, searchQuery, statusFilter, subscriptionFilter, categoryFilter, planFilter, expiryFilter, sortBy, sortOrder]);

  // Update vendor status mutation
  const updateVendorMutation = useMutation({
    mutationFn: async ({ vendorId, status }: { vendorId: string; status: string }) => {
      return await apiRequest(`/api/vendors/${vendorId}`, {
        method: "PATCH",
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor status updated successfully" });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ vendorId, title, message }: { vendorId: string; title: string; message: string }) => {
      return await apiRequest(`/api/notifications`, {
        method: "POST",
        body: {
          vendorId,
          userId: null,
          title,
          message,
          type: "info",
        },
      });
    },
    onSuccess: () => {
      toast({ title: "Notification sent successfully" });
      setNotifyDialogOpen(false);
      setNotificationTitle("");
      setNotificationMessage("");
    },
    onError: () => {
      toast({ title: "Failed to send notification", variant: "destructive" });
    },
  });

  const handleSendNotification = () => {
    if (selectedVendor && notificationTitle && notificationMessage) {
      sendNotificationMutation.mutate({
        vendorId: selectedVendor.id,
        title: notificationTitle,
        message: notificationMessage,
      });
    }
  };

  const toggleRowExpanded = (vendorId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      suspended: "bg-red-500/10 text-red-600 border-red-500/20",
      inactive: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    };
    return (
      <Badge variant="outline" className={`${styles[status] || styles.inactive} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription?: VendorSubscription) => {
    if (!subscription) {
      return <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">No Plan</Badge>;
    }

    const styles: Record<string, string> = {
      trial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      past_due: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      canceled: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      expired: "bg-red-500/10 text-red-600 border-red-500/20",
    };

    return (
      <Badge variant="outline" className={`${styles[subscription.status] || "bg-slate-100"} font-medium`}>
        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getExpiryInfo = (subscription?: VendorSubscription) => {
    if (!subscription?.currentPeriodEnd) return { text: '-', urgent: false, warning: false };
    
    const expiryDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const daysLeft = differenceInDays(expiryDate, today);
    
    if (daysLeft < 0) return { text: `Expired ${Math.abs(daysLeft)}d ago`, urgent: true, warning: false };
    if (daysLeft <= 3) return { text: `${daysLeft}d left`, urgent: true, warning: false };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, urgent: false, warning: true };
    return { text: format(expiryDate, "MMM dd, yyyy"), urgent: false, warning: false };
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string, businessName: string) => {
    const message = encodeURIComponent(`Hi ${businessName}, this is Vyora Admin reaching out to you.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleNotify = (vendor: VendorWithSubscription) => {
    setSelectedVendor(vendor);
    setNotifyDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSubscriptionFilter("all");
    setCategoryFilter("all");
    setPlanFilter("all");
    setExpiryFilter("all");
    setSortBy("created");
    setSortOrder("desc");
  };

  // Stats calculations
  const stats = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(v => v.status === "approved").length,
    suspended: vendors.filter(v => v.status === "suspended").length,
    pending: vendors.filter(v => v.status === "pending").length,
    activeSubscriptions: subscriptions.filter(s => s.status === "active").length,
    trialSubscriptions: subscriptions.filter(s => s.status === "trial").length,
    expiredSubscriptions: subscriptions.filter(s => s.status === "expired").length,
    paidVendors: vendorsWithData.filter(v => v.plan && parseFloat(v.plan.price) > 0).length,
    freeVendors: vendorsWithData.filter(v => !v.plan || parseFloat(v.plan.price) === 0).length,
    expiringThisWeek: vendorsWithData.filter(v => {
      if (!v.subscription?.currentPeriodEnd) return false;
      const days = differenceInDays(new Date(v.subscription.currentPeriodEnd), new Date());
      return days >= 0 && days <= 7;
    }).length,
  }), [vendors, subscriptions, vendorsWithData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">Loading vendors...</p>
        </div>
      </div>
    );
  }

  if (vendorsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 p-6">
        <Card className="max-w-lg mx-auto border-red-200 bg-red-50/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">Failed to Load Vendors</h3>
            <p className="text-red-600 mb-6">{vendorsError instanceof Error ? vendorsError.message : 'Unknown error'}</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/vendors"] })} variant="destructive">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* CSS for animations and mobile optimization */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        @media (max-width: 768px) {
          .vendor-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Building2 className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              Vendor Management
            </h1>
            <p className="text-slate-500 mt-1 text-sm lg:text-base">
              Enterprise vendor management dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/vendors"] })}>
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stat-grid animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass-card border-0 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Building2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">Active</p>
                  <p className="text-xl md:text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">Paid</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.paidVendors}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">Free</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-600">{stats.freeVendors}</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">Expiring</p>
                  <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.expiringThisWeek}</p>
                </div>
                <div className="p-2 bg-amber-100 rounded-xl">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wide">Suspended</p>
                  <p className="text-xl md:text-2xl font-bold text-red-600">{stats.suspended}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-xl">
                  <Ban className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="glass-card border-0 shadow-sm animate-slide-up rounded-xl" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-3 md:p-4 lg:p-6">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Search and View Toggle */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by business, owner, phone, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-sm bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <Button 
                      variant={viewMode === 'cards' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className={`h-9 ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={viewMode === 'table' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className={`h-9 ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-6 md:pb-0">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 text-sm bg-white shrink-0 min-w-[120px] md:min-w-0">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="h-10 text-sm bg-white shrink-0 min-w-[100px] md:min-w-0">
                    <SelectValue placeholder="Plan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                  <SelectTrigger className="h-10 text-sm bg-white shrink-0 min-w-[120px] md:min-w-0">
                    <SelectValue placeholder="Sub. Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="no_subscription">No Subscription</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                  <SelectTrigger className="h-10 text-sm bg-white shrink-0 min-w-[100px] md:min-w-0">
                    <SelectValue placeholder="Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="expiring_soon">Expiring (7 days)</SelectItem>
                    <SelectItem value="expiring_month">Expiring (30 days)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 text-sm bg-white shrink-0 min-w-[100px] md:min-w-0">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Created Date</SelectItem>
                    <SelectItem value="expiry">Expiry Date</SelectItem>
                    <SelectItem value="activity">Last Activity</SelectItem>
                    <SelectItem value="name">Business Name</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters} className="h-10 text-sm shrink-0">
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between px-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredVendors.length}</span> of {vendors.length} vendors
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-slate-500"
          >
            {sortOrder === 'desc' ? <TrendingDown className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1" />}
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>

        {/* Vendors Display */}
        {viewMode === 'cards' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 vendor-grid pb-6">
            {filteredVendors.length === 0 ? (
              <Card className="col-span-full py-16 rounded-xl">
                <CardContent className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">No vendors found</h3>
                  <p className="text-slate-500 mt-1">Try adjusting your filters or search query</p>
                </CardContent>
              </Card>
            ) : (
              filteredVendors.map((vendor, index) => (
                <Card 
                  key={vendor.id} 
                  className="glass-card border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group animate-slide-up rounded-xl"
                  style={{ animationDelay: `${0.05 * Math.min(index, 10)}s` }}
                >
                  <CardContent className="p-0">
                    {/* Card Header */}
                    <div className="p-4 pb-3 border-b border-slate-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                            {vendor.logo ? (
                              <img src={vendor.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span className="text-white font-bold text-lg">{vendor.businessName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{vendor.businessName}</h3>
                            <p className="text-sm text-slate-500 truncate">{vendor.ownerName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(vendor.status)}
                          {vendor.plan && parseFloat(vendor.plan.price) > 0 && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              {vendor.plan.displayName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{vendor.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{vendor.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      </div>

                      {/* Subscription Info */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <WalletCards className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">Subscription</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSubscriptionBadge(vendor.subscription)}
                          {vendor.subscription?.currentPeriodEnd && (
                            <span className={`text-xs font-medium ${getExpiryInfo(vendor.subscription).urgent ? 'text-red-600' : getExpiryInfo(vendor.subscription).warning ? 'text-amber-600' : 'text-slate-500'}`}>
                              {getExpiryInfo(vendor.subscription).text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">{vendor.stats?.productsCount || 0}</p>
                          <p className="text-xs text-blue-600/70">Products</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <p className="text-lg font-bold text-emerald-600">{vendor.stats?.customersCount || 0}</p>
                          <p className="text-xs text-emerald-600/70">Customers</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="text-lg font-bold text-purple-600">{vendor.stats?.leadsCount || 0}</p>
                          <p className="text-xs text-purple-600/70">Leads</p>
                        </div>
                      </div>

                      {/* Profile Completion */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Profile Completion</span>
                          <span className="font-medium text-slate-700">{vendor.stats?.profileCompletion || 0}%</span>
                        </div>
                        <Progress value={vendor.stats?.profileCompletion || 0} className="h-1.5" />
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 pt-0">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-9 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleCall(vendor.phone)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handleWhatsApp(vendor.whatsappNumber || vendor.phone, vendor.businessName)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-9 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleNotify(vendor)}
                        >
                          <Bell className="w-4 h-4 mr-1" />
                          Notify
                        </Button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 h-9 text-slate-600"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setVendorDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 h-9 text-slate-600"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setBillingDialogOpen(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Billing
                        </Button>
                        {vendor.status === "approved" ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="flex-1 h-9 text-red-600 hover:bg-red-50"
                            onClick={() => updateVendorMutation.mutate({ vendorId: vendor.id, status: "suspended" })}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="flex-1 h-9 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => updateVendorMutation.mutate({ vendorId: vendor.id, status: "approved" })}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Table View */
          <Card className="glass-card border-0 shadow-sm overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead className="font-semibold">Business</TableHead>
                      <TableHead className="font-semibold">Owner</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Category</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">City</TableHead>
                      <TableHead className="font-semibold">Plan</TableHead>
                      <TableHead className="font-semibold">Sub. Status</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Expires</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-slate-500">No vendors found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVendors.map((vendor) => (
                        <>
                          <TableRow key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-8 h-8 p-0"
                                onClick={() => toggleRowExpanded(vendor.id)}
                              >
                                {expandedRows.has(vendor.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                  {vendor.logo ? (
                                    <img src={vendor.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    <span className="text-white font-bold">{vendor.businessName.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{vendor.businessName}</p>
                                  <p className="text-xs text-slate-500">{vendor.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-700">{vendor.ownerName}</p>
                                <p className="text-xs text-slate-500">{vendor.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <p className="text-slate-700">{vendor.category}</p>
                                <p className="text-xs text-slate-500">{vendor.subcategory}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-slate-600">{vendor.city}</TableCell>
                            <TableCell>
                              {vendor.plan ? (
                                <div className="flex items-center gap-1">
                                  {parseFloat(vendor.plan.price) > 0 && <Crown className="w-4 h-4 text-amber-500" />}
                                  <span className="text-sm font-medium">{vendor.plan.displayName}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">No Plan</span>
                              )}
                            </TableCell>
                            <TableCell>{getSubscriptionBadge(vendor.subscription)}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {vendor.subscription?.currentPeriodEnd ? (
                                <span className={`text-sm font-medium ${getExpiryInfo(vendor.subscription).urgent ? 'text-red-600' : getExpiryInfo(vendor.subscription).warning ? 'text-amber-600' : 'text-slate-600'}`}>
                                  {getExpiryInfo(vendor.subscription).text}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-8 h-8 p-0 text-green-600"
                                  onClick={() => handleCall(vendor.phone)}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-8 h-8 p-0 text-emerald-600"
                                  onClick={() => handleWhatsApp(vendor.whatsappNumber || vendor.phone, vendor.businessName)}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-8 h-8 p-0 text-blue-600"
                                  onClick={() => handleNotify(vendor)}
                                >
                                  <Bell className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-8 h-8 p-0"
                                  onClick={() => {
                                    setSelectedVendor(vendor);
                                    setVendorDetailOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Row */}
                          {expandedRows.has(vendor.id) && (
                            <TableRow className="bg-slate-50/50">
                              <TableCell colSpan={10} className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                  {/* Data Stats */}
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Products</p>
                                    <p className="text-lg font-bold text-slate-700">{vendor.stats?.productsCount || 0}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Services</p>
                                    <p className="text-lg font-bold text-slate-700">{vendor.stats?.servicesCount || 0}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Leads</p>
                                    <p className="text-lg font-bold text-slate-700">{vendor.stats?.leadsCount || 0}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Customers</p>
                                    <p className="text-lg font-bold text-slate-700">{vendor.stats?.customersCount || 0}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Suppliers</p>
                                    <p className="text-lg font-bold text-slate-700">{vendor.stats?.suppliersCount || 0}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Profile</p>
                                    <div className="flex items-center gap-2">
                                      <Progress value={vendor.stats?.profileCompletion || 0} className="h-2 flex-1" />
                                      <span className="text-sm font-medium">{vendor.stats?.profileCompletion || 0}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedVendor(vendor); setVendorDetailOpen(true); }}>
                                    <Eye className="w-4 h-4 mr-1" /> View Profile
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-4 h-4 mr-1" /> Edit Vendor
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Package className="w-4 h-4 mr-1" /> Products/Services
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedVendor(vendor); setBillingDialogOpen(true); }}>
                                    <CreditCard className="w-4 h-4 mr-1" /> Manage Subscription
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <BarChart3 className="w-4 h-4 mr-1" /> Analytics
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleNotify(vendor)}>
                                    <Bell className="w-4 h-4 mr-1" /> Send Notification
                                  </Button>
                                  {vendor.status === "approved" ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-red-600 border-red-200"
                                      onClick={() => updateVendorMutation.mutate({ vendorId: vendor.id, status: "suspended" })}
                                    >
                                      <Ban className="w-4 h-4 mr-1" /> Suspend
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-emerald-600 border-emerald-200"
                                      onClick={() => updateVendorMutation.mutate({ vendorId: vendor.id, status: "approved" })}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" /> Activate
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vendor Detail Sheet */}
      <Sheet open={vendorDetailOpen} onOpenChange={setVendorDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedVendor && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    {selectedVendor.logo ? (
                      <img src={selectedVendor.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <span className="text-white font-bold text-2xl">{selectedVendor.businessName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedVendor.businessName}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Hash className="w-3 h-3" /> ID: {selectedVendor.id.slice(0, 8)}...
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="subscription">Billing</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="support" className="hidden lg:flex">Support</TabsTrigger>
                  <TabsTrigger value="logs" className="hidden lg:flex">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Status Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Account Status</p>
                      {getStatusBadge(selectedVendor.status)}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Subscription</p>
                      {getSubscriptionBadge(selectedVendor.subscription)}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-semibold text-slate-800">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{selectedVendor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{selectedVendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state} - {selectedVendor.pincode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-3">Business Stats</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{vendorStats?.productsCount ?? selectedVendor.stats?.productsCount ?? 0}</p>
                        <p className="text-xs text-blue-600/70">Products</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">{vendorStats?.servicesCount ?? selectedVendor.stats?.servicesCount ?? 0}</p>
                        <p className="text-xs text-emerald-600/70">Services</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{vendorStats?.customersCount ?? selectedVendor.stats?.customersCount ?? 0}</p>
                        <p className="text-xs text-purple-600/70">Customers</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{vendorStats?.leadsCount ?? selectedVendor.stats?.leadsCount ?? 0}</p>
                        <p className="text-xs text-amber-600/70">Leads</p>
                      </div>
                      <div className="text-center p-3 bg-rose-50 rounded-lg">
                        <p className="text-2xl font-bold text-rose-600">{vendorStats?.suppliersCount ?? selectedVendor.stats?.suppliersCount ?? 0}</p>
                        <p className="text-xs text-rose-600/70">Suppliers</p>
                      </div>
                      <div className="text-center p-3 bg-slate-100 rounded-lg">
                        <p className="text-2xl font-bold text-slate-600">{vendorStats?.ordersCount ?? selectedVendor.stats?.ordersCount ?? 0}</p>
                        <p className="text-xs text-slate-600/70">Orders</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-800">Profile Completion</h4>
                      <span className="text-sm font-medium text-slate-600">{selectedVendor.stats?.profileCompletion || 0}%</span>
                    </div>
                    <Progress value={selectedVendor.stats?.profileCompletion || 0} className="h-2" />
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full" onClick={() => handleCall(selectedVendor.phone)}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call Vendor
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleWhatsApp(selectedVendor.whatsappNumber || selectedVendor.phone, selectedVendor.businessName)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="mt-4 space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                    <h4 className="font-semibold text-slate-800">Business Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Business Name</p>
                        <p className="font-medium">{selectedVendor.businessName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Owner Name</p>
                        <p className="font-medium">{selectedVendor.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Category</p>
                        <p className="font-medium">{selectedVendor.category}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Sub-Category</p>
                        <p className="font-medium">{selectedVendor.subcategory}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">GST Number</p>
                        <p className="font-medium">{selectedVendor.gstNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">License Number</p>
                        <p className="font-medium">{selectedVendor.licenseNumber || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Description</p>
                        <p className="font-medium">{selectedVendor.description || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                    <h4 className="font-semibold text-slate-800">Address Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Full Address</p>
                        <p className="font-medium">{selectedVendor.address}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">City</p>
                        <p className="font-medium">{selectedVendor.city}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">State</p>
                        <p className="font-medium">{selectedVendor.state}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Pincode</p>
                        <p className="font-medium">{selectedVendor.pincode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                    <h4 className="font-semibold text-slate-800">Account Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Created On</p>
                        <p className="font-medium">{format(new Date(selectedVendor.createdAt), "PPP")}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Last Updated</p>
                        <p className="font-medium">{selectedVendor.updatedAt ? format(new Date(selectedVendor.updatedAt), "PPP") : '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Onboarding</p>
                        <p className="font-medium">{selectedVendor.onboardingComplete ? 'Complete' : 'Incomplete'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="mt-4 space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                    <h4 className="font-semibold text-slate-800">Current Subscription</h4>
                    {selectedVendor.subscription && selectedVendor.plan ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                          <div>
                            <p className="text-sm opacity-80">Current Plan</p>
                            <p className="text-xl font-bold">{selectedVendor.plan.displayName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm opacity-80">Price</p>
                            <p className="text-xl font-bold">₹{selectedVendor.plan.price}/mo</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide">Status</p>
                            {getSubscriptionBadge(selectedVendor.subscription)}
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide">Auto-Renew</p>
                            <p className="font-medium">{selectedVendor.subscription.autoRenew ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide">Start Date</p>
                            <p className="font-medium">{format(new Date(selectedVendor.subscription.startDate), "PPP")}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide">Expiry Date</p>
                            <p className={`font-medium ${getExpiryInfo(selectedVendor.subscription).urgent ? 'text-red-600' : ''}`}>
                              {format(new Date(selectedVendor.subscription.currentPeriodEnd), "PPP")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CreditCard className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500">No active subscription</p>
                        <Button className="mt-4" size="sm">Assign Plan</Button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-800">Payment History</h4>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    <div className="text-center py-6 text-slate-500 text-sm">
                      Payment history will be displayed here
                    </div>
                  </div>

                  <Button className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade / Change Plan
                  </Button>
                </TabsContent>

                <TabsContent value="analytics" className="mt-4 space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-4">Performance Overview</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl text-center">
                        <p className="text-3xl font-bold text-blue-600">{selectedVendor.stats?.views || 0}</p>
                        <p className="text-sm text-blue-600/70">Profile Views</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl text-center">
                        <p className="text-3xl font-bold text-emerald-600">{selectedVendor.stats?.conversions || 0}</p>
                        <p className="text-sm text-emerald-600/70">Conversions</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-4">Engagement Metrics</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Leads Generated</span>
                        <span className="font-semibold">{vendorStats?.leadsCount ?? selectedVendor.stats?.leadsCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Customers Acquired</span>
                        <span className="font-semibold">{vendorStats?.customersCount ?? selectedVendor.stats?.customersCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Orders Received</span>
                        <span className="font-semibold">{vendorStats?.ordersCount ?? selectedVendor.stats?.ordersCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Products Listed</span>
                        <span className="font-semibold">{vendorStats?.productsCount ?? selectedVendor.stats?.productsCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Services Listed</span>
                        <span className="font-semibold">{vendorStats?.servicesCount ?? selectedVendor.stats?.servicesCount ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Last Activity</span>
                        <span className="font-semibold">{selectedVendor.updatedAt ? formatDistanceToNow(new Date(selectedVendor.updatedAt), { addSuffix: true }) : '-'}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="support" className="mt-4 space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-4">Support History</h4>
                    <div className="text-center py-8 text-slate-500">
                      <HeadphonesIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No support tickets yet</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-4">Send Notification</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="notify-title">Title</Label>
                        <Input 
                          id="notify-title" 
                          placeholder="Notification title"
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notify-message">Message</Label>
                        <Textarea 
                          id="notify-message" 
                          placeholder="Write your notification message..."
                          value={notificationMessage}
                          onChange={(e) => setNotificationMessage(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Button className="w-full" onClick={handleSendNotification} disabled={!notificationTitle || !notificationMessage}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Notification
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-4 space-y-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-4">Activity Logs</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Account created</p>
                          <p className="text-xs text-slate-500">{format(new Date(selectedVendor.createdAt), "PPP 'at' p")}</p>
                        </div>
                      </div>
                      {selectedVendor.updatedAt && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Edit className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Profile updated</p>
                            <p className="text-xs text-slate-500">{format(new Date(selectedVendor.updatedAt), "PPP 'at' p")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Send Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send a notification to {selectedVendor?.businessName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Notification title"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Write your notification message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={!notificationTitle || !notificationMessage || sendNotificationMutation.isPending}
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing History Dialog */}
      <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Billing & Subscription - {selectedVendor?.businessName}
            </DialogTitle>
            <DialogDescription>
              Manage subscription and view payment history
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-6 py-4">
              {/* Current Subscription */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Current Plan</p>
                    <p className="text-2xl font-bold">{selectedVendor.plan?.displayName || 'No Plan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Price</p>
                    <p className="text-2xl font-bold">₹{selectedVendor.plan?.price || 0}/mo</p>
                  </div>
                </div>
                {selectedVendor.subscription && (
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
                    <div>
                      <p className="text-xs opacity-70">Status</p>
                      <p className="font-medium">{selectedVendor.subscription.status.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Start Date</p>
                      <p className="font-medium">{format(new Date(selectedVendor.subscription.startDate), "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Expires</p>
                      <p className="font-medium">{format(new Date(selectedVendor.subscription.currentPeriodEnd), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Payment History
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                            No billing history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        billingHistory.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell>{format(new Date(bill.createdAt), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-mono text-sm">{bill.invoiceNumber || "-"}</TableCell>
                            <TableCell className="font-medium">₹{bill.amount}</TableCell>
                            <TableCell>
                              {bill.status === "succeeded" && <Badge className="bg-emerald-500">Paid</Badge>}
                              {bill.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                              {bill.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost">
                                <Download className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
