import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, type Lead, type Employee, type LeadCommunication, type LeadTask, type VendorProduct, type VendorCatalogue } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, Search, Phone, Mail, Calendar, User, Briefcase, TrendingUp, 
  MessageSquare, CheckCircle2, XCircle, Clock, Target, ArrowLeft,
  MoreHorizontal, UserPlus, Users, Zap, Star, 
  Eye, Edit2, Trash2, RefreshCw, PhoneCall, MessageCircle,
  Building2, Activity, Sparkles, Timer, CalendarDays, DollarSign, FileText, MapPin
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow, isToday } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { getApiUrl } from "@/lib/config";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { Lock } from "lucide-react";

export default function VendorLeads() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

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

  // Fetch leads
  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: [`/api/vendors/${vendorId}/leads?status=${selectedStatus}&source=${selectedSource}&assignedEmployeeId=${selectedEmployee}`],
    enabled: !!vendorId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedSource !== "all") params.append("source", selectedSource);
      if (selectedEmployee !== "all") params.append("assignedEmployeeId", selectedEmployee);

      const query = params.toString();
      const url = `/api/vendors/${vendorId}/leads${query ? `?${query}` : ""}`;

      const token = localStorage.getItem('token');
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fullUrl = getApiUrl(url);
      const response = await fetch(fullUrl, {
        headers,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leads`);
      }

      return response.json();
    },
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/vendors", vendorId, "employees"],
  });

  // Fetch products for interest selection
  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: ["/api/vendors", vendorId, "products"],
  });

  // Fetch services for interest selection
  const { data: services = [] } = useQuery<VendorCatalogue[]>({
    queryKey: ["/api/vendors", vendorId, "catalogue"],
  });

  // Create/Update lead mutation
  const leadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertLeadSchema>) => {
      if (editingLead) {
        return apiRequest("PATCH", `/api/leads/${editingLead.id}`, data);
      }
      return apiRequest("POST", `/api/vendors/${vendorId}/leads`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      refetch();
      setIsAddDialogOpen(false);
      setEditingLead(null);
      toast({
        title: editingLead ? "✅ Lead updated" : "✅ Lead created",
        description: editingLead ? "Lead details updated successfully" : "New lead added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: (leadId: string) => apiRequest("DELETE", `/api/leads/${leadId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      refetch();
      toast({
        title: "Lead deleted",
        description: "Lead removed successfully",
      });
    },
  });

  // Update lead status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/leads/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      refetch();
      toast({
        title: "Status updated",
        description: "Lead status updated successfully",
      });
    },
  });

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchQuery === "" ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = selectedPriority === "all" || lead.priority === selectedPriority;
      
      return matchesSearch && matchesPriority;
    });
  }, [leads, searchQuery, selectedPriority]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === "new").length;
    const contacted = leads.filter(l => l.status === "contacted").length;
    const interested = leads.filter(l => l.status === "interested").length;
    const converted = leads.filter(l => l.status === "converted").length;
    const lost = leads.filter(l => l.status === "lost").length;
    
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    
    return {
      total,
      new: newLeads,
      contacted,
      interested,
      converted,
      lost,
      conversionRate,
    };
  }, [leads]);

  // Show loading
  if (!vendorId) { return <LoadingSpinner />; }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsAddDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setIsAddDialogOpen(true);
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

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
      new: { bg: "bg-blue-100", text: "text-blue-700", icon: <Sparkles className="h-3 w-3" /> },
      contacted: { bg: "bg-amber-100", text: "text-amber-700", icon: <PhoneCall className="h-3 w-3" /> },
      interested: { bg: "bg-purple-100", text: "text-purple-700", icon: <Star className="h-3 w-3" /> },
      converted: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 className="h-3 w-3" /> },
      lost: { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-3 w-3" /> },
    };
    const c = config[status] || config.new;
    return (
      <Badge className={`${c.bg} ${c.text} border-0 gap-1 font-medium text-xs`}>
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string | null }) => {
    if (!priority) return null;
    const config: Record<string, { bg: string; text: string }> = {
      low: { bg: "bg-gray-100", text: "text-gray-600" },
      medium: { bg: "bg-blue-50", text: "text-blue-600" },
      high: { bg: "bg-orange-100", text: "text-orange-700" },
      urgent: { bg: "bg-red-100", text: "text-red-700" },
    };
    const c = config[priority] || config.medium;
    return (
      <Badge variant="outline" className={`${c.bg} ${c.text} border-0 text-xs`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  // Source badge component
  const SourceBadge = ({ source }: { source: string }) => {
    const icons: Record<string, React.ReactNode> = {
      offline: <Building2 className="h-3 w-3" />,
      website: <Activity className="h-3 w-3" />,
      mini_website: <Zap className="h-3 w-3" />,
      social_media: <Users className="h-3 w-3" />,
      phone: <Phone className="h-3 w-3" />,
      referral: <UserPlus className="h-3 w-3" />,
      whatsapp: <MessageCircle className="h-3 w-3" />,
    };
    return (
      <Badge variant="outline" className="text-xs gap-1 font-normal">
        {icons[source] || <Activity className="h-3 w-3" />}
        {source.replace("_", " ")}
      </Badge>
    );
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
              <Target className="h-5 w-5 text-blue-600 hidden md:block" />
              <h1 className="text-xl md:text-2xl font-bold">Leads</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-10 w-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => handleProAction('create', handleAddNew)} 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 h-10 px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Add Lead</span>
              {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1">
        {/* Stats Dashboard - Horizontal scroll on mobile */}
        <div className="px-4 md:px-6 py-4 bg-white dark:bg-card border-b max-w-[1440px] mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-6 scrollbar-hide">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-cyan-600 dark:text-cyan-400 font-medium">New</p>
              <p className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.new}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-amber-600 dark:text-amber-400 font-medium">Contacted</p>
              <p className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.contacted}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium">Interested</p>
              <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.interested}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-medium">Converted</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.converted}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10 rounded-xl p-4 min-w-[100px] shrink-0 md:min-w-0">
              <p className="text-xs md:text-sm text-rose-600 dark:text-rose-400 font-medium">Rate</p>
              <p className="text-xl md:text-2xl font-bold text-rose-700 dark:text-rose-300">{stats.conversionRate}%</p>
            </div>
          </div>

          {/* Pipeline Progress */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-muted/30 rounded-xl">
            <div className="flex gap-1 h-2.5 md:h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-muted">
              <div className="bg-cyan-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.new / stats.total) * 100 : 0}%` }} />
              <div className="bg-amber-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.contacted / stats.total) * 100 : 0}%` }} />
              <div className="bg-purple-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.interested / stats.total) * 100 : 0}%` }} />
              <div className="bg-emerald-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.converted / stats.total) * 100 : 0}%` }} />
              <div className="bg-red-400 transition-all" style={{ width: `${stats.total > 0 ? (stats.lost / stats.total) * 100 : 0}%` }} />
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
              className="pl-10 rounded-xl bg-muted/50"
            />
          </div>
          
          {/* Filters Row - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Source</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="mini_website">Mini Web</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-[120px] md:w-[140px] h-10 text-xs bg-muted/50 shrink-0 rounded-lg">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignee</SelectItem>
                {employees
                  .filter((emp) => emp.status === "active")
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leads List */}
        <div className="px-4 md:px-6 py-4 max-w-[1440px] mx-auto">
          <p className="text-xs text-muted-foreground mb-3">{filteredLeads.length} leads</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground text-sm text-center">
                  {searchQuery ? "No leads found" : "No leads yet"}
                </p>
                <Button 
                  onClick={() => handleProAction('create', handleAddNew)} 
                  size="sm" 
                  className="mt-4 bg-blue-600 h-10 px-5"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Lead
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  employees={employees}
                  onEdit={(l) => handleProAction('update', () => handleEdit(l))}
                  onDelete={(id) => handleProAction('delete', () => deleteMutation.mutate(id))}
                  onStatusChange={(status) => handleProAction('update', () => statusMutation.mutate({ id: lead.id, status }))}
                  onViewDetails={handleViewDetails}
                  Avatar={Avatar}
                  StatusBadge={StatusBadge}
                  PriorityBadge={PriorityBadge}
                  SourceBadge={SourceBadge}
                  vendorId={vendorId}
                  isPro={isPro}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Lead Dialog */}
      <LeadDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingLead(null);
        }}
        lead={editingLead}
        employees={employees}
        products={products}
        services={services}
        onSubmit={leadMutation.mutate}
        isPending={leadMutation.isPending}
        vendorId={vendorId}
        isPro={isPro}
        handleProAction={handleProAction}
      />

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        lead={selectedLead}
        employees={employees}
        onEdit={(l) => handleProAction('update', () => handleEdit(l))}
        onStatusChange={(status) => handleProAction('update', () => selectedLead && statusMutation.mutate({ id: selectedLead.id, status }))}
        Avatar={Avatar}
        StatusBadge={StatusBadge}
        PriorityBadge={PriorityBadge}
        SourceBadge={SourceBadge}
        vendorId={vendorId}
        isPro={isPro}
        handleProAction={handleProAction}
      />

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        blockedAction={blockedAction}
      />
    </div>
  );
}

// Lead Card Component - Mobile Optimized
function LeadCard({
  lead,
  employees,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
  Avatar,
  StatusBadge,
  PriorityBadge,
  SourceBadge,
  vendorId,
  isPro,
}: {
  lead: Lead;
  employees: Employee[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: string) => void;
  onViewDetails: (lead: Lead) => void;
  Avatar: any;
  StatusBadge: any;
  PriorityBadge: any;
  SourceBadge: any;
  vendorId: string;
  isPro?: boolean;
}) {
  const assignedEmployee = employees.find((e) => e.id === lead.assignedEmployeeId);
  const createdDate = new Date(lead.createdAt);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          <Avatar name={lead.name} size="md" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{lead.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{timeAgo}</span>
            </div>

            {/* Contact Info */}
            <div className="mt-3 space-y-1.5">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground/70" />
                {lead.phone}
              </p>
              {lead.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                  <Mail className="h-4 w-4 text-muted-foreground/70" />
                  <span className="truncate">{lead.email}</span>
                </p>
              )}
              {(lead as any).address && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground/70" />
                  <span className="truncate">{(lead as any).address}</span>
                </p>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 text-xs text-muted-foreground">
              {assignedEmployee && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {assignedEmployee.name}
                </span>
              )}
              {lead.estimatedBudget && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  ₹{lead.estimatedBudget.toLocaleString()}
                </span>
              )}
              <SourceBadge source={lead.source} />
            </div>

            {/* Interest */}
            {lead.interestDescription && (
              <p className="mt-3 text-xs text-muted-foreground line-clamp-1">
                Interest: {lead.interestDescription}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons - Inside Card */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`tel:${lead.phone}`, '_self')}
            className="flex-1 h-10 text-sm"
          >
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="ml-1.5 hidden sm:inline">Call</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')}
            className="flex-1 h-10 text-sm"
          >
            <FaWhatsapp className="h-4 w-4 text-green-600" />
            <span className="ml-1.5 hidden sm:inline">WhatsApp</span>
          </Button>
          {lead.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
              className="flex-1 h-10 text-sm"
            >
              <Mail className="h-4 w-4 text-purple-600" />
              <span className="ml-1.5 hidden sm:inline">Mail</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(lead)}
            className="flex-1 h-10 text-sm"
          >
            <Eye className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">View</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange("new")}>
                <Sparkles className="h-4 w-4 mr-2 text-cyan-600" />
                New
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("contacted")}>
                <PhoneCall className="h-4 w-4 mr-2 text-amber-600" />
                Contacted
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("interested")}>
                <Star className="h-4 w-4 mr-2 text-purple-600" />
                Interested
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("converted")}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                Converted
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("lost")}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Lost
                {!isPro && <Lock className="w-3 h-3 ml-auto opacity-60" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm("Delete this lead?")) {
                    onDelete(lead.id);
                  }
                }}
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

// Lead Detail Dialog
function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  employees,
  onEdit,
  onStatusChange,
  Avatar,
  StatusBadge,
  PriorityBadge,
  SourceBadge,
  vendorId,
  isPro,
  handleProAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  employees: Employee[];
  onEdit: (lead: Lead) => void;
  onStatusChange: (status: string) => void;
  Avatar: any;
  StatusBadge: any;
  PriorityBadge: any;
  SourceBadge: any;
  vendorId: string;
  isPro?: boolean;
  handleProAction?: (action: string, callback: () => void) => void;
}) {
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingInterest, setEditingInterest] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [interestValue, setInterestValue] = useState("");
  const [assigneeValue, setAssigneeValue] = useState<string | null>(null);

  // Reset values when lead changes
  useEffect(() => {
    if (lead) {
      setNotesValue(lead.notes || "");
      setInterestValue(lead.interestDescription || "");
      setAssigneeValue(lead.assignedEmployeeId || null);
    }
  }, [lead]);
  
  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: { notes?: string; interestDescription?: string; assignedEmployeeId?: string | null }) => {
      if (!lead) throw new Error("No lead selected");
      return apiRequest("PATCH", `/api/leads/${lead.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "leads"] });
      setEditingNotes(false);
      setEditingInterest(false);
      setEditingAssignee(false);
      toast({
        title: "Updated",
        description: "Lead information updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Convert Lead mutation - MUST be before any conditional returns
  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("No lead selected");
      const customerData = {
        vendorId: vendorId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || undefined,
        address: (lead as any).address || lead.notes || undefined,
      };
      
      const customerResponse = await apiRequest("POST", `/api/vendors/${vendorId}/customers`, customerData);
      const customer = await customerResponse.json();
      
      await apiRequest("POST", `/api/leads/${lead.id}/convert`, { 
        customerId: customer.id 
      });
      
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "customers"] });
      toast({
        title: "🎉 Lead Converted!",
        description: `${lead?.name} is now a customer`,
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Conditional return AFTER all hooks
  if (!lead) return null;

  const assignedEmployee = employees.find((e) => e.id === lead.assignedEmployeeId);

  const handleSaveNotes = () => {
    updateFieldMutation.mutate({ notes: notesValue });
  };

  const handleSaveInterest = () => {
    updateFieldMutation.mutate({ interestDescription: interestValue });
  };

  const handleSaveAssignee = () => {
    updateFieldMutation.mutate({ assignedEmployeeId: assigneeValue });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full md:max-w-lg md:h-auto md:max-h-[90vh] overflow-y-auto rounded-none md:rounded-lg p-4 md:p-6 fixed inset-0 md:inset-auto md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]">
        <DialogHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="md:hidden flex-shrink-0 h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar name={lead.name} size="lg" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg truncate">{lead.name}</DialogTitle>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${lead.phone}`, '_self')}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-1 text-blue-600" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')}
              className="flex-1"
            >
              <FaWhatsapp className="h-4 w-4 mr-1 text-green-600" />
              WhatsApp
            </Button>
            {lead.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1 text-purple-600" />
                Email
              </Button>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {(lead as any).address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{(lead as any).address}</span>
              </div>
            )}
          </div>

          {/* Assigned To - Editable */}
          <div className="p-3 bg-gray-50 dark:bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                Assigned To
              </p>
              {!editingAssignee && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAssignee(true)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Change
                </Button>
              )}
            </div>
            {editingAssignee ? (
              <div className="space-y-2">
                <Select value={assigneeValue || "unassigned"} onValueChange={(val) => setAssigneeValue(val === "unassigned" ? null : val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees
                      .filter((emp) => emp.status === "active")
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveAssignee}
                    disabled={updateFieldMutation.isPending}
                    className="flex-1 h-8"
                  >
                    {updateFieldMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAssigneeValue(lead.assignedEmployeeId || null);
                      setEditingAssignee(false);
                    }}
                    className="flex-1 h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium">{assignedEmployee?.name || "Unassigned"}</p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2">
            {lead.estimatedBudget && (
              <div className="p-2 bg-gray-50 dark:bg-muted/30 rounded-lg">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium">₹{lead.estimatedBudget.toLocaleString()}</p>
              </div>
            )}
            {lead.nextFollowUpDate && (
              <div className="p-2 bg-gray-50 dark:bg-muted/30 rounded-lg">
                <p className="text-xs text-gray-500">Follow-up</p>
                <p className="text-sm font-medium">{format(new Date(lead.nextFollowUpDate), "MMM d")}</p>
              </div>
            )}
            <div className="p-2 bg-gray-50 dark:bg-muted/30 rounded-lg">
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-sm font-medium capitalize">{lead.source.replace("_", " ")}</p>
            </div>
          </div>

          {/* Interest - Editable */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <Star className="h-3 w-3" />
                Interest
              </p>
              {!editingInterest && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingInterest(true)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {editingInterest ? (
              <div className="space-y-2">
                <Textarea
                  value={interestValue}
                  onChange={(e) => setInterestValue(e.target.value)}
                  placeholder="What are they interested in?"
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveInterest}
                    disabled={updateFieldMutation.isPending}
                    className="flex-1 h-8"
                  >
                    {updateFieldMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInterestValue(lead.interestDescription || "");
                      setEditingInterest(false);
                    }}
                    className="flex-1 h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {lead.interestDescription || "No interest information added yet. Click Edit to add."}
              </p>
            )}
          </div>

          {/* Notes - Editable */}
          <div className="p-3 bg-gray-50 dark:bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notes
              </p>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={updateFieldMutation.isPending}
                    className="flex-1 h-8"
                  >
                    {updateFieldMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNotesValue(lead.notes || "");
                      setEditingNotes(false);
                    }}
                    className="flex-1 h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {lead.notes || "No notes added yet. Click Edit to add."}
              </p>
            )}
          </div>

          {/* Communication History */}
          <CommunicationHistory leadId={lead.id} />

          {/* Tasks */}
          <LeadTasks leadId={lead.id} />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onEdit(lead)} className="w-full sm:w-auto">
            <Edit2 className="h-4 w-4 mr-1" />
            Edit All
            {!isPro && <Lock className="w-3 h-3 ml-1.5 opacity-60" />}
          </Button>
          <Button 
            onClick={() => {
              if (handleProAction) {
                handleProAction('update', () => convertMutation.mutate());
              } else {
                convertMutation.mutate();
              }
            }}
            disabled={convertMutation.isPending || lead.status === "converted"}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {convertMutation.isPending ? "Converting..." : lead.status === "converted" ? "Converted" : "Convert"}
            {!isPro && <Lock className="w-3 h-3 ml-1.5 opacity-60" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Communication History Component
function CommunicationHistory({ leadId }: { leadId: string }) {
  const { data: communications = [] } = useQuery<LeadCommunication[]>({
    queryKey: ["/api/leads", leadId, "communications"],
  });

  if (communications.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Communications</h4>
      <div className="space-y-2">
        {communications.slice(0, 3).map((comm) => (
          <div key={comm.id} className="p-2 bg-gray-50 rounded-lg border-l-2 border-blue-500">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">{comm.type}</Badge>
              <span className="text-xs text-gray-500">
                {format(new Date(comm.createdAt), "MMM d")}
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-1 line-clamp-2">{comm.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lead Tasks Component
function LeadTasks({ leadId }: { leadId: string }) {
  const { data: tasks = [] } = useQuery<LeadTask[]>({
    queryKey: ["/api/leads", leadId, "tasks"],
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  if (pendingTasks.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Tasks ({pendingTasks.length})</h4>
      <div className="space-y-2">
        {pendingTasks.slice(0, 2).map((task) => (
          <div key={task.id} className="p-2 bg-amber-50 rounded-lg flex items-center justify-between">
            <span className="text-xs font-medium text-gray-900 truncate">{task.title}</span>
            {task.dueDate && (
              <span className="text-xs text-amber-600 flex-shrink-0 ml-2">
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Lead Dialog Component
function LeadDialog({
  open,
  onOpenChange,
  lead,
  employees,
  products,
  services,
  onSubmit,
  isPending,
  vendorId,
  isPro,
  handleProAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  employees: Employee[];
  products: VendorProduct[];
  services: VendorCatalogue[];
  onSubmit: (data: z.infer<typeof insertLeadSchema>) => void;
  isPending: boolean;
  vendorId: string;
  isPro?: boolean;
  handleProAction?: (action: string, callback: () => void) => void;
}) {
  const formSchema = insertLeadSchema.extend({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Valid phone required"),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorId: vendorId,
      name: "",
      phone: "",
      email: "",
      source: "offline",
      status: "new",
      priority: "medium",
      notes: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        ...lead,
        email: lead.email || "",
        address: (lead as any).address || "",
      });
    } else {
      form.reset({
        vendorId: vendorId,
        name: "",
        phone: "",
        email: "",
        source: "offline",
        status: "new",
        priority: "medium",
        notes: "",
      });
    }
  }, [lead, form, vendorId]);

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    const performSubmit = () => {
      onSubmit(data);
      form.reset();
    };

    if (handleProAction) {
      handleProAction(lead ? 'update' : 'create', performSubmit);
    } else {
      performSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {lead ? "Edit Lead" : "Add Lead"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
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
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
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
                    <Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="mini_website">Mini Web</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="social_media">Social</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.status === "active")
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="What are they interested in?"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                {isPending ? "Saving..." : lead ? "Update" : "Add Lead"}
                {isPro === false && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
