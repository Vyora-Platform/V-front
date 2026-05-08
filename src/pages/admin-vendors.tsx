import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Search, CreditCard, Users, Calendar, Crown, Shield, Ban, CheckCircle2 } from "lucide-react";
import type { Vendor, VendorSubscription, SubscriptionPlan, BillingHistory } from "@shared/schema";
import { format } from "date-fns";

type VendorWithSubscription = Vendor & {
  subscription?: VendorSubscription;
  plan?: SubscriptionPlan;
};

export default function AdminVendors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorWithSubscription | null>(null);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  // Fetch all vendors from vendors table
  const { data: vendors = [], isLoading: vendorsLoading, error: vendorsError } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch all vendor subscriptions from vendor_subscriptions table
  const { data: subscriptions = [], isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery<VendorSubscription[]>({
    queryKey: ["/api/vendors/subscription"],
  });

  // Fetch all subscription plans
  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const isLoading = vendorsLoading || subscriptionsLoading || plansLoading;
  const hasError = vendorsError || subscriptionsError || plansError;

  // Fetch billing history for selected vendor
  const { data: billingHistory = [] } = useQuery<BillingHistory[]>({
    queryKey: [`/api/vendors/${selectedVendor?.id}/billing-history`],
    enabled: !!selectedVendor && billingDialogOpen,
  });

  // Combine vendors with their subscriptions and plans
  const vendorsWithSubscriptions: VendorWithSubscription[] = vendors.map(vendor => {
    const subscription = subscriptions.find(s => s.vendorId === vendor.id);
    const plan = subscription ? plans.find(p => p.id === subscription.planId) : undefined;
    return { ...vendor, subscription, plan };
  });

  // Filter vendors (only by search and vendor status, not subscription status)
  const filteredVendors = vendorsWithSubscriptions.filter(vendor => {
    const matchesSearch = 
      vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by vendor status instead of subscription status
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const getStatusBadge = (subscription?: VendorSubscription) => {
    if (!subscription) {
      return <Badge variant="secondary">No Subscription</Badge>;
    }

    const statusColors: Record<string, string> = {
      trial: "bg-blue-500",
      active: "bg-green-500",
      past_due: "bg-yellow-500",
      canceled: "bg-gray-500",
      expired: "bg-red-500",
    };

    return (
      <Badge className={statusColors[subscription.status] || "bg-gray-500"}>
        {subscription.status.toUpperCase()}
      </Badge>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading vendors...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
          <div className="text-red-600 text-sm space-y-1">
            {vendorsError && (
              <p>Vendors: {vendorsError instanceof Error ? vendorsError.message : 'Failed to fetch'}</p>
            )}
            {subscriptionsError && (
              <p>Subscriptions: {subscriptionsError instanceof Error ? subscriptionsError.message : 'Failed to fetch'}</p>
            )}
            {plansError && (
              <p>Plans: {plansError instanceof Error ? plansError.message : 'Failed to fetch'}</p>
            )}
          </div>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
              queryClient.invalidateQueries({ queryKey: ["/api/vendors/subscription"] });
              queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Vendor Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all vendors, subscriptions, and billing
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Vendors</div>
          <div className="text-2xl font-bold">{vendors.length}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {subscriptions.filter(s => s.status === "trial").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vendors.filter(v => v.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-vendors"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Vendor Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vendors ({filteredVendors.length})</CardTitle>
          <CardDescription>Comprehensive vendor list with subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription Plan</TableHead>
                  <TableHead>Sub. Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading vendors...
                    </TableCell>
                  </TableRow>
                ) : filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No vendors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                      <TableCell>
                        <div className="font-medium">{vendor.businessName}</div>
                        <div className="text-sm text-muted-foreground">{vendor.email}</div>
                      </TableCell>
                      <TableCell>{vendor.ownerName}</TableCell>
                      <TableCell>
                        <div className="text-sm">{vendor.category}</div>
                        <div className="text-xs text-muted-foreground">{vendor.subcategory}</div>
                      </TableCell>
                      <TableCell>
                        {vendor.status === "approved" && <Badge variant="default">Approved</Badge>}
                        {vendor.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                        {vendor.status === "suspended" && <Badge variant="destructive">Suspended</Badge>}
                      </TableCell>
                      <TableCell>
                        {vendor.plan ? (
                          <div className="flex items-center gap-2">
                            {vendor.plan.isPopular && <Crown className="h-4 w-4 text-yellow-500" />}
                            <span className="font-medium">{vendor.plan.displayName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No Plan</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.subscription)}</TableCell>
                      <TableCell>
                        {vendor.subscription?.currentPeriodEnd ? (
                          <span className="text-sm">
                            {format(new Date(vendor.subscription.currentPeriodEnd), "MMM dd, yyyy")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setBillingDialogOpen(true);
                            }}
                            data-testid={`button-billing-${vendor.id}`}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          {vendor.status === "pending" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateVendorMutation.mutate({ vendorId: vendor.id, status: "approved" })}
                              data-testid={`button-approve-${vendor.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {vendor.status === "approved" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateVendorMutation.mutate({ vendorId: vendor.id, status: "suspended" })}
                              data-testid={`button-suspend-${vendor.id}`}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Billing History Dialog */}
      <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Billing History - {selectedVendor?.businessName}</DialogTitle>
            <DialogDescription>
              Complete payment history and subscription details
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-4">
              {/* Current Subscription */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Current Subscription</h3>
                {selectedVendor.subscription && selectedVendor.plan ? (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="ml-2 font-medium">{selectedVendor.plan.displayName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2 font-medium">₹{selectedVendor.plan.price}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedVendor.subscription)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Renews:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(selectedVendor.subscription.currentPeriodEnd), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active subscription</p>
                )}
              </div>

              {/* Billing History */}
              <div>
                <h3 className="font-semibold mb-2">Payment History</h3>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
                              {bill.status === "succeeded" && <Badge variant="default">Paid</Badge>}
                              {bill.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                              {bill.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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
