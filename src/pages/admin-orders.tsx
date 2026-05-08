import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Package,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Building2,
  Clock,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  vendorId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  subtotal: number;
  deliveryCharges: number;
  totalAmount: number;
  prescriptionRequired: boolean;
  prescriptionImage?: string;
  notes?: string;
  assignedTo?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  source: string;
  miniWebsiteSubdomain?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
  };
  orderItems?: Array<{
    id: string;
    productName: string;
    productBrand?: string;
    productUnit?: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
}

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [prescriptionFilter, setPrescriptionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch vendors for filter
  const { data: vendorsData } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  // Fetch orders with filters
  const { data: ordersResponse, isLoading } = useQuery<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: [
      "/api/admin/orders",
      page,
      limit,
      searchTerm,
      selectedVendors,
      selectedStatuses,
      selectedPaymentStatuses,
      selectedPaymentMethods,
      selectedSources,
      prescriptionFilter,
      dateRange.from,
      dateRange.to,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedVendors.length > 0) params.append("vendorIds", selectedVendors.join(","));
      if (selectedStatuses.length > 0) params.append("statuses", selectedStatuses.join(","));
      if (selectedPaymentStatuses.length > 0) params.append("paymentStatuses", selectedPaymentStatuses.join(","));
      if (selectedPaymentMethods.length > 0) params.append("paymentMethods", selectedPaymentMethods.join(","));
      if (selectedSources.length > 0) params.append("sources", selectedSources.join(","));
      if (prescriptionFilter !== "all") params.append("prescriptionRequired", prescriptionFilter);
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString());

      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const orders = ordersResponse?.orders || [];
  const totalPages = ordersResponse?.totalPages || 1;

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
    { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800" },
    { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
    { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  ];

  const paymentStatusOptions = [
    { value: "pending", label: "Pending", icon: Clock },
    { value: "paid", label: "Paid", icon: CheckCircle },
    { value: "refunded", label: "Refunded", icon: XCircle },
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash on Delivery" },
    { value: "online", label: "Online Payment" },
    { value: "wallet", label: "Wallet" },
  ];

  const sourceOptions = [
    { value: "manual", label: "Manual" },
    { value: "miniwebsite", label: "Mini Website" },
    { value: "pos", label: "POS" },
    { value: "app", label: "App" },
  ];

  // Toggle selection helpers
  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
    setPage(1);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const togglePaymentStatus = (status: string) => {
    setSelectedPaymentStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
    setPage(1);
  };

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedVendors([]);
    setSelectedStatuses([]);
    setSelectedPaymentStatuses([]);
    setSelectedPaymentMethods([]);
    setSelectedSources([]);
    setPrescriptionFilter("all");
    setDateRange({});
    setPage(1);
  };

  const getStatusBadgeClass = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusIcon = (status: string) => {
    const option = paymentStatusOptions.find(s => s.value === status);
    return option?.icon || Clock;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString()}`;
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedVendors.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedPaymentStatuses.length > 0) count++;
    if (selectedPaymentMethods.length > 0) count++;
    if (selectedSources.length > 0) count++;
    if (prescriptionFilter !== "all") count++;
    if (dateRange.from || dateRange.to) count++;
    return count;
  }, [searchTerm, selectedVendors, selectedStatuses, selectedPaymentStatuses, selectedPaymentMethods, selectedSources, prescriptionFilter, dateRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-teal-600" />
              All Orders
            </h1>
            <p className="text-slate-600 mt-1">Manage and track orders across all vendors</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{ordersResponse?.total || 0}</div>
            <div className="text-sm text-slate-600">Total Orders</div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Row 1: Search, Sort, Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by customer name, phone, email, tracking..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Sort */}
                <div className="grid grid-cols-2 gap-2">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="totalAmount">Total Amount</SelectItem>
                      <SelectItem value="customerName">Customer Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM dd, yyyy")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range: any) => {
                        setDateRange(range || {});
                        setPage(1);
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Row 2: Multi-select filters */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {/* Vendors */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Building2 className="mr-2 h-4 w-4" />
                      Vendors {selectedVendors.length > 0 && `(${selectedVendors.length})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {vendorsData?.map((vendor: any) => (
                        <div key={vendor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`vendor-${vendor.id}`}
                            checked={selectedVendors.includes(vendor.id)}
                            onCheckedChange={() => toggleVendor(vendor.id)}
                          />
                          <label htmlFor={`vendor-${vendor.id}`} className="text-sm cursor-pointer">
                            {vendor.businessName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Order Status */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Package className="mr-2 h-4 w-4" />
                      Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-2">
                      {statusOptions.map((status) => (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status.value}`}
                            checked={selectedStatuses.includes(status.value)}
                            onCheckedChange={() => toggleStatus(status.value)}
                          />
                          <label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer flex-1">
                            {status.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Payment Status */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment {selectedPaymentStatuses.length > 0 && `(${selectedPaymentStatuses.length})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-2">
                      {paymentStatusOptions.map((status) => (
                        <div key={status.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`payment-${status.value}`}
                            checked={selectedPaymentStatuses.includes(status.value)}
                            onCheckedChange={() => togglePaymentStatus(status.value)}
                          />
                          <label htmlFor={`payment-${status.value}`} className="text-sm cursor-pointer flex-1">
                            {status.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Payment Method */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Method {selectedPaymentMethods.length > 0 && `(${selectedPaymentMethods.length})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-2">
                      {paymentMethodOptions.map((method) => (
                        <div key={method.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`method-${method.value}`}
                            checked={selectedPaymentMethods.includes(method.value)}
                            onCheckedChange={() => togglePaymentMethod(method.value)}
                          />
                          <label htmlFor={`method-${method.value}`} className="text-sm cursor-pointer flex-1">
                            {method.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Source */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Filter className="mr-2 h-4 w-4" />
                      Source {selectedSources.length > 0 && `(${selectedSources.length})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-2">
                      {sourceOptions.map((source) => (
                        <div key={source.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`source-${source.value}`}
                            checked={selectedSources.includes(source.value)}
                            onCheckedChange={() => toggleSource(source.value)}
                          />
                          <label htmlFor={`source-${source.value}`} className="text-sm cursor-pointer flex-1">
                            {source.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Prescription Filter */}
                <Select value={prescriptionFilter} onValueChange={(value) => {
                  setPrescriptionFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prescription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="true">Prescription Required</SelectItem>
                    <SelectItem value="false">No Prescription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters & Clear */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-slate-600">
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
              <p className="text-slate-600">
                {activeFiltersCount > 0
                  ? "Try adjusting your filters to see more results"
                  : "No orders have been created yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const PaymentIcon = getPaymentStatusIcon(order.paymentStatus);
              return (
                <Card key={order.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Order Info */}
                      <div className="lg:col-span-8 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-slate-900">
                                Order #{order.id.slice(0, 8)}
                              </h3>
                              <Badge className={getStatusBadgeClass(order.status)}>
                                {order.status}
                              </Badge>
                              {order.prescriptionRequired && (
                                <Badge variant="outline" className="border-orange-300 text-orange-700">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Prescription Required
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(order.createdAt), "MMM dd, yyyy • hh:mm a")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {order.vendor?.businessName || "Unknown Vendor"}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {order.source}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-500" />
                              <div>
                                <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-500" />
                              <div className="text-sm text-slate-700">{order.customerPhone}</div>
                            </div>
                            {order.customerEmail && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <div className="text-sm text-slate-700">{order.customerEmail}</div>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-500" />
                              <div className="text-sm text-slate-700">
                                {order.city}, {order.state} - {order.pincode}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <div className="text-sm text-slate-700">
                              <span className="font-medium">Address: </span>
                              {order.deliveryAddress}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        {order.orderItems && order.orderItems.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-slate-700">Order Items:</div>
                            <div className="space-y-1">
                              {order.orderItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm bg-white rounded p-2 border border-slate-100">
                                  <div>
                                    <span className="font-medium">{item.productName}</span>
                                    {item.productBrand && <span className="text-slate-500"> • {item.productBrand}</span>}
                                    <span className="text-slate-500"> × {item.quantity}</span>
                                    {item.productUnit && <span className="text-slate-500"> ({item.productUnit})</span>}
                                  </div>
                                  <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tracking & Notes */}
                        {(order.trackingNumber || order.notes) && (
                          <div className="space-y-2 text-sm">
                            {order.trackingNumber && (
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-600">Tracking:</span>
                                <span className="font-mono font-medium">{order.trackingNumber}</span>
                              </div>
                            )}
                            {order.notes && (
                              <div className="bg-blue-50 rounded p-2 text-slate-700">
                                <span className="font-medium">Notes: </span>
                                {order.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Payment Info */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 space-y-3">
                          {/* Payment Status */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Payment Status</span>
                            <div className="flex items-center gap-1">
                              <PaymentIcon className={`h-4 w-4 ${
                                order.paymentStatus === 'paid' ? 'text-green-600' :
                                order.paymentStatus === 'refunded' ? 'text-red-600' :
                                'text-yellow-600'
                              }`} />
                              <span className={`text-sm font-medium ${
                                order.paymentStatus === 'paid' ? 'text-green-700' :
                                order.paymentStatus === 'refunded' ? 'text-red-700' :
                                'text-yellow-700'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>

                          {/* Payment Method */}
                          {order.paymentMethod && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Payment Method</span>
                              <span className="font-medium text-slate-900 capitalize">
                                {order.paymentMethod.replace('_', ' ')}
                              </span>
                            </div>
                          )}

                          <div className="border-t border-teal-100 pt-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Subtotal</span>
                              <span className="text-slate-900">{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Delivery Charges</span>
                              <span className="text-slate-900">{formatCurrency(order.deliveryCharges)}</span>
                            </div>
                            <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t border-teal-200">
                              <span className="text-slate-900">Total</span>
                              <span className="text-teal-700">{formatCurrency(order.totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Info */}
                        {(order.estimatedDelivery || order.deliveredAt) && (
                          <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                            {order.estimatedDelivery && (
                              <div>
                                <div className="text-slate-600">Est. Delivery</div>
                                <div className="font-medium text-slate-900">
                                  {format(new Date(order.estimatedDelivery), "MMM dd, yyyy")}
                                </div>
                              </div>
                            )}
                            {order.deliveredAt && (
                              <div>
                                <div className="text-slate-600">Delivered On</div>
                                <div className="font-medium text-green-700">
                                  {format(new Date(order.deliveredAt), "MMM dd, yyyy • hh:mm a")}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && orders.length > 0 && (
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing page {page} of {totalPages} ({ordersResponse?.total || 0} total orders)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

