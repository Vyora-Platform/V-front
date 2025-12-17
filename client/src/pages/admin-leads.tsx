import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Filter, X, Phone, Mail, Calendar, Award, ChevronDown } from "lucide-react";
import type { Lead, Vendor, Employee } from "@shared/schema";
import { getApiUrl } from "@/lib/config";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const SOURCE_OPTIONS = [
  { value: "offline", label: "Offline" },
  { value: "website", label: "Website" },
  { value: "mini_website", label: "Mini Website" },
  { value: "social_media", label: "Social Media" },
  { value: "phone", label: "Phone" },
  { value: "referral", label: "Referral" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function AdminLeadsPage() {
  const [search, setSearch] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [leadScoreMin, setLeadScoreMin] = useState<string>("");
  const [leadScoreMax, setLeadScoreMax] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all vendors
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Get unique categories from vendors
  const uniqueCategories = Array.from(
    new Set(
      vendors.map(v => v.customCategory || v.category).filter(Boolean)
    )
  ).sort();

  // Fetch all employees from all vendors
  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees/all"],
    queryFn: async () => {
      const employees: Employee[] = [];
      for (const vendor of vendors) {
        const response = await fetch(`/api/vendors/${vendor.id}/employees`);
        if (response.ok) {
          const vendorEmployees = await response.json();
          employees.push(...vendorEmployees);
        }
      }
      return employees;
    },
    enabled: vendors.length > 0,
  });

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (search) params.append("search", search);
    selectedVendors.forEach(v => params.append("vendorIds", v));
    selectedCategories.forEach(c => params.append("categories", c));
    selectedStatuses.forEach(s => params.append("status", s));
    selectedSources.forEach(s => params.append("source", s));
    selectedPriorities.forEach(p => params.append("priority", p));
    selectedEmployees.forEach(e => params.append("assignedEmployeeIds", e));
    if (leadScoreMin) params.append("leadScoreMin", leadScoreMin);
    if (leadScoreMax) params.append("leadScoreMax", leadScoreMax);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    
    return params.toString();
  };

  // Fetch leads with filters - React Query will refetch when any of these values change
  const { data, isLoading } = useQuery<{ leads: Lead[]; total: number }>({
    queryKey: [
      "/api/admin/leads",
      search,
      selectedVendors,
      selectedCategories,
      selectedStatuses,
      selectedSources,
      selectedPriorities,
      selectedEmployees,
      leadScoreMin,
      leadScoreMax,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const url = `/api/admin/leads?${queryString}`;
      const fullUrl = getApiUrl(url);
      const response = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: vendors.length > 0, // Only fetch leads after vendors are loaded
  });

  const leads = data?.leads || [];
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
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSelectedSources([]);
    setSelectedPriorities([]);
    setSelectedEmployees([]);
    setLeadScoreMin("");
    setLeadScoreMax("");
    setStartDate("");
    setEndDate("");
  };

  // Get employee name with vendor context
  const getEmployeeName = (employeeId: string) => {
    const employee = allEmployees.find(e => e.id === employeeId);
    if (!employee) return employeeId;
    const vendor = vendors.find(v => v.id === employee.vendorId);
    return `${employee.name} (${vendor?.businessName || employee.vendorId})`;
  };

  // Get vendor name
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.businessName || vendorId;
  };

  // Get vendor category - Leads inherit category from their vendor
  const getVendorCategory = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return "-";
    // Return custom category if exists, otherwise return standard category
    const category = vendor.customCategory || vendor.category;
    return category || "-";
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-500",
      contacted: "bg-yellow-500/10 text-yellow-500",
      interested: "bg-green-500/10 text-green-500",
      converted: "bg-emerald-500/10 text-emerald-500",
      lost: "bg-red-500/10 text-red-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500/10 text-gray-500",
      medium: "bg-blue-500/10 text-blue-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
    };
    return colors[priority] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="container mx-auto p-4 md:p-6 pb-16 md:pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">All Leads</h1>
          <p className="text-muted-foreground mt-1">
            Aggregated leads from all vendors • {total} total
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
                placeholder="Search by name, phone, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-leads"
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

            {/* Category Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[180px] justify-between" data-testid="dropdown-categories">
                  <span className="truncate">
                    {selectedCategories.length > 0 ? `Categories (${selectedCategories.length})` : "All Categories"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-3" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {uniqueCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => toggleSelection(selectedCategories, setSelectedCategories, category)}
                        data-testid={`checkbox-category-${category}`}
                      />
                      <label htmlFor={`category-${category}`} className="text-sm cursor-pointer flex-1 capitalize">
                        {category}
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

            {/* Source Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[160px] justify-between" data-testid="dropdown-source">
                  <span className="truncate">
                    {selectedSources.length > 0 ? `Source (${selectedSources.length})` : "All Sources"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {SOURCE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${option.value}`}
                        checked={selectedSources.includes(option.value)}
                        onCheckedChange={() => toggleSelection(selectedSources, setSelectedSources, option.value)}
                        data-testid={`checkbox-source-${option.value}`}
                      />
                      <label htmlFor={`source-${option.value}`} className="text-sm cursor-pointer flex-1">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Priority Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[160px] justify-between" data-testid="dropdown-priority">
                  <span className="truncate">
                    {selectedPriorities.length > 0 ? `Priority (${selectedPriorities.length})` : "All Priority"}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-3" align="start">
                <div className="space-y-2">
                  {PRIORITY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${option.value}`}
                        checked={selectedPriorities.includes(option.value)}
                        onCheckedChange={() => toggleSelection(selectedPriorities, setSelectedPriorities, option.value)}
                        data-testid={`checkbox-priority-${option.value}`}
                      />
                      <label htmlFor={`priority-${option.value}`} className="text-sm cursor-pointer flex-1">
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
                  {/* Employee Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assigned Employees</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" size="sm" data-testid="dropdown-employees">
                          {selectedEmployees.length > 0 ? `${selectedEmployees.length} selected` : "All Employees"}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-3" align="start">
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                          {allEmployees.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No employees found</p>
                          ) : (
                            allEmployees.map((employee) => (
                              <div key={employee.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`employee-${employee.id}`}
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={() => toggleSelection(selectedEmployees, setSelectedEmployees, employee.id)}
                                  data-testid={`checkbox-employee-${employee.id}`}
                                />
                                <label htmlFor={`employee-${employee.id}`} className="text-sm cursor-pointer flex-1">
                                  {getEmployeeName(employee.id)}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Lead Score Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Lead Score Range (0-100)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Min"
                        value={leadScoreMin}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                            setLeadScoreMin(val);
                          }
                        }}
                        className="text-sm"
                        data-testid="input-lead-score-min"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Max"
                        value={leadScoreMax}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                            setLeadScoreMax(val);
                          }
                        }}
                        className="text-sm"
                        data-testid="input-lead-score-max"
                      />
                    </div>
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
            {(selectedVendors.length > 0 || selectedCategories.length > 0 || selectedStatuses.length > 0 || selectedSources.length > 0 || 
              selectedPriorities.length > 0 || selectedEmployees.length > 0 || leadScoreMin || leadScoreMax || 
              startDate || endDate || search) && (
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
                <SelectItem value="leadScore">Lead Score</SelectItem>
                <SelectItem value="nextFollowUpDate">Next Follow-up</SelectItem>
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

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No leads found matching the filters
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{getVendorName(lead.vendorId)}</TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{getVendorCategory(lead.vendorId)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{lead.source.replace(/_/g, " ")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.leadScore !== null && lead.leadScore !== undefined ? (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{lead.leadScore}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.createdAt).toLocaleDateString()}
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
