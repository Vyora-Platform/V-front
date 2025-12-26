import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type Supplier, type InsertSupplier } from "@shared/schema";
import { 
  Warehouse, Search, Plus, Trash2, Edit, Phone, Mail, MapPin, Building, 
  DollarSign, Package, TrendingUp, FileText, ArrowLeft, ChevronRight,
  Users, MoreVertical, Filter, SortAsc, AlertCircle, Calendar, Clock,
  IndianRupee, Receipt, CreditCard
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

export default function VendorSuppliers() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Pro subscription
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<string | undefined>();

  const handleProAction = (action: string, callback: () => void) => {
    const result = canPerformAction(action as any);
    if (!result.allowed) {
      setBlockedAction(action);
      setShowUpgradeModal(true);
      return;
    }
    callback();
  };

  // Fetch suppliers with search and filter
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: [`/api/vendors/${vendorId}/suppliers`],
    enabled: !!vendorId,
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/vendors/${vendorId}/suppliers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers`] });
      toast({ title: "Supplier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete supplier", variant: "destructive" });
    },
  });

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleProAction('delete', () => {
      if (confirm(`Are you sure you want to delete ${name}?`)) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleEdit = (e: React.MouseEvent, supplier: Supplier) => {
    e.preventDefault();
    e.stopPropagation();
    handleProAction('update', () => {
      setEditingSupplier(supplier);
      setIsAddDialogOpen(true);
    });
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingSupplier(null);
  };

  // Handle call action
  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  // Handle WhatsApp action
  const handleWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Clean phone number - remove spaces, dashes, and add country code if not present
    let cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+91' + cleanPhone; // Default to India
    }
    const message = encodeURIComponent(`Hi ${name}, `);
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${message}`, '_blank');
  };

  // Stats
  const activeSuppliers = suppliers.filter(s => s.status === "active").length;
  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  const totalSuppliers = suppliers.length;
  const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
  const suppliersWithDues = suppliers.filter(s => (s.outstandingBalance || 0) > 0).length;

  // Filter and sort suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        supplier.name?.toLowerCase().includes(query) ||
        supplier.businessName?.toLowerCase().includes(query) ||
        supplier.phone?.includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== 'all' && supplier.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && supplier.category !== categoryFilter) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'outstanding':
        return (b.outstandingBalance || 0) - (a.outstandingBalance || 0);
      case 'purchases':
        return (b.totalPurchases || 0) - (a.totalPurchases || 0);
      case 'recent':
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      default:
        return 0;
    }
  });

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get category details
  const getCategoryDetails = (category: string) => {
    const details: Record<string, { label: string; color: string; bgColor: string }> = {
      'raw_materials': { label: 'Raw Materials', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
      'finished_goods': { label: 'Finished Goods', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/50' },
      'packaging': { label: 'Packaging', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
      'equipment': { label: 'Equipment', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
      'services': { label: 'Services', color: 'text-pink-700 dark:text-pink-300', bgColor: 'bg-pink-100 dark:bg-pink-900/50' },
      'other': { label: 'Other', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' },
    };
    return details[category] || details['other'];
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-background">
      {/* Header - Mobile Optimized */}
      <div className="bg-white dark:bg-card border-b sticky top-0 z-20">
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="shrink-0 h-10 w-10 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Suppliers</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Manage your supplier network</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingSupplier(null);
          }}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="gap-1.5 h-10 px-4"
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    handleProAction('create', () => setIsAddDialogOpen(true));
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Supplier</span>
                {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-4 pb-0 sticky top-0 bg-background z-10 border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={handleCloseDialog}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                    <DialogDescription>
                      {editingSupplier ? "Update supplier details" : "Add a new supplier to your network"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-4">
                <SupplierForm
                  supplier={editingSupplier}
                  vendorId={vendorId}
                  onSuccess={handleCloseDialog}
                  isPro={isPro}
                  handleProAction={handleProAction}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards - Horizontal Scroll on Mobile */}
        <div className="px-4 md:px-6 pb-3 overflow-x-auto scrollbar-hide max-w-[1440px] mx-auto">
          <div className="flex gap-3 md:grid md:grid-cols-5">
            <Card className="p-3 rounded-xl min-w-[110px] shrink-0 md:min-w-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{totalSuppliers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 rounded-xl min-w-[110px] shrink-0 md:min-w-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{activeSuppliers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 rounded-xl min-w-[130px] shrink-0 md:min-w-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Outstanding</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{formatCurrency(totalOutstanding)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 rounded-xl min-w-[130px] shrink-0 md:min-w-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <IndianRupee className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Purchases</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{formatCurrency(totalPurchases)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 rounded-xl min-w-[110px] shrink-0 md:min-w-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Receipt className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">With Dues</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{suppliersWithDues}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-card border-b max-w-[1440px] mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-muted/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] h-10 shrink-0 rounded-lg text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[120px] h-10 shrink-0 rounded-lg text-sm hidden sm:flex">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="raw_materials">Raw Materials</SelectItem>
              <SelectItem value="finished_goods">Finished Goods</SelectItem>
              <SelectItem value="packaging">Packaging</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px] h-10 shrink-0 rounded-lg text-sm hidden md:flex">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="outstanding">Outstanding ↓</SelectItem>
              <SelectItem value="purchases">Purchases ↓</SelectItem>
              <SelectItem value="recent">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="flex-1 px-4 md:px-6 py-4 max-w-[1440px] mx-auto w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <div className="space-y-3">
            {filteredSuppliers.map((supplier) => {
              const categoryDetails = getCategoryDetails(supplier.category);
              const hasOutstanding = (supplier.outstandingBalance || 0) > 0;
              
              return (
                <Link key={supplier.id} href={`/vendor/suppliers/${supplier.id}`}>
                  <Card className={cn(
                    "overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.99]",
                    hasOutstanding && "border-l-4 border-l-orange-500"
                  )}>
                    <CardContent className="p-0">
                      {/* Main Supplier Info Row */}
                      <div className="p-4 flex items-start gap-3">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback className={cn(
                            "text-sm font-semibold",
                            supplier.status === 'active' 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          )}>
                            {getInitials(supplier.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{supplier.name}</h3>
                            <Badge 
                              variant={supplier.status === 'active' ? 'default' : 'secondary'}
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              {supplier.status}
                            </Badge>
                          </div>
                          {supplier.businessName && (
                            <p className="text-sm text-muted-foreground truncate">{supplier.businessName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge className={cn("text-[10px] px-1.5 py-0 h-5", categoryDetails.bgColor, categoryDetails.color)}>
                              {categoryDetails.label}
                            </Badge>
                            {supplier.city && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {supplier.city}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Balance Info */}
                        <div className="text-right shrink-0">
                          {hasOutstanding ? (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">To Pay</p>
                              <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                                ₹{(supplier.outstandingBalance || 0).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Purchases</p>
                              <p className="text-base font-semibold text-green-600 dark:text-green-400">
                                ₹{(supplier.totalPurchases || 0).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row - Like MyBillBook */}
                      <div className="border-t bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 flex items-center justify-between gap-2">
                        {/* Quick Actions */}
                        <div className="flex items-center gap-1">
                          {/* Call Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => handleCall(e, supplier.phone)}
                            className="h-9 px-3 gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="text-xs font-medium hidden sm:inline">Call</span>
                          </Button>
                          
                          {/* WhatsApp Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => handleWhatsApp(e, supplier.phone, supplier.name)}
                            className="h-9 px-3 gap-1.5 text-[#25D366] hover:text-[#128C7E] hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <SiWhatsapp className="h-4 w-4" />
                            <span className="text-xs font-medium hidden sm:inline">WhatsApp</span>
                          </Button>
                        </div>

                        {/* More Actions & Navigate */}
                        <div className="flex items-center gap-1">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 gap-1 text-muted-foreground"
                            onClick={(e) => {
                              e.preventDefault();
                              setLocation(`/vendor/suppliers/${supplier.id}`);
                            }}
                          >
                            <span className="text-xs">View</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          {/* More Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => handleEdit(e, supplier)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Supplier
                                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLocation(`/vendor/expenses?supplierId=${supplier.id}`);
                              }}>
                                <Receipt className="h-4 w-4 mr-2" />
                                View Expenses
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLocation(`/vendor/suppliers/${supplier.id}?tab=payments`);
                              }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => handleDelete(e, supplier.id, supplier.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Supplier
                                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Warehouse className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No suppliers found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? "Try adjusting your search or filters"
                : "Add your first supplier to get started"}
            </p>
            {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button 
                onClick={() => handleProAction('create', () => setIsAddDialogOpen(true))} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Supplier
                {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        blockedAction={blockedAction}
      />
    </div>
  );
}

// Supplier Form Component - Enhanced with better validation
function SupplierForm({ supplier, vendorId, onSuccess, isPro, handleProAction }: { supplier: Supplier | null; vendorId: string; onSuccess: () => void; isPro?: boolean; handleProAction?: (action: string, callback: () => void) => void }) {
  const { toast } = useToast();
  
  const form = useForm<Omit<InsertSupplier, 'vendorId'>>({
    resolver: zodResolver(insertSupplierSchema.omit({ vendorId: true })),
    defaultValues: supplier ? {
      name: supplier.name || "",
      businessName: supplier.businessName || "",
      phone: supplier.phone || "",
      alternatePhone: supplier.alternatePhone || "",
      email: supplier.email || "",
      contactPerson: supplier.contactPerson || "",
      category: supplier.category || "other",
      status: supplier.status || "active",
      gstin: supplier.gstin || "",
      pan: supplier.pan || "",
      addressLine1: supplier.addressLine1 || "",
      addressLine2: supplier.addressLine2 || "",
      city: supplier.city || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",
      preferredPaymentMode: supplier.preferredPaymentMode || "",
      bankName: supplier.bankName || "",
      accountNumber: supplier.accountNumber || "",
      ifscCode: supplier.ifscCode || "",
      accountHolderName: supplier.accountHolderName || "",
      notes: supplier.notes || "",
    } : {
      name: "",
      businessName: "",
      phone: "",
      alternatePhone: "",
      email: "",
      contactPerson: "",
      category: "other",
      status: "active",
      gstin: "",
      pan: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      preferredPaymentMode: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/suppliers`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create supplier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers`] });
      toast({ title: "Supplier created successfully" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create supplier", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      if (!supplier) throw new Error("No supplier to update");
      const response = await apiRequest("PATCH", `/api/vendors/${vendorId}/suppliers/${supplier.id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update supplier");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/suppliers`] });
      toast({ title: "Supplier updated successfully" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update supplier", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: Omit<InsertSupplier, 'vendorId'>) => {
    // Clean up empty strings to undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
    ) as Omit<InsertSupplier, 'vendorId'>;
    
    const supplierData = { ...cleanData, vendorId } as InsertSupplier;
    
    const performSave = () => {
      if (supplier) {
        updateMutation.mutate(supplierData);
      } else {
        createMutation.mutate(supplierData);
      }
    };

    if (handleProAction) {
      handleProAction(supplier ? 'update' : 'create', performSave);
    } else {
      performSave();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={["basic"]} className="w-full">
          {/* Basic Information */}
          <AccordionItem value="basic" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Basic Information
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Suppliers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="ABC Enterprises Pvt Ltd" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="9876543210" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alternatePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="tel" placeholder="9876543211" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" placeholder="supplier@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="raw_materials">Raw Materials</SelectItem>
                          <SelectItem value="finished_goods">Finished Goods</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Business & Tax Details */}
          <AccordionItem value="business" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Tax Details
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="22AAAAA0000A1Z5" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="AAAAA0000A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Address */}
          <AccordionItem value="address" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Address
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="123 Main Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Suite 456" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Mumbai" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Maharashtra" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="400001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Payment & Banking Details */}
          <AccordionItem value="banking" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                Payment & Banking
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="preferredPaymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="ABC Enterprises" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="State Bank of India" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="SBIN0001234" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Additional Notes */}
          <AccordionItem value="notes" className="border rounded-lg px-4 mb-3">
            <AccordionTrigger className="text-base font-semibold py-3">
              Additional Notes
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Any additional notes about the supplier (delivery terms, credit days, etc.)..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="min-w-[140px]"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : supplier
              ? "Update Supplier"
              : "Create Supplier"}
            {isPro === false && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
