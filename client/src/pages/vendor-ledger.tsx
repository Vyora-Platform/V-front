import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar, Filter, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";
import { getApiUrl } from "@/lib/config";

type LedgerTransaction = {
  id: string;
  vendorId: string;
  customerId: string | null;
  type: "in" | "out";
  amount: number;
  transactionDate: string;
  category: string;
  paymentMethod: string;
  description: string | null;
  note: string | null;
  isRecurring: boolean;
  recurringPattern: string | null;
  referenceType: string | null;
  referenceId: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
};

type LedgerSummary = {
  totalIn: number;
  totalOut: number;
  balance: number;
  transactionCount: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export default function VendorLedger() {
  const { vendorId, isLoading: authLoading } = useAuth(); // Get real vendor ID from localStorage
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Build query params based on filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterType && filterType !== "all") params.append("type", filterType);
    if (filterCategory && filterCategory !== "all") params.append("category", filterCategory);
    if (filterPayment && filterPayment !== "all") params.append("paymentMethod", filterPayment);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return params;
  };

  const { data: summary, isLoading: summaryLoading } = useQuery<LedgerSummary>({
    queryKey: ["/api/vendors", vendorId, "ledger-summary", filterType, filterCategory, filterPayment, startDate, endDate],
    queryFn: async () => {
      const params = buildQueryParams();
      const queryString = params.toString();
      const url = `/api/vendors/${vendorId}/ledger-summary${queryString ? `?${queryString}` : ''}`;
      const fullUrl = getApiUrl(url);
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
    enabled: !!vendorId, // Only fetch when vendorId is available
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/vendors", vendorId, "ledger-transactions", filterType, filterCategory, filterPayment, startDate, endDate],
    queryFn: async () => {
      const params = buildQueryParams();
      const queryString = params.toString();
      const url = `/api/vendors/${vendorId}/ledger-transactions${queryString ? `?${queryString}` : ''}`;
      const fullUrl = getApiUrl(url);
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!vendorId, // Only fetch when vendorId is available
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "General";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      product_sale: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      service: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      expense: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      advance: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      refund: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      subscription: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
      other: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    };
    return colors[category] || colors.other;
  };

  const resetFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterPayment("all");
    setStartDate("");
    setEndDate("");
  };

  // Show loading while auth initializes (AFTER all hooks are called)
  if (authLoading || !vendorId) {
    return <LoadingSpinner />;
  }

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
            <h1 className="text-xl font-bold text-foreground" data-testid="heading-ledger">Hisab Kitab</h1>
            <p className="text-xs text-muted-foreground">Track transactions</p>
          </div>
        </div>
        <Link href={`/vendors/${vendorId}/ledger/new`}>
          <Button size="sm" data-testid="button-add-transaction">
            <Plus className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
          <Card className="p-3" data-testid="card-total-in">
            {summaryLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">Received</p>
                <p className="text-lg font-bold text-green-600" data-testid="text-total-in">
                  {formatCurrency(summary?.totalIn || 0)}
                </p>
              </>
            )}
          </Card>

          <Card className="p-3" data-testid="card-total-out">
            {summaryLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">Paid</p>
                <p className="text-lg font-bold text-red-600" data-testid="text-total-out">
                  {formatCurrency(summary?.totalOut || 0)}
                </p>
              </>
            )}
          </Card>

          <Card className="p-3" data-testid="card-balance">
            {summaryLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <p className={`text-lg font-bold ${(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-balance">
                  {formatCurrency(summary?.balance || 0)}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter transactions </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} data-testid="button-reset-filters" className="pt-[4px] pb-[4px] text-[#01040a]">
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="select-filter-type">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in">In (Received)</SelectItem>
                  <SelectItem value="out">Out (Paid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger data-testid="select-filter-category">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="product_sale">Product Sale</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger data-testid="select-filter-payment">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                  data-testid="input-start-date"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                  data-testid="input-end-date"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All your money in and out transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first transaction</p>
              <Link href="/vendor/ledger/transaction/new">
                <Button data-testid="button-add-first-transaction">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.transactionDate), "dd MMM yyyy")}
                        {transaction.isRecurring && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Recurring
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.type === "in" ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                            In
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                            Out
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getCustomerName(transaction.customerId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryBadge(transaction.category)}>
                          {transaction.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.description || "-"}</TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
