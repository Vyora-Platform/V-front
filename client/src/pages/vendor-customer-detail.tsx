import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  ShoppingCart,
  Heart,
  AlertCircle,
  Users,
  Clock,
  FileText,
  Edit2,
  TrendingUp,
  Crown,
  Target,
  CheckCircle2,
  CalendarDays,
  Receipt,
  Wallet,
  CreditCard,
  UserCheck,
  Activity,
  AlertTriangle,
  Timer,
  IndianRupee,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Customer, Lead } from "@shared/schema";
import { format, formatDistanceToNow, differenceInDays, isPast } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorCustomerDetail() {
  const { vendorId } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("orders");

  // Fetch customer
  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: ['/api/customers', id],
    enabled: !!id,
  });

  // Fetch ALL vendor orders and filter by customer phone
  const { data: allVendorOrders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'orders'],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/orders`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!vendorId,
  });

  // Fetch ALL vendor bookings and filter by customer phone
  const { data: allVendorBookings = [], isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'bookings'],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/bookings`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!vendorId,
  });

  // Fetch customer attendance
  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<any[]>({
    queryKey: ['/api/vendors', vendorId, 'customer-attendance', id],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/customer-attendance?customerId=${id}`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!id && !!vendorId,
  });

  // Fetch ledger transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/customers', id, 'ledger-transactions'],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/customers/${id}/ledger-transactions`), {
          credentials: "include",
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Fetch ledger balance
  const { data: ledgerBalance } = useQuery<{ balance: number }>({
    queryKey: ['/api/customers', id, 'ledger-balance'],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/customers/${id}/ledger-balance`), {
          credentials: "include",
        });
        if (!response.ok) return { balance: 0 };
        return await response.json();
      } catch {
        return { balance: 0 };
      }
    },
    enabled: !!id,
  });

  // Fetch leads for checking converted leads
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/vendors', vendorId, 'leads'],
    enabled: !!vendorId,
  });

  if (isLoading || !vendorId) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">Customer not found</p>
        <Button onClick={() => setLocation("/vendor/customers")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </div>
    );
  }

  // Filter orders and bookings for this customer by phone
  const orders = allVendorOrders.filter((order: any) => 
    order.customerPhone === customer.phone || order.customerId === customer.id
  );
  
  const bookings = allVendorBookings.filter((booking: any) => 
    booking.patientPhone === customer.phone || 
    booking.customerPhone === customer.phone || 
    booking.customerId === customer.id
  );

  // Find linked lead
  const linkedLead = leads.find(l => l.phone === customer.phone);

  const totalPurchases = orders.length + bookings.length;
  const totalOrdersAmount = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const totalBookingsAmount = bookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
  const balance = ledgerBalance?.balance || 0;

  // Get membership status
  const getMembershipStatus = () => {
    if (!customer.membershipEndDate) return null;
    
    const endDate = new Date(customer.membershipEndDate);
    const now = new Date();
    const daysUntilExpiry = differenceInDays(endDate, now);
    
    if (isPast(endDate)) {
      return { status: 'expired', text: 'Expired', color: 'text-red-600 bg-red-50' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring', text: `Expiring in ${daysUntilExpiry} days`, color: 'text-amber-600 bg-amber-50' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', text: `${daysUntilExpiry} days left`, color: 'text-orange-600 bg-orange-50' };
    } else {
      return { status: 'active', text: 'Active', color: 'text-emerald-600 bg-emerald-50' };
    }
  };

  const membershipStatus = getMembershipStatus();

  // Get ongoing bookings
  const ongoingBookings = bookings.filter((b: any) => 
    b.status === 'confirmed' || b.status === 'pending'
  );

  // Avatar component
  const Avatar = ({ name, size = "lg" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-14 w-14 text-lg",
      xl: "h-20 w-20 text-2xl"
    };
    const initial = name.charAt(0).toUpperCase();
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
      "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500"
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg`}>
        {initial}
      </div>
    );
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string }> = {
      active: { bg: "bg-emerald-100", text: "text-emerald-700" },
      inactive: { bg: "bg-gray-100", text: "text-gray-600" },
      pending_followup: { bg: "bg-amber-100", text: "text-amber-700" },
      blocked: { bg: "bg-red-100", text: "text-red-700" },
    };
    const c = config[status] || config.active;
    return (
      <Badge className={`${c.bg} ${c.text} border-0 font-medium`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-50/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/vendor/customers")}
              className="h-9 w-9 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 truncate">Customer Details</h1>
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start gap-4">
            <Avatar name={customer.name} size="xl" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusBadge status={customer.status} />
                <Badge variant="outline" className="capitalize">{customer.customerType}</Badge>
                {customer.membershipType && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 gap-1">
                    <Crown className="h-3 w-3" />
                    {customer.membershipType}
                  </Badge>
                )}
                {membershipStatus && (
                  <Badge className={`${membershipStatus.color} border-0 gap-1`}>
                    {membershipStatus.status === 'expired' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Timer className="h-3 w-3" />
                    )}
                    {membershipStatus.text}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Customer since {format(new Date(customer.createdAt), 'MMM yyyy')}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${customer.phone}`, '_self')}
              className="flex-1 bg-white"
            >
              <Phone className="h-4 w-4 mr-1 text-blue-600" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`, '_blank')}
              className="flex-1 bg-white"
            >
              <FaWhatsapp className="h-4 w-4 mr-1 text-green-600" />
              WhatsApp
            </Button>
            {customer.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                className="flex-1 bg-white"
              >
                <Mail className="h-4 w-4 mr-1 text-purple-600" />
                Email
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/vendor/customers`)}
              className="bg-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-lg font-bold text-blue-600">{orders.length}</p>
              <p className="text-[10px] text-gray-500">Orders</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-lg font-bold text-purple-600">{bookings.length}</p>
              <p className="text-[10px] text-gray-500">Bookings</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-lg font-bold text-emerald-600">₹{((customer.totalSpent || 0) / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-gray-500">Spent</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{Math.abs(balance).toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500">{balance >= 0 ? 'Balance' : 'Due'}</p>
            </div>
          </div>
        </div>

        {/* Tabs - Reordered: Orders, Bookings, Ledger, Visits, Overview */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-0 h-auto p-0 bg-transparent border-b rounded-none overflow-x-auto">
            <TabsTrigger 
              value="orders" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            >
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="bookings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            >
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="ledger" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            >
              Ledger
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            >
              Visits
            </TabsTrigger>
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            >
              Overview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Orders Tab */}
          <TabsContent value="orders" className="m-0 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Total Orders</p>
                    <p className="text-xl font-bold text-blue-700">{orders.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600">Total Value</p>
                    <p className="text-xl font-bold text-emerald-700">₹{totalOrdersAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {ordersLoading ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <LoadingSpinner />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                          <Badge variant="outline" className="capitalize">{order.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">₹{(order.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    {order.notes && (
                      <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{order.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="m-0 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-xs text-purple-600">Total Bookings</p>
                    <p className="text-xl font-bold text-purple-700">{bookings.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600">Total Value</p>
                    <p className="text-xl font-bold text-emerald-700">₹{totalBookingsAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {bookingsLoading ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <LoadingSpinner />
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No bookings yet</p>
                </div>
              ) : (
                bookings.map((booking: any) => (
                  <div key={booking.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">{booking.serviceName || `Booking #${booking.id.slice(0, 8)}`}</span>
                          <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(booking.bookingDate || booking.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-purple-600">₹{(booking.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    {booking.notes && (
                      <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{booking.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger" className="m-0 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Account Summary
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600">Total Spent</p>
                    <p className="text-xl font-bold text-emerald-700">₹{(customer.totalSpent || 0).toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                    <p className={`text-xs ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {balance >= 0 ? 'Balance' : 'Due'}
                    </p>
                    <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      ₹{Math.abs(balance).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Transactions</p>
                    <p className="text-xl font-bold text-gray-700">{transactions.length}</p>
                  </div>
                </div>
              </div>

              {transactionsLoading ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <LoadingSpinner />
                </div>
              ) : transactions.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                transactions.map((txn: any) => (
                  <div key={txn.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {txn.type === 'in' ? (
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold capitalize">{txn.category || txn.type}</span>
                          {txn.paymentMethod && <Badge variant="outline">{txn.paymentMethod}</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(txn.createdAt || txn.date), 'MMM d, yyyy')}
                        </p>
                        {txn.description && (
                          <p className="text-xs text-gray-500 mt-1">{txn.description}</p>
                        )}
                      </div>
                      <p className={`text-lg font-bold ${txn.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {txn.type === 'in' ? '+' : '-'}₹{(txn.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Attendance/Visits Tab */}
          <TabsContent value="attendance" className="m-0 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Visit Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Visit Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Total Visits</p>
                    <p className="text-xl font-bold text-blue-700">{customer.totalVisits || attendance.length || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-xs text-purple-600">Last Visit</p>
                    <p className="text-lg font-bold text-purple-700">
                      {customer.lastVisitDate ? format(new Date(customer.lastVisitDate), 'MMM d') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {attendanceLoading ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <LoadingSpinner />
                </div>
              ) : attendance.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                  <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No visit history</p>
                </div>
              ) : (
                attendance.map((record: any) => (
                  <div key={record.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold">
                            {format(new Date(record.date || record.createdAt), 'EEEE, MMM d, yyyy')}
                          </span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 capitalize">
                            {record.status || 'Visited'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Check-in: {record.checkInTime || format(new Date(record.createdAt), 'h:mm a')} 
                          {record.checkOutTime && ` • Check-out: ${record.checkOutTime}`}
                        </p>
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0 p-3 sm:p-4 space-y-4">
            {/* Contact Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a href={`tel:${customer.phone}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {customer.phone}
                    </a>
                  </div>
                </div>
                {customer.alternatePhone && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Alternate Phone</p>
                      <p className="font-medium text-gray-900">{customer.alternatePhone}</p>
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <a href={`mailto:${customer.email}`} className="font-medium text-gray-900 hover:text-blue-600 break-all">
                        {customer.email}
                      </a>
                    </div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">
                        {customer.address}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && `, ${customer.state}`}
                        {customer.pincode && ` - ${customer.pincode}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ongoing Bookings */}
            {ongoingBookings.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Ongoing Bookings ({ongoingBookings.length})
                </h3>
                <div className="space-y-2">
                  {ongoingBookings.slice(0, 3).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{booking.serviceName || `Booking #${booking.id.slice(0, 8)}`}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(booking.bookingDate || booking.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0 capitalize">{booking.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Details */}
            {(customer.gender || customer.dateOfBirth || customer.lastVisitDate) && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {customer.gender && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900 capitalize">{customer.gender}</p>
                    </div>
                  )}
                  {customer.dateOfBirth && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Birthday</p>
                      <p className="font-medium text-gray-900">{format(new Date(customer.dateOfBirth), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {customer.lastVisitDate && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Last Visit</p>
                      <p className="font-medium text-gray-900">{format(new Date(customer.lastVisitDate), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {customer.source && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="font-medium text-gray-900">{customer.source}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Membership Details */}
            {customer.membershipType && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600" />
                  Membership
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600">Type</p>
                    <p className="font-medium text-purple-900">{customer.membershipType}</p>
                  </div>
                  {customer.subscriptionStatus && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge variant="outline" className="capitalize">{customer.subscriptionStatus}</Badge>
                    </div>
                  )}
                  {customer.membershipStartDate && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-900">{format(new Date(customer.membershipStartDate), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {customer.membershipEndDate && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">End Date</p>
                      <p className="font-medium text-gray-900">{format(new Date(customer.membershipEndDate), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Linked Lead Info */}
            {linkedLead && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Converted from Lead
                </h3>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Lead #{linkedLead.id.slice(0, 8)}</p>
                    <p className="text-xs text-green-700">
                      Source: {linkedLead.source} • Converted {formatDistanceToNow(new Date(linkedLead.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes & Preferences */}
            {(customer.notes || (customer.preferences && customer.preferences.length > 0) || (customer.allergies && customer.allergies.length > 0)) && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  Notes & Preferences
                </h3>
                {customer.notes && (
                  <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg mb-3">{customer.notes}</p>
                )}
                {customer.preferences && customer.preferences.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.preferences.map((pref, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border-0">
                          <Heart className="h-3 w-3 mr-1" />
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {customer.allergies && customer.allergies.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.allergies.map((allergy, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-700 border-0">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contact */}
            {(customer.emergencyContactName || customer.emergencyContactPhone) && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-600" />
                  Emergency Contact
                </h3>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.emergencyContactName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{customer.emergencyContactPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
