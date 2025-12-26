import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, FileText, Search, Trash2, Send, Check, X, Clock, ArrowLeft, 
  User, Calendar, IndianRupee, Package, Wrench, ChevronRight, 
  MoreVertical, Eye, Download, Share2, CheckCircle2,
  AlertCircle, XCircle, Mail, Phone, MapPin, ShoppingBag, Receipt,
  Building2, Hash, Percent, PlusCircle, Globe, Edit,
  UserPlus, Image as ImageIcon, AlertTriangle
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"created" | "requests">("created");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [prefilledCustomerId, setPrefilledCustomerId] = useState<string | null>(null);
  const { toast } = useToast();
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Handle URL tab parameter (e.g., /vendor/quotations?tab=requests)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'requests') {
      setActiveTab('requests');
    } else if (tabParam === 'created') {
      setActiveTab('created');
    }
  }, []);

  // Fetch quotations
  const { data: quotations = [], isLoading: loadingQuotations } = useQuery<QuotationWithItems[]>({
    queryKey: ["/api/vendors", vendorId, "quotations", statusFilter !== "all" ? statusFilter : undefined],
    enabled: !!vendorId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = getApiUrl(`/api/vendors/${vendorId}/quotations${params.toString() ? `?${params.toString()}` : ""}`);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch quotations");
      return response.json();
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  // Separate quotations by source (handle null/undefined source as 'manual')
  const createdQuotations = quotations.filter(q => (q.source || "manual") !== "miniwebsite");
  const requestedQuotations = quotations.filter(q => (q.source || "manual") === "miniwebsite");

  // Calculate stats for current tab
  const currentQuotations = activeTab === "created" ? createdQuotations : requestedQuotations;
  
  const stats = {
    total: currentQuotations.length,
    draft: currentQuotations.filter(q => q.status === "draft").length,
    sent: currentQuotations.filter(q => q.status === "sent").length,
    accepted: currentQuotations.filter(q => q.status === "accepted").length,
    rejected: currentQuotations.filter(q => q.status === "rejected").length,
    totalValue: currentQuotations.reduce((sum, q) => sum + parseFloat(q.totalAmount || "0"), 0),
    createdCount: createdQuotations.length,
    requestsCount: requestedQuotations.length,
  };

  // Filter quotations
  if (!vendorId) { return <LoadingSpinner />; }

  const filteredQuotations = currentQuotations.filter(quotation => {
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    const customer = customers.find(c => c.id === quotation.customerId);
    const matchesSearch = !searchQuery || 
      quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.phone?.includes(searchQuery);
    
    return matchesStatus && matchesSearch;
  });
  
  // Helper function to make a call
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };
  
  // Helper function to send WhatsApp message
  const handleWhatsApp = (phone: string, quotationNumber: string, customerName: string) => {
    const message = `Hi ${customerName}, regarding your quotation ${quotationNumber} - `;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`);
  };
  
  // Helper to create quotation from request
  const handleCreateFromRequest = (customerId: string) => {
    setPrefilledCustomerId(customerId);
    setShowCreateDialog(true);
  };

  const getStatusConfig = (status: string, isRequest: boolean = false) => {
    switch (status) {
      case "draft":
        return { 
          color: isRequest 
            ? "bg-amber-100 text-amber-700 border-amber-200" 
            : "bg-blue-100 text-blue-700 border-blue-200", 
          icon: isRequest ? Clock : FileText, 
          label: isRequest ? "Pending" : "Created",
          gradient: isRequest ? "from-amber-500 to-amber-600" : "from-blue-500 to-blue-600"
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
      className="flex flex-col min-h-screen bg-background overflow-y-auto"
    >
      {/* Header - Clean Design Like Other Modules */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Use history back for standard e-commerce UX
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  setLocation("/vendor/dashboard");
                }
              }}
              className="shrink-0 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Quotations</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Manage your quotes</p>
            </div>
          </div>
          <Button
            onClick={() => {
              handleProAction('create', () => {
              setPrefilledCustomerId(null);
              setShowCreateDialog(true);
              });
            }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Quotation</span>
            <span className="sm:hidden">New</span>
            {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
          </Button>
        </div>

        {/* Tabs - Created vs Requests */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "created" | "requests")}>
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="created" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4 mr-2" />
                Created ({stats.createdCount})
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Globe className="h-4 w-4 mr-2" />
                Requests ({stats.requestsCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards - Horizontal Scroll */}
        <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border-indigo-200 dark:border-indigo-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{activeTab === "requests" ? "Pending" : "Created"}</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{stats.draft}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <Send className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sent</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.sent}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accepted</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.accepted}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 min-w-[120px] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rejected</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.rejected}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 min-w-[140px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20">
                  <IndianRupee className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Value</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400">₹{(stats.totalValue / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-background">
        {/* Search & Filters */}
        <div className="px-4 py-3 bg-background border-b">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quotations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-[var(--input-h)] text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] h-[var(--input-h)] text-sm flex-shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">{activeTab === "requests" ? "Pending" : "Created"}</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quotations List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingQuotations ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No quotations found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                {statusFilter !== 'all' || searchQuery 
                  ? "Try adjusting your search or filters"
                  : "Create your first quotation to get started"}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button 
                  onClick={() => handleProAction('create', () => setShowCreateDialog(true))} 
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Quotation
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1 opacity-60" />}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotations.map(quotation => {
                const customer = customers.find(c => c.id === quotation.customerId);
                const isRequest = (quotation.source || "manual") === "miniwebsite";
                const statusConfig = getStatusConfig(quotation.status, isRequest);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card 
                    key={quotation.id} 
                    className="overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.99] rounded-xl"
                    onClick={() => setLocation(`/vendor/quotations/${quotation.id}`)}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br ${statusConfig.gradient}`}>
                            {isRequest ? <Globe className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{quotation.quotationNumber}</h3>
                            <Badge className={`${statusConfig.color} border text-[10px] px-1.5 py-0 h-5`}>
                              {statusConfig.label}
                            </Badge>
                              {isRequest && quotation.miniWebsiteSubdomain && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">
                                  {quotation.miniWebsiteSubdomain}
                                </Badge>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {customer?.name || "Unknown Customer"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(quotation.quotationDate), "dd MMM yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Valid till {format(new Date(quotation.validUntil), "dd MMM")}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                          <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-sm font-semibold text-primary">
                            ₹{parseFloat(quotation.totalAmount || "0").toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="shrink-0">
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
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/vendor/quotations/${quotation.id}/edit`);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Quotation
                              </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                              {isRequest && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateFromRequest(quotation.customerId);
                                }}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create New Quotation
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>

                        {/* Action Buttons Row */}
                        {customer && (
                          <div className="flex items-center gap-2 ml-15 pl-15">
                            <p className="text-sm font-semibold text-primary sm:hidden mr-auto">
                              ₹{parseFloat(quotation.totalAmount || "0").toLocaleString('en-IN')}
                            </p>
                            {customer.phone && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCall(customer.phone!);
                                  }}
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Call</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWhatsApp(customer.phone!, quotation.quotationNumber, customer.name);
                                  }}
                                >
                                  <FaWhatsapp className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </Button>
                              </>
                            )}
                            {isRequest && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 px-3 text-xs gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateFromRequest(quotation.customerId);
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Create Quote</span>
                              </Button>
                            )}
                          </div>
                        )}
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
        onClose={() => {
          setShowCreateDialog(false);
          setPrefilledCustomerId(null);
        }}
        customers={customers}
        vendorId={vendorId}
        prefilledCustomerId={prefilledCustomerId}
        onSuccess={() => {
          setShowCreateDialog(false);
          setPrefilledCustomerId(null);
          queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
        }}
      />

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
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
  prefilledCustomerId,
  onSuccess 
}: { 
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  vendorId: string;
  prefilledCustomerId?: string | null;
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
  
  // Walk-in customer state
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

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

  // Mutation to create new customer
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; email?: string }) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/customers`, {
        vendorId,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        customerType: "walk-in",
        status: "active",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "customers"] });
      setCustomerId(data.id);
      setIsAddingNewCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      toast({
        title: "Customer Created",
        description: "New walk-in customer added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer.",
        variant: "destructive",
      });
    },
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
      setIsAddingNewCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setProductSearchQuery("");
      setServiceSearchQuery("");
    } else if (prefilledCustomerId) {
      // Pre-fill customer if coming from a request
      setCustomerId(prefilledCustomerId);
      setStep("items"); // Skip to items step
    }
  }, [open, prefilledCustomerId]);

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

      const quotationData: Record<string, any> = {
        vendorId,
        customerId,
        // quotationNumber will be auto-generated by server
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
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/50">
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
                  step === s ? "bg-primary text-primary-foreground" :
                  currentStepIndex > idx ? "bg-green-500 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {currentStepIndex > idx ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < steps.length - 1 && <div className={`flex-1 h-0.5 ${
                  currentStepIndex > idx ? "bg-green-500" : "bg-muted"
                }`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "customer" && (
            <div className="space-y-4">
              {/* Customer Selection Mode */}
              {!isAddingNewCustomer ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Customer *</Label>
                    <Select value={customerId} onValueChange={(val) => {
                      if (val === "new") {
                        setIsAddingNewCustomer(true);
                        setCustomerId("");
                      } else {
                        setCustomerId(val);
                      }
                    }}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Choose a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Walk-in / New Customer Option */}
                        <SelectItem value="new" className="border-b">
                          <div className="flex items-center gap-2 text-primary">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserPlus className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">+ Add Walk-in Customer</p>
                              <p className="text-xs text-muted-foreground">Create new customer</p>
                            </div>
                          </div>
                        </SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
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
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-lg">
                              {selectedCustomer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{selectedCustomer.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                          </div>
                        </div>
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Mail className="h-4 w-4" />
                            <span>{selectedCustomer.email}</span>
                          </div>
                        )}
                        {selectedCustomer.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedCustomer.address}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                /* Add New Walk-in Customer Form */
                <Card className="border-2 border-dashed border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Add Walk-in Customer
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingNewCustomer(false);
                          setNewCustomerName("");
                          setNewCustomerPhone("");
                          setNewCustomerEmail("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Customer Name *</Label>
                      <Input
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Phone Number *</Label>
                      <Input
                        type="tel"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email (Optional)</Label>
                      <Input
                        type="email"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        placeholder="customer@email.com"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!newCustomerName.trim()) {
                          toast({ title: "Name is required", variant: "destructive" });
                          return;
                        }
                        if (!newCustomerPhone.trim()) {
                          toast({ title: "Phone is required", variant: "destructive" });
                          return;
                        }
                        createCustomerMutation.mutate({
                          name: newCustomerName.trim(),
                          phone: newCustomerPhone.trim(),
                          email: newCustomerEmail.trim() || undefined,
                        });
                      }}
                      disabled={createCustomerMutation.isPending}
                      className="w-full h-11 rounded-xl"
                    >
                      {createCustomerMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Customer & Continue
                        </>
                      )}
                    </Button>
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Products ({products.filter(p => p.isActive).length})
                    </h3>
                  </div>
                  {/* Product Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="pl-9 h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {products
                      .filter(p => p.isActive)
                      .filter(p => 
                        !productSearchQuery || 
                        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                        p.category?.toLowerCase().includes(productSearchQuery.toLowerCase())
                      )
                      .map(product => {
                        const isSelected = selectedProducts.includes(product.id);
                        const productImage = product.images && product.images.length > 0 ? product.images[0] : null;
                        const stockLeft = product.stock || 0;
                        const isLowStock = stockLeft > 0 && stockLeft <= 10;
                        const isOutOfStock = stockLeft <= 0;
                        
                        return (
                          <Card 
                            key={product.id}
                            className={`border cursor-pointer transition-all ${
                              isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted hover:border-primary/50"
                            } ${isOutOfStock ? "opacity-60" : ""}`}
                            onClick={() => !isOutOfStock && toggleProduct(product.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                {/* Product Image */}
                                <div className={`w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? "ring-2 ring-primary" : "bg-muted"
                                }`}>
                                  {productImage ? (
                                    <img 
                                      src={productImage} 
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-800 truncate">{product.name}</h4>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    <span className="text-sm font-semibold text-primary">
                                      ₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}
                                    </span>
                                    {product.unit && (
                                      <span className="text-xs text-muted-foreground">/{product.unit}</span>
                                    )}
                                  </div>
                                  {/* Stock Info */}
                                  <div className="flex items-center gap-2 mt-1">
                                    {isOutOfStock ? (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Out of Stock
                                      </Badge>
                                    ) : isLowStock ? (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Low Stock: {stockLeft}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        In Stock: {stockLeft}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {isSelected && !isOutOfStock ? (
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
                                ) : !isOutOfStock ? (
                                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                ) : null}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-purple-600" />
                      Services ({services.length})
                    </h3>
                  </div>
                  {/* Service Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="pl-9 h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {services
                      .filter(s => 
                        !serviceSearchQuery || 
                        s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                        s.category?.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                      )
                      .map(service => {
                        const isSelected = selectedServices.includes(service.id);
                        const serviceImage = service.images && service.images.length > 0 ? service.images[0] : null;
                        
                        return (
                          <Card 
                            key={service.id}
                            className={`border cursor-pointer transition-all ${
                              isSelected ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500" : "border-slate-200 hover:border-purple-200"
                            }`}
                            onClick={() => toggleService(service.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                {/* Service Image */}
                                <div className={`w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? "ring-2 ring-purple-500" : "bg-slate-100"
                                }`}>
                                  {serviceImage ? (
                                    <img 
                                      src={serviceImage} 
                                      alt={service.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${
                                      isSelected ? "bg-purple-600" : "bg-gradient-to-br from-purple-100 to-purple-200"
                                    }`}>
                                      <Wrench className={`h-6 w-6 ${isSelected ? "text-white" : "text-purple-500"}`} />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-800 truncate">{service.name}</h4>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    <span className="text-sm font-semibold text-purple-600">
                                      ₹{parseFloat(service.price.toString()).toLocaleString('en-IN')}
                                    </span>
                                    {service.duration && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {service.duration} mins
                                      </span>
                                    )}
                                  </div>
                                  {service.category && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 mt-1 bg-purple-50 text-purple-700 border-purple-200">
                                      {service.category}
                                    </Badge>
                                  )}
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
                                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0" />
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
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
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
                    const productImage = product.images && product.images.length > 0 ? product.images[0] : null;
                    return (
                      <div key={productId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {productImage ? (
                              <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">
                                {product.icon || "📦"}
                              </div>
                            )}
                          </div>
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
                    const serviceImage = service.images && service.images.length > 0 ? service.images[0] : null;
                    return (
                      <div key={serviceId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0">
                            {serviceImage ? (
                              <img src={serviceImage} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Wrench className="h-4 w-4 text-purple-600" />
                              </div>
                            )}
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
              <Card className="bg-primary text-primary-foreground">
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
        <div className="border-t bg-background p-4">
          {step === "customer" && (
            <Button 
              onClick={() => setStep("items")}
              disabled={!customerId || isAddingNewCustomer}
              className="w-full h-12 rounded-xl"
            >
              {isAddingNewCustomer ? (
                "Save Customer First"
              ) : (
                <>
                  Continue to Add Items
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          )}

          {step === "items" && (
            <div className="space-y-3">
              {hasItems && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{selectedProducts.length + selectedServices.length} items selected</span>
                  <span className="font-bold text-primary">₹{calculateItemsTotal().toLocaleString('en-IN')}</span>
                </div>
              )}
              <Button 
                onClick={() => setStep("charges")}
                disabled={!hasItems}
                className="w-full h-12 rounded-xl"
              >
                Continue to Additional Charges
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}

          {step === "charges" && (
            <Button 
              onClick={() => setStep("review")}
              className="w-full h-12 rounded-xl"
            >
              Review Quotation
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}

          {step === "review" && (
            <Button 
              onClick={() => createQuotationMutation.mutate()}
              disabled={createQuotationMutation.isPending}
              className="w-full h-12 rounded-xl"
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
