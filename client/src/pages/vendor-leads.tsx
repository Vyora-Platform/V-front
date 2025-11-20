import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, type Lead, type Employee, type LeadCommunication, type LeadTask, type VendorProduct, type VendorCatalogue } from "@shared/schema";
import { z } from "zod";
import { Plus, Search, Phone, Mail, Calendar, User, Briefcase, TrendingUp, MessageSquare, CheckCircle2, XCircle, Clock, Target, ArrowLeft } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorLeads() {
  const { vendorId } = useAuth(); // Get real vendor ID from localStorage
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/vendors", vendorId, "leads", selectedStatus, selectedSource, selectedEmployee],
    enabled: !!vendorId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedSource !== "all") params.append("source", selectedSource);
      if (selectedEmployee !== "all") params.append("assignedEmployeeId", selectedEmployee);
      
      const query = params.toString();
      const url = `/api/vendors/${vendorId}/leads${query ? `?${query}` : ""}`;
      const fullUrl = getApiUrl(url);
      const response = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch leads');
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
      setIsAddDialogOpen(false);
      setEditingLead(null);
      toast({
        title: editingLead ? "Lead updated" : "Lead created",
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
      toast({
        title: "Status updated",
        description: "Lead status updated successfully",
      });
    },
  });

  // Filter leads by search
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsAddDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
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
            <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">Leads</h1>
            <p className="text-xs text-muted-foreground">Track sales leads</p>
          </div>
        </div>
        <Button size="sm" onClick={handleAddNew} data-testid="button-add-lead">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{leads.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">New</p>
            <p className="text-lg font-bold text-blue-600">{leads.filter((l) => l.status === "new").length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Contacted</p>
            <p className="text-lg font-bold text-yellow-600">{leads.filter((l) => l.status === "contacted").length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Interested</p>
            <p className="text-lg font-bold text-purple-600">{leads.filter((l) => l.status === "interested").length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Converted</p>
            <p className="text-lg font-bold text-green-600">{leads.filter((l) => l.status === "converted").length}</p>
          </Card>
        </div>
      </div>

      {/* Filters and Search - Horizontal Scroll */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="relative flex-1 min-w-[200px] snap-start">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-leads"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-filter-source">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="mini_website">Mini Website</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-filter-employee">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
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
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Leads ({filteredLeads.length})</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-8 text-center border rounded-lg">
            <p className="text-muted-foreground" data-testid="text-no-leads">
              {searchQuery ? "No leads found matching your search" : "No leads yet. Click 'Add Lead' to get started."}
            </p>
          </div>
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
              />
            ))}
          </div>
        )}
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
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {

  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Lead Card Component
function LeadCard({
  lead,
  employees,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  lead: Lead;
  employees: Employee[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: string) => void;
}) {
  const assignedEmployee = employees.find((e) => e.id === lead.assignedEmployeeId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      new: { variant: "default", label: "New" },
      contacted: { variant: "secondary", label: "Contacted" },
      interested: { variant: "outline", label: "Interested" },
      converted: { variant: "default", label: "Converted" },
      lost: { variant: "destructive", label: "Lost" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    return <Badge variant="outline">{source.replace("_", " ")}</Badge>;
  };

  return (
    <Card data-testid={`card-lead-${lead.id}`} className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg md:text-xl" data-testid={`text-lead-name-${lead.id}`}>
                {lead.name}
              </CardTitle>
              {getStatusBadge(lead.status)}
              {getSourceBadge(lead.source)}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4 text-primary" />
                  {lead.phone}
                </span>
                {lead.email && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {lead.email}
                  </span>
                )}
              </div>
              
              {assignedEmployee && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Assigned to: <span className="font-medium text-foreground">{assignedEmployee.name}</span>
                </span>
              )}
              
              {lead.interestDescription && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Interest: <span className="text-foreground">{lead.interestDescription}</span>
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${lead.phone}`, '_self')}
                className="gap-2"
                data-testid={`button-call-${lead.id}`}
              >
                <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                className="gap-2"
                data-testid={`button-whatsapp-${lead.id}`}
              >
                <FaWhatsapp className="h-4 w-4 text-green-600 dark:text-green-400" />
                WhatsApp
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(lead)} 
              data-testid={`button-edit-lead-${lead.id}`}
              className="whitespace-nowrap"
            >
              Edit
            </Button>
            {lead.status !== "converted" && lead.status !== "lost" && (
              <Select value={lead.status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-32" data-testid={`select-status-${lead.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Lead Details - Always Open */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Lead Details & Actions
          </h3>
          
          {/* Lead Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
            {lead.priority && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="outline" className="ml-2">{lead.priority}</Badge>
              </div>
            )}
            {lead.nextFollowUpDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next Follow-up:</span>
                <span className="font-medium">{format(new Date(lead.nextFollowUpDate), "MMM dd, yyyy")}</span>
              </div>
            )}
            {lead.estimatedBudget && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Est. Budget:</span>
                <span className="font-medium">₹{lead.estimatedBudget.toLocaleString()}</span>
              </div>
            )}
            {lead.preferredContactMethod && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contact Pref:</span>
                <span className="font-medium capitalize">{lead.preferredContactMethod}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes:
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{lead.notes}</p>
            </div>
          )}

          {/* Communication History */}
          <CommunicationHistory leadId={lead.id} />

          {/* Lead Tasks */}
          <LeadTasks leadId={lead.id} />

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t flex-wrap">
            <ConvertLeadButton lead={lead} />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to delete this lead?")) {
                  onDelete(lead.id);
                }
              }}
              data-testid={`button-delete-lead-${lead.id}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Delete Lead
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Communication History Component
function CommunicationHistory({ leadId }: { leadId: string }) {
  const { data: communications = [] } = useQuery<LeadCommunication[]>({
    queryKey: ["/api/leads", leadId, "communications"],
  });

  if (communications.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No communications logged yet
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Communication History
      </p>
      <div className="space-y-2">
        {communications.slice(0, 3).map((comm) => (
          <div key={comm.id} className="text-sm border-l-2 pl-3 py-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{comm.type}</Badge>
              <span className="text-muted-foreground text-xs">
                {format(new Date(comm.createdAt), "MMM dd, yyyy")}
              </span>
            </div>
            <p className="mt-1">{comm.notes}</p>
          </div>
        ))}
        {communications.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{communications.length - 3} more communications
          </p>
        )}
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

  if (pendingTasks.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">Pending Tasks ({pendingTasks.length})</p>
      <div className="space-y-1">
        {pendingTasks.slice(0, 2).map((task) => (
          <div key={task.id} className="text-sm flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{task.title}</span>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                (Due: {format(new Date(task.dueDate), "MMM dd")})
              </span>
            )}
          </div>
        ))}
        {pendingTasks.length > 2 && (
          <p className="text-xs text-muted-foreground">+{pendingTasks.length - 2} more</p>
        )}
      </div>
    </div>
  );
}

// Convert Lead Button Component
function ConvertLeadButton({ lead }: { lead: Lead }) {
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create a customer from the lead data
      const customerData = {
        vendorId: vendorId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || undefined,
        address: lead.notes || undefined, // Use notes as address if available
      };
      
      const customerResponse = await apiRequest("POST", `/api/vendors/${vendorId}/customers`, customerData);
      const customer = await customerResponse.json();
      
      // Step 2: Convert the lead with the customer ID
      await apiRequest("POST", `/api/leads/${lead.id}/convert`, { 
        customerId: customer.id 
      });
      
      return customer;
    },
    onSuccess: () => {
      // Invalidate both leads and customers queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "customers"] });
      toast({
        title: "Lead Converted",
        description: `${lead.name} has been converted to a customer`,
      });
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Failed to convert lead to customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => convertMutation.mutate()}
      disabled={convertMutation.isPending || lead.status === "converted"}
      data-testid={`button-convert-lead-${lead.id}`}
    >
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {convertMutation.isPending ? "Converting..." : lead.status === "converted" ? "Converted" : "Convert to Customer"}
    </Button>
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
    phone: z.string().min(10, "Valid phone number required"),
    email: z.string().email().optional().or(z.literal("")),
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

  // Reset form when lead changes (for editing)
  useEffect(() => {
    if (lead) {
      form.reset({
        ...lead,
        email: lead.email || "",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
          <DialogDescription>
            {lead ? "Update lead information" : "Capture a new sales lead"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-lead-name" />
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
                      <Input {...field} data-testid="input-lead-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={field.value || ""} data-testid="input-lead-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lead-source">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="offline">Offline Walk-in</SelectItem>
                        <SelectItem value="website">Website Form</SelectItem>
                        <SelectItem value="mini_website">Mini Website</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
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
                        <SelectTrigger data-testid="select-lead-priority">
                          <SelectValue placeholder="Select priority" />
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
                  <FormLabel>Assign to Employee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-lead-employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.status === "active")
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.role}
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
                  <FormLabel>Interest / Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="What is the lead interested in?"
                      data-testid="textarea-lead-interest"
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
                      placeholder="Additional notes about the lead"
                      data-testid="textarea-lead-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-lead"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-lead">
                {isPending ? "Saving..." : lead ? "Update Lead" : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
