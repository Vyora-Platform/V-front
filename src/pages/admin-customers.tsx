import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X, Phone, Mail, Calendar, IndianRupee, ChevronDown } from "lucide-react";
import type { Customer, Vendor } from "@shared/schema";

const CUSTOMER_TYPE_OPTIONS = [
  { value: "walk-in", label: "Walk-in" },
  { value: "online", label: "Online" },
  { value: "referral", label: "Referral" },
  { value: "corporate", label: "Corporate" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending_followup", label: "Pending Follow-up" },
  { value: "blocked", label: "Blocked" },
];

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSubscriptionStatuses, setSelectedSubscriptionStatuses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all vendors
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (search) params.append("search", search);
    selectedVendors.forEach(v => params.append("vendorIds", v));
    selectedCustomerTypes.forEach(t => params.append("customerType", t));
    selectedStatuses.forEach(s => params.append("status", s));
    selectedSubscriptionStatuses.forEach(s => params.append("subscriptionStatus", s));
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    
    return params.toString();
  };

  // Fetch customers with filters - React Query will refetch when any of these values change
  const { data, isLoading } = useQuery<{ customers: Customer[]; total: number }>({
    queryKey: [
      "/api/admin/customers",
      search,
      selectedVendors,
      selectedCustomerTypes,
      selectedStatuses,
      selectedSubscriptionStatuses,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(getApiUrl(`/api/admin/customers?${queryString}`));
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;

  // Toggle multi-select
  const toggleSelection = (array: string[], setter: (val: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSelectedVendors([]);
    setSelectedCustomerTypes([]);
    setSelectedStatuses([]);
    setSelectedSubscriptionStatuses([]);
    setStartDate("");
    setEndDate("");
  };

  // Get vendor name
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.businessName || vendorId;
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/10 text-green-500",
      inactive: "bg-gray-500/10 text-gray-500",
      pending_followup: "bg-yellow-500/10 text-yellow-500",
      blocked: "bg-red-500/10 text-red-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  // Subscription status badge color
  const getSubscriptionColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/10 text-emerald-500",
      expired: "bg-orange-500/10 text-orange-500",
      suspended: "bg-red-500/10 text-red-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="container mx-auto p-4 md:p-6 pb-16 md:pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">All Customers</h1>
          <p className="text-muted-foreground mt-1">
            Aggregated customers from all vendors • {total} total
          </p>
        </div>
      </div>

      {/* Enterprise-Level Filters - Single Row */}
      <Card>
        <CardContent className="pt-6">
          {/* Top Row: Search + Main Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-customers"
              />
            </div>

            {/* Vendor Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[180px] justify-between" data-testid="dropdown-vendors">
                  <span className="truncate">
                    {selectedVendors.length > 0 ? `Vendors (${selectedVendors.length})` : "All Vendors"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vendor-${vendor.id}`}
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={() => toggleSelection(selectedVendors, setSelectedVendors, vendor.id)}
                        data-testid={`checkbox-vendor-${vendor.id}`}
                      />
                      <label htmlFor={`vendor-${vendor.id}`} className="text-sm cursor-pointer flex-1">
                        {vendor.businessName}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Customer Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[160px] justify-between" data-testid="dropdown-customer-type">
                  <span className="truncate">
                    {selectedCustomerTypes.length > 0 ? `Type (${selectedCustomerTypes.length})` : "All Types"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3" align="start">
                <div className="space-y-2">
                  {CUSTOMER_TYPE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`customer-type-${option.value}`}
                        checked={selectedCustomerTypes.includes(option.value)}
                        onCheckedChange={() => toggleSelection(selectedCustomerTypes, setSelectedCustomerTypes, option.value)}
                        data-testid={`checkbox-customer-type-${option.value}`}
                      />
                      <label htmlFor={`customer-type-${option.value}`} className="text-sm cursor-pointer flex-1">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[160px] justify-between" data-testid="dropdown-status">
                  <span className="truncate">
                    {selectedStatuses.length > 0 ? `Status (${selectedStatuses.length})` : "All Status"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3" align="start">
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={selectedStatuses.includes(option.value)}
                        onCheckedChange={() => toggleSelection(selectedStatuses, setSelectedStatuses, option.value)}
                        data-testid={`checkbox-status-${option.value}`}
                      />
                      <label htmlFor={`status-${option.value}`} className="text-sm cursor-pointer flex-1">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* More Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[140px]" data-testid="button-more-filters">
                  <Filter className="w-4 h-4 mr-2" />
                  More
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-4" align="start">
                <div className="space-y-4">
                  {/* Subscription Status Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subscription Status</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" size="sm" data-testid="dropdown-subscription">
                          {selectedSubscriptionStatuses.length > 0 ? `${selectedSubscriptionStatuses.length} selected` : "All"}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-3" align="start">
                        <div className="space-y-2">
                          {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`subscription-${option.value}`}
                                checked={selectedSubscriptionStatuses.includes(option.value)}
                                onCheckedChange={() => toggleSelection(selectedSubscriptionStatuses, setSelectedSubscriptionStatuses, option.value)}
                                data-testid={`checkbox-subscription-${option.value}`}
                              />
                              <label htmlFor={`subscription-${option.value}`} className="text-sm cursor-pointer flex-1">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm"
                        placeholder="Start"
                        data-testid="input-start-date"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-sm"
                        placeholder="End"
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters Button */}
            {(selectedVendors.length > 0 || selectedCustomerTypes.length > 0 || selectedStatuses.length > 0 || 
              selectedSubscriptionStatuses.length > 0 || startDate || endDate || search) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="w-full lg:w-auto"
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Bottom Row: Sort Options */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9" data-testid="select-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="totalSpent">Total Spent</SelectItem>
                <SelectItem value="lastVisit">Last Visit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as "asc" | "desc")}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-sort-order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No customers found matching the filters
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{getVendorName(customer.vendorId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{customer.customerType.replace(/-/g, " ")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.subscriptionStatus ? (
                          <Badge className={getSubscriptionColor(customer.subscriptionStatus)}>
                            {customer.subscriptionStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.totalSpent !== null && customer.totalSpent !== undefined ? (
                          <div className="flex items-center gap-1 font-medium">
                            <IndianRupee className="w-3 h-3" />
                            {Number(customer.totalSpent).toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">₹0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(customer.createdAt).toLocaleDateString()}
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
    </div>
  );
}
