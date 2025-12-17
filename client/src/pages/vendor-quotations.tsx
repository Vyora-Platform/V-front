import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, FileText, Search, Trash2, Send, Check, X, Clock, ArrowLeft, 
  User, Calendar, IndianRupee, Package, Wrench, ChevronRight, 
  MoreVertical, Eye, Download, Share2, CheckCircle2,
  AlertCircle, XCircle, Mail, Phone, MapPin, ShoppingBag, Receipt,
  Building2, Hash, Percent, PlusCircle
} from "lucide-react";
import { format } from "date-fns";
import type { Quotation, Customer, VendorCatalogue, VendorProduct } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// Extended type for quotation with items
type QuotationWithItems = Quotation & {
  items?: QuotationItem[];
};

type QuotationItem = {
  id: string;
  quotationId: string;
  itemType: string;
  itemId: string | null;
  itemName: string;
  description: string | null;
  quantity: string;
  rate: string;
  taxPercent: string;
  taxAmount: string;
  discountPercent: string;
  discountAmount: string;
  amount: string;
  sortOrder: number;
  createdAt: Date;
};

// Additional charge type
type AdditionalCharge = {
  id: string;
  name: string;
  amount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
};

export default function VendorQuotations() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Fetch quotations
  const { data: quotations = [], isLoading: loadingQuotations } = useQuery<QuotationWithItems[]>({
    queryKey: ["/api/vendors", vendorId, "quotations", statusFilter !== "all" ? statusFilter : undefined],
    enabled: !!vendorId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = `/api/vendors/${vendorId}/quotations${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch quotations");
      return response.json();
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  // Calculate stats
  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === "draft").length,
    sent: quotations.filter(q => q.status === "sent").length,
    accepted: quotations.filter(q => q.status === "accepted").length,
    rejected: quotations.filter(q => q.status === "rejected").length,
    totalValue: quotations.reduce((sum, q) => sum + parseFloat(q.totalAmount || "0"), 0),
  };

  // Filter quotations
  if (!vendorId) { return <LoadingSpinner />; }

  const filteredQuotations = quotations.filter(quotation => {
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    const customer = customers.find(c => c.id === quotation.customerId);
    const matchesSearch = !searchQuery || 
      quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.phone?.includes(searchQuery);
    
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return { 
          color: "bg-slate-100 text-slate-700 border-slate-200", 
          icon: Clock, 
          label: "Draft",
          gradient: "from-slate-500 to-slate-600"
        };
      case "sent":
        return { 
          color: "bg-blue-100 text-blue-700 border-blue-200", 
          icon: Send, 
          label: "Sent",
          gradient: "from-blue-500 to-blue-600"
        };
      case "accepted":
        return { 
          color: "bg-emerald-100 text-emerald-700 border-emerald-200", 
          icon: CheckCircle2, 
          label: "Accepted",
          gradient: "from-emerald-500 to-emerald-600"
        };
      case "rejected":
        return { 
          color: "bg-red-100 text-red-700 border-red-200", 
          icon: XCircle, 
          label: "Rejected",
          gradient: "from-red-500 to-red-600"
        };
      case "expired":
        return { 
          color: "bg-amber-100 text-amber-700 border-amber-200", 
          icon: AlertCircle, 
          label: "Expired",
          gradient: "from-amber-500 to-amber-600"
        };
      default:
        return { 
          color: "bg-slate-100 text-slate-700 border-slate-200", 
          icon: Clock, 
          label: status,
          gradient: "from-slate-500 to-slate-600"
        };
    }
  };

  return (
    <div 
      ref={mainContainerRef}
      className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-y-auto"
    >
      {/* Hero Header - Fully Scrollable */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="px-4 py-4 safe-area-inset-top">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
            <h1 className="text-xl font-bold">Quotations</h1>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="h-10 px-4 rounded-full bg-white text-indigo-700 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {/* Stats Cards - Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[130px]">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70">Total</span>
        </div>
              <p className="text-2xl font-bold">{stats.total}</p>
      </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[130px]">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70">Draft</span>
              </div>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[130px]">
              <div className="flex items-center gap-2 mb-1">
                <Send className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70">Sent</span>
              </div>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[130px]">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-xs text-white/70">Accepted</span>
              </div>
              <p className="text-2xl font-bold text-emerald-300">{stats.accepted}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[130px]">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-300" />
                <span className="text-xs text-white/70">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-300">{stats.rejected}</p>
            </div>
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[150px]">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70">Total Value</span>
              </div>
              <p className="text-xl font-bold">₹{stats.totalValue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - White Card with Rounded Top */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 shadow-xl">
        {/* Search & Filters */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { value: "all", label: "All" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "accepted", label: "Accepted" },
              { value: "rejected", label: "Rejected" },
            ].map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className={`rounded-full flex-shrink-0 ${
                  statusFilter === status.value 
                    ? "bg-indigo-600 hover:bg-indigo-700" 
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {status.label}
              </Button>
              ))}
          </div>
        </div>

        {/* Quotations List */}
        <div className="px-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Quotations ({filteredQuotations.length})
            </h2>
          </div>

            {loadingQuotations ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="mt-4 text-slate-500">Loading quotations...</p>
              </div>
            ) : filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No quotations found</h3>
              <p className="text-slate-500 text-center mb-6">Create your first quotation to get started</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="rounded-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Quotation
              </Button>
          </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotations.map(quotation => {
                const customer = customers.find(c => c.id === quotation.customerId);
                const statusConfig = getStatusConfig(quotation.status);
                const StatusIcon = statusConfig.icon;

  return (
                  <Card 
                    key={quotation.id} 
                    className="border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => setLocation(`/vendor/quotations/${quotation.id}`)}
                  >
                    <CardContent className="p-4">
        <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center`}>
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-800 truncate text-sm">
                {quotation.quotationNumber}
              </h3>
                              <p className="text-xs text-slate-500">
                                {format(new Date(quotation.quotationDate), "dd MMM yyyy")}
                              </p>
                            </div>
                            <Badge className={`${statusConfig.color} border text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
              </Badge>
            </div>
            
                          {/* Customer Info */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="h-3 w-3 text-indigo-600" />
              </div>
                            <span className="text-sm text-slate-600 truncate">
                              {customer?.name || "Unknown Customer"}
                            </span>
              </div>

                          {/* Footer Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Valid: {format(new Date(quotation.validUntil), "dd MMM")}
                              </span>
              </div>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4 text-indigo-600" />
                              <span className="text-lg font-bold text-indigo-600">
                                {parseFloat(quotation.totalAmount || "0").toLocaleString('en-IN')}
                              </span>
                            </div>
              </div>
            </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/vendor/quotations/${quotation.id}`);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Quotation Dialog */}
      <CreateQuotationDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        customers={customers}
        vendorId={vendorId}
        onSuccess={() => {
          setShowCreateDialog(false);
          queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
        }}
      />
    </div>
  );
}

// Create Quotation Dialog Component with Additional Charges
function CreateQuotationDialog({ 
  open,
  onClose,
  customers,
  vendorId,
  onSuccess 
}: { 
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  vendorId: string;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"customer" | "items" | "charges" | "review">("customer");
  const { toast } = useToast();

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [validDays, setValidDays] = useState(7);
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Additional charges state
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [newChargeTax, setNewChargeTax] = useState("18");

  // Fetch services
  const { data: services = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: open,
  });

  // Fetch products
  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: open,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("customer");
      setCustomerId("");
      setValidDays(7);
      setNotes("");
      setTermsAndConditions("");
      setSelectedProducts([]);
      setSelectedServices([]);
      setItemQuantities({});
      setAdditionalCharges([]);
      setNewChargeName("");
      setNewChargeAmount("");
      setNewChargeTax("18");
    }
  }, [open]);

  const addCharge = () => {
    if (!newChargeName.trim() || !newChargeAmount) return;
    
    const amount = parseFloat(newChargeAmount) || 0;
    const taxPercent = parseFloat(newChargeTax) || 0;
    const taxAmount = (amount * taxPercent) / 100;
    const total = amount + taxAmount;
    
    const newCharge: AdditionalCharge = {
      id: `charge-${Date.now()}`,
      name: newChargeName.trim(),
      amount,
      taxPercent,
      taxAmount,
      total,
    };
    
    setAdditionalCharges(prev => [...prev, newCharge]);
    setNewChargeName("");
    setNewChargeAmount("");
    setNewChargeTax("18");
  };

  const removeCharge = (chargeId: string) => {
    setAdditionalCharges(prev => prev.filter(c => c.id !== chargeId));
  };

  const createQuotationMutation = useMutation({
    mutationFn: async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      // Build items list
      const items: any[] = [];
      
      selectedProducts.forEach((productId, idx) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const qty = itemQuantities[productId] || 1;
        items.push({
          itemType: "product",
          itemId: productId,
          itemName: product.name,
          description: product.description || "",
          quantity: qty.toString(),
          rate: product.price.toString(),
          taxPercent: "0",
          taxAmount: "0",
          discountPercent: "0",
          discountAmount: "0",
          amount: (qty * parseFloat(product.price.toString())).toFixed(2),
          sortOrder: idx,
        });
      });

      selectedServices.forEach((serviceId, idx) => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;
        const qty = itemQuantities[serviceId] || 1;
        items.push({
          itemType: "service",
          itemId: serviceId,
          itemName: service.name,
          description: service.description || "",
          quantity: qty.toString(),
          rate: service.price.toString(),
          taxPercent: "0",
          taxAmount: "0",
          discountPercent: "0",
          discountAmount: "0",
          amount: (qty * parseFloat(service.price.toString())).toFixed(2),
          sortOrder: selectedProducts.length + idx,
        });
      });

      // Add additional charges as items
      additionalCharges.forEach((charge, idx) => {
        items.push({
          itemType: "charge",
          itemId: null,
          itemName: charge.name,
          description: `Additional charge with ${charge.taxPercent}% tax`,
          quantity: "1",
          rate: charge.amount.toString(),
          taxPercent: charge.taxPercent.toString(),
          taxAmount: charge.taxAmount.toFixed(2),
          discountPercent: "0",
          discountAmount: "0",
          amount: charge.total.toFixed(2),
          sortOrder: selectedProducts.length + selectedServices.length + idx,
        });
      });

      const subtotal = calculateItemsTotal();
      const chargesTotal = additionalCharges.reduce((sum, c) => sum + c.total, 0);
      const totalAmount = subtotal + chargesTotal;
      const totalTax = additionalCharges.reduce((sum, c) => sum + c.taxAmount, 0);

      const quotationData = {
        vendorId,
        customerId,
        quotationNumber: "", // Will be auto-generated
        quotationDate: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        status: "draft",
        subtotal: subtotal.toFixed(2),
        taxAmount: totalTax.toFixed(2),
        discountAmount: "0",
        additionalCharges: chargesTotal.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        notes,
        termsAndConditions,
      };

      const response = await apiRequest("POST", `/api/vendors/${vendorId}/quotations`, quotationData);
      const newQuotation = await response.json();

      // Create items
      for (const item of items) {
        await apiRequest("POST", `/api/quotations/${newQuotation.id}/items`, {
          quotationId: newQuotation.id,
          ...item,
        });
      }

      return newQuotation;
    },
    onSuccess: () => {
      toast({
        title: "Quotation Created",
        description: "Your quotation has been created successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      const newQuantities = { ...itemQuantities };
      delete newQuantities[productId];
      setItemQuantities(newQuantities);
    } else {
      setSelectedProducts(prev => [...prev, productId]);
      setItemQuantities(prev => ({ ...prev, [productId]: 1 }));
    }
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
      const newQuantities = { ...itemQuantities };
      delete newQuantities[serviceId];
      setItemQuantities(newQuantities);
    } else {
      setSelectedServices(prev => [...prev, serviceId]);
      setItemQuantities(prev => ({ ...prev, [serviceId]: 1 }));
    }
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty < 1) qty = 1;
    setItemQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  const calculateItemsTotal = () => {
    let total = 0;
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        total += (itemQuantities[productId] || 1) * parseFloat(product.price.toString());
      }
    });
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        total += (itemQuantities[serviceId] || 1) * parseFloat(service.price.toString());
      }
    });
    return total;
  };

  const calculateTotal = () => {
    const itemsTotal = calculateItemsTotal();
    const chargesTotal = additionalCharges.reduce((sum, c) => sum + c.total, 0);
    return itemsTotal + chargesTotal;
  };

  const selectedCustomer = customers.find(c => c.id === customerId);
  const hasItems = selectedProducts.length > 0 || selectedServices.length > 0;

  const steps = ["customer", "items", "charges", "review"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (step === "items") setStep("customer");
                else if (step === "charges") setStep("items");
                else if (step === "review") setStep("charges");
                else onClose();
              }}
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
        </Button>
            <div>
              <DialogTitle className="text-lg font-semibold">Create Quotation</DialogTitle>
              <DialogDescription className="text-xs">
                {step === "customer" && "Step 1: Select Customer"}
                {step === "items" && "Step 2: Add Items from Catalogue"}
                {step === "charges" && "Step 3: Additional Charges"}
                {step === "review" && "Step 4: Review & Create"}
          </DialogDescription>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-1 mt-3">
            {steps.map((s, idx) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s ? "bg-indigo-600 text-white" :
                  currentStepIndex > idx ? "bg-emerald-500 text-white" :
                  "bg-slate-200 text-slate-500"
                }`}>
                  {currentStepIndex > idx ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < steps.length - 1 && <div className={`flex-1 h-0.5 ${
                  currentStepIndex > idx ? "bg-emerald-500" : "bg-slate-200"
                }`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "customer" && (
            <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Select Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-slate-500">{customer.phone}</p>
                          </div>
                        </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              {selectedCustomer && (
                <Card className="bg-indigo-50 border-indigo-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedCustomer.name}</h3>
                        <p className="text-sm text-slate-600">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <Mail className="h-4 w-4" />
                        <span>{selectedCustomer.email}</span>
                </div>
              )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedCustomer.address}</span>
            </div>
                    )}
                  </CardContent>
                </Card>
              )}

            <div className="space-y-2">
                <Label className="text-sm font-medium">Valid For (Days)</Label>
              <Input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                  className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this quotation..."
                  className="rounded-xl resize-none"
                  rows={3}
              />
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium">Terms & Conditions (Optional)</Label>
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Payment terms, delivery terms, etc..."
                  className="rounded-xl resize-none"
                  rows={3}
              />
            </div>
            </div>
          )}

          {step === "items" && (
            <div className="space-y-4">
              {/* Products Section */}
              {products.filter(p => p.isActive).length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    Products ({products.filter(p => p.isActive).length})
                  </h3>
                  <div className="space-y-2">
                    {products.filter(p => p.isActive).map(product => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <Card 
                          key={product.id}
                          className={`border cursor-pointer transition-all ${
                            isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"
                          }`}
                          onClick={() => toggleProduct(product.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-100"
                              }`}>
                                {product.icon || "📦"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-800 truncate">{product.name}</h4>
                                <p className="text-sm text-slate-500">₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</p>
                              </div>
                              {isSelected ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateQuantity(product.id, (itemQuantities[product.id] || 1) - 1)}
                                  >
                                    -
              </Button>
                                  <span className="w-8 text-center font-medium">{itemQuantities[product.id] || 1}</span>
              <Button 
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateQuantity(product.id, (itemQuantities[product.id] || 1) + 1)}
                                  >
                                    +
              </Button>
          </div>
        ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                              )}
            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                      </div>
                )}
                
              {/* Services Section */}
                {services.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-purple-600" />
                    Services ({services.length})
                  </h3>
                  <div className="space-y-2">
                    {services.map(service => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <Card 
                          key={service.id}
                          className={`border cursor-pointer transition-all ${
                            isSelected ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-purple-200"
                          }`}
                          onClick={() => toggleService(service.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected ? "bg-purple-600" : "bg-slate-100"
                              }`}>
                                <Wrench className={`h-5 w-5 ${isSelected ? "text-white" : "text-slate-600"}`} />
                      </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-800 truncate">{service.name}</h4>
                                <p className="text-sm text-slate-500">₹{parseFloat(service.price.toString()).toLocaleString('en-IN')}</p>
                              </div>
                              {isSelected ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateQuantity(service.id, (itemQuantities[service.id] || 1) - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-medium">{itemQuantities[service.id] || 1}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => updateQuantity(service.id, (itemQuantities[service.id] || 1) + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                              )}
                            </div>
              </CardContent>
            </Card>
                      );
                    })}
                            </div>
                              </div>
                            )}

              {products.filter(p => p.isActive).length === 0 && services.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-8 w-8 text-slate-400" />
                              </div>
                  <h3 className="font-semibold text-slate-700 mb-2">No items in catalogue</h3>
                  <p className="text-slate-500 text-sm">Add products or services to your catalogue first</p>
                          </div>
                              )}
                            </div>
                          )}

          {step === "charges" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-7 w-7 text-amber-600" />
                              </div>
                <h3 className="font-semibold text-slate-800">Additional Charges</h3>
                <p className="text-sm text-slate-500">Add any extra charges like delivery, installation, etc.</p>
                              </div>

              {/* Add Charge Form */}
              <Card className="border-dashed border-2 border-slate-300">
                <CardContent className="p-4 space-y-3">
                            <div className="space-y-2">
                    <Label className="text-sm font-medium">Charge Name</Label>
                              <Input
                      value={newChargeName}
                      onChange={(e) => setNewChargeName(e.target.value)}
                      placeholder="e.g., Delivery, Installation"
                      className="h-11 rounded-xl"
                              />
                            </div>
                  <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                      <Label className="text-sm font-medium">Amount (₹)</Label>
                              <Input
                                type="number"
                        value={newChargeAmount}
                        onChange={(e) => setNewChargeAmount(e.target.value)}
                        placeholder="0"
                        className="h-11 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                      <Label className="text-sm font-medium">Tax (%)</Label>
                      <Select value={newChargeTax} onValueChange={setNewChargeTax}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0% (No Tax)</SelectItem>
                          <SelectItem value="5">5% GST</SelectItem>
                          <SelectItem value="12">12% GST</SelectItem>
                          <SelectItem value="18">18% GST</SelectItem>
                          <SelectItem value="28">28% GST</SelectItem>
                        </SelectContent>
                      </Select>
                            </div>
                            </div>
                  <Button
                    onClick={addCharge}
                    disabled={!newChargeName.trim() || !newChargeAmount}
                    className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Charge
                  </Button>
                </CardContent>
              </Card>

              {/* Added Charges List */}
              {additionalCharges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 text-sm">Added Charges</h4>
                  {additionalCharges.map(charge => (
                    <Card key={charge.id} className="bg-amber-50 border-amber-100">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                              <Receipt className="h-5 w-5 text-white" />
                          </div>
                            <div>
                              <p className="font-medium text-slate-800">{charge.name}</p>
                              <p className="text-xs text-slate-500">
                                ₹{charge.amount.toLocaleString('en-IN')} + {charge.taxPercent}% tax
                              </p>
                        </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-amber-700">
                              ₹{charge.total.toLocaleString('en-IN')}
                            </span>
                        <Button
                          variant="ghost"
                          size="icon"
                              onClick={() => removeCharge(charge.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
            </div>
              )}

              {additionalCharges.length === 0 && (
                <Card className="bg-slate-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-slate-500">No additional charges added</p>
                    <p className="text-xs text-slate-400">You can skip this step if not needed</p>
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {/* Customer Summary */}
              <Card className="bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Customer</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedCustomer?.name.charAt(0).toUpperCase()}
                      </span>
              </div>
                    <div>
                      <p className="font-medium">{selectedCustomer?.name}</p>
                      <p className="text-sm text-slate-500">{selectedCustomer?.phone}</p>
            </div>
          </div>
                </CardContent>
              </Card>

              {/* Items Summary */}
          <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Items ({selectedProducts.length + selectedServices.length})
                  </CardTitle>
            </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {selectedProducts.map(productId => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    const qty = itemQuantities[productId] || 1;
                    return (
                      <div key={productId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{product.icon || "📦"}</span>
                <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-slate-500">Qty: {qty} × ₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</p>
                </div>
                </div>
                        <p className="font-semibold">₹{(qty * parseFloat(product.price.toString())).toLocaleString('en-IN')}</p>
                      </div>
                    );
                  })}
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId);
                    if (!service) return null;
                    const qty = itemQuantities[serviceId] || 1;
                    return (
                      <div key={serviceId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                            <Wrench className="h-3 w-3 text-purple-600" />
                </div>
                <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-slate-500">Qty: {qty} × ₹{parseFloat(service.price.toString()).toLocaleString('en-IN')}</p>
                </div>
              </div>
                        <p className="font-semibold">₹{(qty * parseFloat(service.price.toString())).toLocaleString('en-IN')}</p>
                      </div>
                    );
                  })}
            </CardContent>
          </Card>

              {/* Additional Charges Summary */}
              {additionalCharges.length > 0 && (
                <Card className="bg-amber-50 border-amber-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700">
                      Additional Charges ({additionalCharges.length})
                    </CardTitle>
            </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {additionalCharges.map(charge => (
                      <div key={charge.id} className="flex items-center justify-between py-1">
                      <div>
                          <p className="font-medium text-sm">{charge.name}</p>
                          <p className="text-xs text-slate-500">₹{charge.amount} + {charge.taxPercent}% tax</p>
                      </div>
                        <p className="font-semibold text-amber-700">₹{charge.total.toLocaleString('en-IN')}</p>
                  </div>
                ))}
                  </CardContent>
                </Card>
              )}

              {/* Validity */}
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Valid for {validDays} days from today</span>
              </div>
                </CardContent>
              </Card>

              {/* Total */}
              <Card className="bg-indigo-600 text-white">
                <CardContent className="p-4">
              <div className="space-y-2">
                    <div className="flex justify-between text-sm opacity-80">
                      <span>Items Subtotal</span>
                      <span>₹{calculateItemsTotal().toLocaleString('en-IN')}</span>
                </div>
                    {additionalCharges.length > 0 && (
                      <div className="flex justify-between text-sm opacity-80">
                        <span>Additional Charges</span>
                        <span>₹{additionalCharges.reduce((sum, c) => sum + c.total, 0).toLocaleString('en-IN')}</span>
                </div>
                    )}
                    <Separator className="bg-white/20" />
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Total Amount</span>
                      <span className="text-2xl font-bold">₹{calculateTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
                  </div>
                )}
                  </div>

        {/* Footer */}
        <div className="border-t bg-white p-4">
          {step === "customer" && (
              <Button 
              onClick={() => setStep("items")}
              disabled={!customerId}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
              Continue to Add Items
              <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}

          {step === "items" && (
            <div className="space-y-3">
              {hasItems && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{selectedProducts.length + selectedServices.length} items selected</span>
                  <span className="font-bold text-indigo-600">₹{calculateItemsTotal().toLocaleString('en-IN')}</span>
                </div>
              )}
                <Button 
                onClick={() => setStep("charges")}
                disabled={!hasItems}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                Continue to Additional Charges
                <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
            </div>
          )}

          {step === "charges" && (
                <Button 
              onClick={() => setStep("review")}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
              Review Quotation
              <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
            )}

          {step === "review" && (
              <Button 
              onClick={() => createQuotationMutation.mutate()}
              disabled={createQuotationMutation.isPending}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              {createQuotationMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Create Quotation
                </>
              )}
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
