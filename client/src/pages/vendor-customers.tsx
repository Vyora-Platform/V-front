import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, Search, Plus, Trash2, Edit2, Phone, Mail, MapPin, Calendar, 
  TrendingUp, Package, ShoppingCart, ArrowLeft, Eye, RefreshCw,
  MoreHorizontal, UserCheck, UserX, Clock, Star, Activity,
  Sparkles, Target, Crown, Building2, UserPlus, Wallet, AlertTriangle,
  CalendarCheck, Timer, IndianRupee
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { format, formatDistanceToNow, differenceInDays, isPast, isFuture } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

export default function VendorCustomers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { vendorId } = useAuth();

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

  // Fetch customers
  const { data: customers = [], isLoading, refetch } = useQuery<Customer[]>({
    queryKey: ['/api/vendors', vendorId, 'customers', searchQuery, statusFilter],
    queryFn: async () => {
      let url = `/api/vendors/${vendorId}/customers`;
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(getApiUrl(url));
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch all bookings to find ongoing ones
  const { data: allBookings = [] } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'bookings'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/bookings`), {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch all orders
  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'orders'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/orders`), {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Fetch all ledger transactions to calculate balances
  const { data: allLedgerTransactions = [] } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'ledger-transactions'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/ledger-transactions`), {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!vendorId,
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'customers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: "✅ Customer deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    },
  });

  // Update customer status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/customers/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'customers'] });
      toast({ title: "Status updated" });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCustomer(null);
  };

  // Build phone-to-customer-id mapping
  const phoneToCustomerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customers.forEach((c) => {
      if (c.phone) {
        map[c.phone] = c.id;
      }
    });
    return map;
  }, [customers]);

  // Get all bookings map by customer (by phone or customerId)
  const bookingsMapByCustomer = useMemo(() => {
    const map: Record<string, any[]> = {};
    allBookings.forEach((booking: any) => {
      // Match by customerId or by phone
      let customerId = booking.customerId;
      if (!customerId && booking.patientPhone) {
        customerId = phoneToCustomerMap[booking.patientPhone];
      }
      if (!customerId && booking.customerPhone) {
        customerId = phoneToCustomerMap[booking.customerPhone];
      }
      if (customerId) {
        if (!map[customerId]) {
          map[customerId] = [];
        }
        map[customerId].push(booking);
      }
    });
    return map;
  }, [allBookings, phoneToCustomerMap]);

  // Get all orders map by customer (by phone or customerId)
  const ordersMapByCustomer = useMemo(() => {
    const map: Record<string, any[]> = {};
    allOrders.forEach((order: any) => {
      // Match by customerId or by phone
      let customerId = order.customerId;
      if (!customerId && order.customerPhone) {
        customerId = phoneToCustomerMap[order.customerPhone];
      }
      if (customerId) {
        if (!map[customerId]) {
          map[customerId] = [];
        }
        map[customerId].push(order);
      }
    });
    return map;
  }, [allOrders, phoneToCustomerMap]);

  // Get ongoing bookings map by customer
  const ongoingBookingsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    Object.entries(bookingsMapByCustomer).forEach(([customerId, bookings]) => {
      const ongoing = bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'pending');
      if (ongoing.length > 0) {
        map[customerId] = ongoing;
      }
    });
    return map;
  }, [bookingsMapByCustomer]);

  // Get ongoing orders map by customer
  const ongoingOrdersMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    Object.entries(ordersMapByCustomer).forEach(([customerId, orders]) => {
      const ongoing = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing' || o.status === 'confirmed');
      if (ongoing.length > 0) {
        map[customerId] = ongoing;
      }
    });
    return map;
  }, [ordersMapByCustomer]);

  // Get ledger balance map by customer
  // Note: Balance excludes POS paid amounts (product exchange) - only credit/due affects balance
  const ledgerBalanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    allLedgerTransactions.forEach((txn: any) => {
      if (txn.customerId) {
        if (!map[txn.customerId]) {
          map[txn.customerId] = 0;
        }
        // Skip transactions excluded from balance (POS paid amounts)
        if (txn.excludeFromBalance) return;
        
        // 'in' means money coming in (payment received), 'out' means money going out
        if (txn.type === 'in') {
          map[txn.customerId] += (txn.amount || 0);
        } else {
          map[txn.customerId] -= (txn.amount || 0);
        }
      }
    });
    return map;
  }, [allLedgerTransactions]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    // Filter by customer type
    if (customerTypeFilter !== "all") {
      result = result.filter(c => c.customerType === customerTypeFilter);
    }
    
    // Filter by membership
    if (membershipFilter !== "all") {
      if (membershipFilter === "none") {
        result = result.filter(c => !c.membershipType);
      } else {
        result = result.filter(c => c.membershipType?.toLowerCase().includes(membershipFilter.toLowerCase()));
      }
    }
    
    // Sort
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "spent") {
      result.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (sortBy === "visits") {
      result.sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));
    }
    
    return result;
  }, [customers, customerTypeFilter, membershipFilter, sortBy]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === "active").length;
    const inactive = customers.filter(c => c.status === "inactive").length;
    const pendingFollowup = customers.filter(c => c.status === "pending_followup").length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalVisits = customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0);
    const avgSpent = total > 0 ? totalRevenue / total : 0;
    const withMembership = customers.filter(c => c.membershipType).length;
    
    return {
      total,
      active,
      inactive,
      pendingFollowup,
      totalRevenue,
      totalVisits,
      avgSpent,
      withMembership,
    };
  }, [customers]);

  if (!vendorId) { return <LoadingSpinner />; }

  // Avatar component
  const Avatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base"
    };
    const initial = name.charAt(0).toUpperCase();
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
      "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      active: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <UserCheck className="h-3 w-3" /> },
      inactive: { bg: "bg-gray-100", text: "text-gray-600", icon: <UserX className="h-3 w-3" /> },
      pending_followup: { bg: "bg-amber-100", text: "text-amber-700", icon: <Clock className="h-3 w-3" /> },
      blocked: { bg: "bg-red-100", text: "text-red-700", icon: <UserX className="h-3 w-3" /> },
    };
    const c = config[status] || config.active;
    return (
      <Badge className={`${c.bg} ${c.text} border-0 gap-1 font-medium text-xs`}>
        {c.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  // Customer Type badge
  const TypeBadge = ({ type }: { type: string }) => {
    const icons: Record<string, React.ReactNode> = {
      "walk-in": <Users className="h-3 w-3" />,
      "online": <Activity className="h-3 w-3" />,
      "referral": <UserPlus className="h-3 w-3" />,
      "corporate": <Building2 className="h-3 w-3" />,
    };
    return (
      <Badge variant="outline" className="text-xs gap-1 font-normal capitalize">
        {icons[type] || <Users className="h-3 w-3" />}
        {type}
      </Badge>
    );
  };

  // Membership status helper
  const getMembershipStatus = (customer: Customer) => {
    if (!customer.membershipEndDate) return null;
    
    const endDate = new Date(customer.membershipEndDate);
    const now = new Date();
    const daysUntilExpiry = differenceInDays(endDate, now);
    
    if (isPast(endDate)) {
      return { status: 'expired', text: 'Expired', color: 'text-red-600 bg-red-50' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring', text: `Expiring in ${daysUntilExpiry}d`, color: 'text-amber-600 bg-amber-50' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', text: `${daysUntilExpiry}d left`, color: 'text-orange-600 bg-orange-50' };
    } else {
      return { status: 'active', text: 'Active', color: 'text-emerald-600 bg-emerald-50' };
    }
  };

  return (
    <div className="flex min-h-full w-full flex-col bg-gray-50/50 dark:bg-background">
      {/* Header - Fixed */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-white dark:bg-card border-b shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="h-10 w-10 shrink-0 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 hidden md:block" />
              <h1 className="text-xl md:text-2xl font-bold">Customers</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-10 w-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) setEditingCustomer(null);
            }}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 h-10 px-4"
                  onClick={(e) => {
                    if (!isPro) {
                      e.preventDefault();
                      handleProAction('create', () => setIsAddDialogOpen(true));
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Add Customer</span>
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {editingCustomer ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                    {editingCustomer ? "Edit Customer" : "Add Customer"}
                  </DialogTitle>
                </DialogHeader>
                <CustomerForm
                  customer={editingCustomer}
                  vendorId={vendorId}
                  onSuccess={handleCloseDialog}
                  isPro={isPro}
                  handleProAction={handleProAction}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1">
        {/* Stats Dashboard - Horizontal Scroll on Mobile */}
        <div className="px-4 md:px-6 py-4 bg-white dark:bg-card border-b max-w-[1440px] mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-8 scrollbar-hide">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-medium">Active</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.active}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-700/20 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Inactive</p>
              <p className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.inactive}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-amber-600 dark:text-amber-400 font-medium">Follow-up</p>
              <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingFollowup}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium">Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">₹{(stats.totalRevenue / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-cyan-600 dark:text-cyan-400 font-medium">Visits</p>
              <p className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.totalVisits}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-rose-600 dark:text-rose-400 font-medium">Avg Spent</p>
              <p className="text-xl md:text-2xl font-bold text-rose-700 dark:text-rose-300">₹{stats.avgSpent.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 min-w-[110px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 font-medium">Members</p>
              <p className="text-xl md:text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.withMembership}</p>
            </div>
          </div>

          {/* Activity Progress */}
          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-1 h-2 md:h-3 rounded-full overflow-hidden bg-gray-200">
              <div className="bg-emerald-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }} />
              <div className="bg-amber-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.pendingFollowup / stats.total) * 100 : 0}%` }} />
              <div className="bg-gray-400 transition-all" style={{ width: `${stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Active: {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</span>
              <span className="hidden sm:inline">Follow-up: {stats.total > 0 ? Math.round((stats.pendingFollowup / stats.total) * 100) : 0}%</span>
              <span>Inactive: {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-card border-b sticky top-[60px] md:top-[72px] z-10 space-y-3 max-w-[1440px] mx-auto">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-sm bg-muted/50 w-full rounded-xl"
            />
          </div>
          
          {/* Filters Row - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending_followup">Follow-up</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>

            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger className="w-[120px] md:w-[140px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Membership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="none">No Membership</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="spent">Top Spent</SelectItem>
                <SelectItem value="visits">Most Visits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers List */}
        <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto">
          <p className="text-xs text-muted-foreground mb-3">{filteredCustomers.length} customers</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm text-center">
                  {searchQuery ? "No customers found" : "No customers yet"}
                </p>
                <Button 
                  onClick={() => handleProAction('create', () => setIsAddDialogOpen(true))} 
                  size="sm" 
                  className="mt-4 bg-blue-600 h-10 px-5"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Customer
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={(status) => statusMutation.mutate({ id: customer.id, status })}
                  onViewDetails={() => setLocation(`/vendor/customers/${customer.id}`)}
                  Avatar={Avatar}
                  StatusBadge={StatusBadge}
                  TypeBadge={TypeBadge}
                  getMembershipStatus={getMembershipStatus}
                  allBookings={bookingsMapByCustomer[customer.id] || []}
                  allOrders={ordersMapByCustomer[customer.id] || []}
                  ongoingBookings={ongoingBookingsMap[customer.id] || []}
                  ongoingOrders={ongoingOrdersMap[customer.id] || []}
                  ledgerBalance={ledgerBalanceMap[customer.id] || 0}
                  isPro={isPro}
                  handleProAction={handleProAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Customer Card Component - MNC Mobile Optimized
function CustomerCard({
  customer,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
  Avatar,
  StatusBadge,
  TypeBadge,
  getMembershipStatus,
  allBookings,
  allOrders,
  ongoingBookings,
  ongoingOrders,
  ledgerBalance,
  isPro,
  handleProAction,
}: {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (status: string) => void;
  onViewDetails: () => void;
  Avatar: any;
  StatusBadge: any;
  TypeBadge: any;
  getMembershipStatus: (customer: Customer) => { status: string; text: string; color: string } | null;
  allBookings: any[];
  allOrders: any[];
  ongoingBookings: any[];
  ongoingOrders: any[];
  ledgerBalance: number;
  isPro: boolean;
  handleProAction: (action: string, callback: () => void) => void;
}) {
  // Use last interaction time (lastVisitDate, or last booking/order date, or createdAt)
  const getLastInteractionDate = () => {
    const dates: Date[] = [];
    if (customer.lastVisitDate) dates.push(new Date(customer.lastVisitDate));
    if (allBookings.length > 0) {
      const lastBooking = allBookings.sort((a, b) => 
        new Date(b.bookingDate || b.createdAt).getTime() - new Date(a.bookingDate || a.createdAt).getTime()
      )[0];
      dates.push(new Date(lastBooking.bookingDate || lastBooking.createdAt));
    }
    if (allOrders.length > 0) {
      const lastOrder = allOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      dates.push(new Date(lastOrder.createdAt));
    }
    if (dates.length === 0) return new Date(customer.createdAt);
    return new Date(Math.max(...dates.map(d => d.getTime())));
  };
  
  const lastInteraction = getLastInteractionDate();
  const timeAgo = formatDistanceToNow(lastInteraction, { addSuffix: true });
  const membershipStatus = getMembershipStatus(customer);

  // Get last completed booking
  const completedBookings = allBookings.filter((b: any) => b.status === 'completed');
  const lastCompletedBooking = completedBookings.length > 0 
    ? completedBookings.sort((a: any, b: any) => 
        new Date(b.bookingDate || b.createdAt).getTime() - new Date(a.bookingDate || a.createdAt).getTime()
      )[0]
    : null;

  // Get next/ongoing booking with end date
  const upcomingBooking = ongoingBookings.length > 0 
    ? ongoingBookings.sort((a: any, b: any) => 
        new Date(a.bookingDate || a.createdAt).getTime() - new Date(b.bookingDate || b.createdAt).getTime()
      )[0]
    : null;

  // Build address string
  const addressParts = [];
  if (customer.address) addressParts.push(customer.address);
  if (customer.city) addressParts.push(customer.city);
  if (customer.state) addressParts.push(customer.state);
  const fullAddress = addressParts.join(', ');

  return (
    <Card className="border-0 shadow-sm overflow-hidden active:scale-[0.99] transition-transform rounded-xl">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          <Avatar name={customer.name} size="md" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <StatusBadge status={customer.status} />
                  <TypeBadge type={customer.customerType} />
                </div>
              </div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo}</span>
            </div>

            {/* Contact Info */}
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {customer.phone}
              </p>
              {customer.email && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{customer.email}</span>
                </p>
              )}
              {fullAddress && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{fullAddress}</span>
                </p>
              )}
            </div>

            {/* Stats Row - Spent, Orders, Bookings */}
            <div className="flex flex-wrap gap-2 mt-2">
              {(customer.totalSpent || 0) > 0 && (
                <span className="text-xs flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                  ₹{(customer.totalSpent || 0).toLocaleString()}
                </span>
              )}
              {allOrders.length > 0 && (
                <span className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  <ShoppingCart className="h-3 w-3" />
                  {allOrders.length} order{allOrders.length > 1 ? 's' : ''}
                </span>
              )}
              {allBookings.length > 0 && (
                <span className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                  <CalendarCheck className="h-3 w-3" />
                  {allBookings.length} booking{allBookings.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Last Visit & Balance Row */}
            <div className="flex flex-wrap gap-2 mt-2">
              {customer.lastVisitDate ? (
                <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                  <Clock className="h-3 w-3" />
                  Last visit: {format(new Date(customer.lastVisitDate), 'MMM d, h:mm a')}
                </span>
              ) : (
                <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                  <Clock className="h-3 w-3" />
                  No visits yet
                </span>
              )}
              {/* Ledger Balance */}
              {ledgerBalance !== 0 && (
                <span className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${
                  ledgerBalance > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  <Wallet className="h-3 w-3" />
                  {ledgerBalance > 0 ? `₹${ledgerBalance.toLocaleString()}` : `Due ₹${Math.abs(ledgerBalance).toLocaleString()}`}
                </span>
              )}
            </div>

            {/* Active Bookings / Completed Bookings Info */}
            {(upcomingBooking || lastCompletedBooking) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {upcomingBooking && (
                  <span className="text-xs flex items-center gap-1 bg-cyan-50 text-cyan-700 px-2 py-1 rounded">
                    <Calendar className="h-3 w-3" />
                    Active till {format(new Date(upcomingBooking.bookingDate || upcomingBooking.createdAt), 'MMM d')}
                  </span>
                )}
                {!upcomingBooking && lastCompletedBooking && (
                  <span className="text-xs flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-1 rounded">
                    <CalendarCheck className="h-3 w-3" />
                    Completed on {format(new Date(lastCompletedBooking.bookingDate || lastCompletedBooking.createdAt), 'MMM d')}
                  </span>
                )}
              </div>
            )}

            {/* Membership & Status Info */}
            {(customer.membershipType || membershipStatus || ongoingBookings.length > 0 || ongoingOrders.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customer.membershipType && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs gap-1">
                    <Crown className="h-3 w-3" />
                    {customer.membershipType}
                  </Badge>
                )}
                {membershipStatus && (
                  <Badge className={`${membershipStatus.color} border-0 text-xs gap-1`}>
                    {membershipStatus.status === 'expired' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Timer className="h-3 w-3" />
                    )}
                    {membershipStatus.text}
                  </Badge>
                )}
                {ongoingBookings.length > 0 && (
                  <Badge className="bg-cyan-100 text-cyan-700 border-0 text-xs gap-1">
                    <Calendar className="h-3 w-3" />
                    {ongoingBookings.length} active
                  </Badge>
                )}
                {ongoingOrders.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1">
                    <Package className="h-3 w-3" />
                    {ongoingOrders.length} pending
                  </Badge>
                )}
              </div>
            )}

            {/* Notes */}
            {customer.notes && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-1">
                {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons - Inside Card */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${customer.phone}`, '_self');
            }}
            className="flex-1 h-10 text-xs rounded-lg"
          >
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="ml-1.5 hidden sm:inline">Call</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`, '_blank');
            }}
            className="flex-1 h-10 text-xs rounded-lg"
          >
            <FaWhatsapp className="h-4 w-4 text-green-600" />
            <span className="ml-1.5 hidden sm:inline">WhatsApp</span>
          </Button>
          {customer.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${customer.email}`, '_blank');
              }}
              className="flex-1 h-10 text-xs rounded-lg"
            >
              <Mail className="h-4 w-4 text-purple-600" />
              <span className="ml-1.5 hidden sm:inline">Mail</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex-1 h-10 text-xs rounded-lg"
          >
            <Eye className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">View</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-lg" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleProAction('update', () => onEdit(customer))}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleProAction('update', () => onStatusChange("active"))}>
                <UserCheck className="h-4 w-4 mr-2 text-emerald-600" />
                Active
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleProAction('update', () => onStatusChange("inactive"))}>
                <UserX className="h-4 w-4 mr-2 text-gray-600" />
                Inactive
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleProAction('update', () => onStatusChange("pending_followup"))}>
                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                Follow-up
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleProAction('delete', () => onDelete(customer.id, customer.name))}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Customer Form Component
function CustomerForm({ customer, vendorId, onSuccess, isPro, handleProAction }: { customer?: Customer | null; vendorId: string; onSuccess: () => void; isPro?: boolean; handleProAction?: (action: string, callback: () => void) => void }) {
  const { toast } = useToast();
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: customer || {
      vendorId: vendorId,
      name: "",
      email: "",
      phone: "",
      alternatePhone: null,
      dateOfBirth: null,
      gender: null,
      address: "",
      city: "",
      state: "",
      pincode: "",
      membershipType: null,
      membershipStartDate: null,
      membershipEndDate: null,
      subscriptionStatus: null,
      activePackages: [],
      servicesEnrolled: [],
      customerType: "walk-in",
      source: null,
      referredBy: null,
      status: "active",
      lastVisitDate: null,
      totalVisits: 0,
      totalSpent: 0,
      notes: null,
      preferences: [],
      allergies: [],
      emergencyContactName: null,
      emergencyContactPhone: null,
      documents: [],
      avatar: null,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const url = customer
        ? `/api/customers/${customer.id}`
        : `/api/vendors/${vendorId}/customers`;
      const method = customer ? 'PATCH' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'customers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      toast({ title: customer ? "✅ Customer updated" : "✅ Customer added" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to save customer", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    if (handleProAction) {
      handleProAction(customer ? 'update' : 'create', () => mutation.mutate(data));
    } else {
      mutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Information Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
          </div>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Full name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="9876543210" />
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
                    <Input {...field} value={field.value || ""} placeholder="email@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_followup">Pending Follow-up</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-700">Address</h3>
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Full address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="City" />
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
                    <Input {...field} value={field.value || ""} placeholder="State" />
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
                    <Input {...field} value={field.value || ""} placeholder="123456" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Membership Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Crown className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-700">Membership</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="membershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership Type</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., Gold, Premium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscriptionStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="How did they find you?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Information Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-700">Additional Information</h3>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Internal notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t">
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            {mutation.isPending ? "Saving..." : customer ? "Update Customer" : "Add Customer"}
            {isPro === false && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
