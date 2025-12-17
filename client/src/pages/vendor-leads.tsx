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
    <div className="flex h-full w-full flex-col bg-gray-50/50 overflow-hidden">
      {/* Header - Fixed */}
      <div className="px-3 sm:px-4 py-3 bg-white border-b shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/dashboard")}
              className="h-9 w-9 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600 hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Leads</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-9 w-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddNew} size="sm" className="bg-blue-600 hover:bg-blue-700 h-9">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stats Dashboard */}
        <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-white border-b">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-600 font-medium">Total</p>
              <p className="text-xl md:text-3xl font-bold text-blue-700">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-cyan-600 font-medium">New</p>
              <p className="text-xl md:text-3xl font-bold text-cyan-700">{stats.new}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-amber-600 font-medium">Contacted</p>
              <p className="text-xl md:text-3xl font-bold text-amber-700">{stats.contacted}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-purple-600 font-medium">Interested</p>
              <p className="text-xl md:text-3xl font-bold text-purple-700">{stats.interested}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-emerald-600 font-medium">Converted</p>
              <p className="text-xl md:text-3xl font-bold text-emerald-700">{stats.converted}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm text-rose-600 font-medium">Rate</p>
              <p className="text-xl md:text-3xl font-bold text-rose-700">{stats.conversionRate}%</p>
            </div>
          </div>

          {/* Pipeline Progress */}
          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-1 h-2 md:h-3 rounded-full overflow-hidden bg-gray-200">
              <div className="bg-cyan-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.new / stats.total) * 100 : 0}%` }} />
              <div className="bg-amber-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.contacted / stats.total) * 100 : 0}%` }} />
              <div className="bg-purple-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.interested / stats.total) * 100 : 0}%` }} />
              <div className="bg-emerald-500 transition-all" style={{ width: `${stats.total > 0 ? (stats.converted / stats.total) * 100 : 0}%` }} />
              <div className="bg-red-400 transition-all" style={{ width: `${stats.total > 0 ? (stats.lost / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3 bg-white border-b sticky top-0 z-10 space-y-2">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 md:h-10 text-sm bg-gray-50 w-full"
            />
          </div>
          
          {/* Filters Row */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[100px] md:w-[120px] h-9 text-xs bg-gray-50 flex-shrink-0">
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
              <SelectTrigger className="w-[100px] md:w-[120px] h-9 text-xs bg-gray-50 flex-shrink-0">
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
              <SelectTrigger className="w-[100px] md:w-[120px] h-9 text-xs bg-gray-50 flex-shrink-0">
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
              <SelectTrigger className="w-[110px] md:w-[130px] h-9 text-xs bg-gray-50 flex-shrink-0">
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
        <div className="px-3 sm:px-4 py-3">
          <p className="text-xs text-gray-500 mb-2">{filteredLeads.length} leads</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm text-center">
                  {searchQuery ? "No leads found" : "No leads yet"}
                </p>
                <Button onClick={handleAddNew} size="sm" className="mt-3 bg-blue-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Lead
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
                  onEdit={handleEdit}
                  onDelete={deleteMutation.mutate}
                  onStatusChange={(status) => statusMutation.mutate({ id: lead.id, status })}
                  onViewDetails={handleViewDetails}
                  Avatar={Avatar}
                  StatusBadge={StatusBadge}
                  PriorityBadge={PriorityBadge}
                  SourceBadge={SourceBadge}
                  vendorId={vendorId}
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
      />

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        lead={selectedLead}
        employees={employees}
        onEdit={handleEdit}
        onStatusChange={(status) => selectedLead && statusMutation.mutate({ id: selectedLead.id, status })}
        Avatar={Avatar}
        StatusBadge={StatusBadge}
        PriorityBadge={PriorityBadge}
        SourceBadge={SourceBadge}
        vendorId={vendorId}
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
}) {
  const assignedEmployee = employees.find((e) => e.id === lead.assignedEmployeeId);
  const createdDate = new Date(lead.createdAt);
  const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });

  return (
    <Card className="border-0 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      <CardContent className="p-3 sm:p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          <Avatar name={lead.name} size="md" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo}</span>
            </div>

            {/* Contact Info */}
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {lead.phone}
              </p>
              {lead.email && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{lead.email}</span>
                </p>
              )}
              {(lead as any).address && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{(lead as any).address}</span>
                </p>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              {assignedEmployee && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {assignedEmployee.name}
                </span>
              )}
              {lead.estimatedBudget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ₹{lead.estimatedBudget.toLocaleString()}
                </span>
              )}
              <SourceBadge source={lead.source} />
            </div>

            {/* Interest */}
            {lead.interestDescription && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-1">
                Interest: {lead.interestDescription}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons - Inside Card */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`tel:${lead.phone}`, '_self')}
            className="flex-1 h-9 text-xs"
          >
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="ml-1 hidden sm:inline">Call</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')}
            className="flex-1 h-9 text-xs"
          >
            <FaWhatsapp className="h-4 w-4 text-green-600" />
            <span className="ml-1 hidden sm:inline">WhatsApp</span>
          </Button>
          {lead.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
              className="flex-1 h-9 text-xs"
            >
              <Mail className="h-4 w-4 text-purple-600" />
              <span className="ml-1 hidden sm:inline">Mail</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(lead)}
            className="flex-1 h-9 text-xs"
          >
            <Eye className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">View</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange("new")}>
                <Sparkles className="h-4 w-4 mr-2 text-cyan-600" />
                New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("contacted")}>
                <PhoneCall className="h-4 w-4 mr-2 text-amber-600" />
                Contacted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("interested")}>
                <Star className="h-4 w-4 mr-2 text-purple-600" />
                Interested
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("converted")}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                Converted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("lost")}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Lost
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
}) {
  const { toast } = useToast();
  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3">
          <div className="flex items-start gap-3">
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
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
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

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2">
            {assignedEmployee && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Assigned To</p>
                <p className="text-sm font-medium truncate">{assignedEmployee.name}</p>
              </div>
            )}
            {lead.estimatedBudget && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium">₹{lead.estimatedBudget.toLocaleString()}</p>
              </div>
            )}
            {lead.nextFollowUpDate && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Follow-up</p>
                <p className="text-sm font-medium">{format(new Date(lead.nextFollowUpDate), "MMM d")}</p>
              </div>
            )}
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-sm font-medium capitalize">{lead.source.replace("_", " ")}</p>
            </div>
          </div>

          {/* Interest & Notes */}
          {lead.interestDescription && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Interest</p>
              <p className="text-sm text-gray-700">{lead.interestDescription}</p>
            </div>
          )}
          {lead.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-700">{lead.notes}</p>
            </div>
          )}

          {/* Communication History */}
          <CommunicationHistory leadId={lead.id} />

          {/* Tasks */}
          <LeadTasks leadId={lead.id} />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onEdit(lead)} className="w-full sm:w-auto">
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            onClick={() => convertMutation.mutate()}
            disabled={convertMutation.isPending || lead.status === "converted"}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {convertMutation.isPending ? "Converting..." : lead.status === "converted" ? "Converted" : "Convert"}
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
    onSubmit(data);
    form.reset();
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
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
