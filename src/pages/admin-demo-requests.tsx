import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  Building2, 
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface DemoRequest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  businessName: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-purple-100 text-purple-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

export default function AdminDemoRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all demo requests
  const { data: requests = [], isLoading, refetch } = useQuery<DemoRequest[]>({
    queryKey: ["/api/demo-requests", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? "/api/demo-requests" 
        : `/api/demo-requests?status=${statusFilter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch demo requests");
      return response.json();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DemoRequest> }) => {
      const response = await fetch(`/api/demo-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demo-requests"] });
      toast({ title: "Updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/demo-requests/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demo-requests"] });
      toast({ title: "Deleted successfully" });
      setIsViewDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
    },
  });

  // Filter requests by search
  const filteredRequests = requests.filter((req) => {
    const searchLower = search.toLowerCase();
    return (
      req.name.toLowerCase().includes(searchLower) ||
      req.phone.includes(search) ||
      (req.email && req.email.toLowerCase().includes(searchLower)) ||
      (req.businessName && req.businessName.toLowerCase().includes(searchLower))
    );
  });

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return statusOption ? (
      <Badge className={`${statusOption.color} hover:${statusOption.color}`}>
        {statusOption.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewRequest = (request: DemoRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || "");
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (selectedRequest) {
      const updates: Partial<DemoRequest> = { status };
      if (status === "completed") {
        updates.completedAt = new Date().toISOString();
      }
      updateMutation.mutate({ id: selectedRequest.id, updates });
      setSelectedRequest({ ...selectedRequest, status });
    }
  };

  const handleSaveNotes = () => {
    if (selectedRequest) {
      updateMutation.mutate({ id: selectedRequest.id, updates: { notes } });
    }
  };

  // Stats
  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    scheduled: requests.filter((r) => r.status === "scheduled").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Demo Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage demo booking requests from the landing page
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
            <p className="text-sm text-blue-600 font-medium">Total Requests</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-700">{stats.new}</div>
            <p className="text-sm text-yellow-600 font-medium">New</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-700">{stats.contacted}</div>
            <p className="text-sm text-orange-600 font-medium">Contacted</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-700">{stats.scheduled}</div>
            <p className="text-sm text-purple-600 font-medium">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-700">{stats.completed}</div>
            <p className="text-sm text-green-600 font-medium">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, email, or business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No demo requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <a href={`tel:${request.phone}`} className="text-blue-600 hover:underline">
                              {request.phone}
                            </a>
                          </div>
                          {request.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                                {request.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.businessName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {request.businessName}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.source?.replace("_", " ") || "landing_page"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(request.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Demo Request Details</DialogTitle>
            <DialogDescription>
              View and manage this demo request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{selectedRequest.name}</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${selectedRequest.phone}`} className="text-blue-600 hover:underline">
                    {selectedRequest.phone}
                  </a>
                </div>
                {selectedRequest.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <a href={`mailto:${selectedRequest.email}`} className="text-blue-600 hover:underline">
                      {selectedRequest.email}
                    </a>
                  </div>
                )}
                {selectedRequest.businessName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>{selectedRequest.businessName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Submitted: {formatDate(selectedRequest.createdAt)}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedRequest.status === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdateStatus(status.value)}
                      disabled={updateMutation.isPending}
                    >
                      {status.value === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {status.value === "cancelled" && <XCircle className="w-3 h-3 mr-1" />}
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this demo request..."
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={updateMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedRequest && deleteMutation.mutate(selectedRequest.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

