import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format } from "date-fns";

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
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  totalSpent: number;
};

export default function VendorCustomerLedger() {
  const { customerId } = useParams();
  const [, navigate] = useLocation();

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/customers", customerId, "ledger-transactions"],
    enabled: !!customerId,
  });

  const { data: balanceData } = useQuery<{ balance: number }>({
    queryKey: ["/api/customers", customerId, "ledger-balance"],
    enabled: !!customerId,
  });

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

  // Calculate totals
  const totalIn = transactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0);
  const balance = balanceData?.balance || 0;

  if (customerLoading || !customer) {

    // Show loading while vendor ID initializes
    if (!vendorId) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/vendor/ledger")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ledger
      </Button>

      {/* Customer Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl" data-testid="text-customer-name">{customer.name}</CardTitle>
              <CardDescription className="mt-2">
                <div className="space-y-1">
                  <div>Phone: {customer.phone}</div>
                  {customer.email && <div>Email: {customer.email}</div>}
                  {customer.address && <div>Address: {customer.address}, {customer.city}</div>}
                </div>
              </CardDescription>
            </div>
            <Link href="/vendor/ledger/transaction/new">
              <Button data-testid="button-add-transaction">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-customer-total-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-customer-total-in">
              {formatCurrency(totalIn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money received from {customer.name}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-customer-total-out">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-customer-total-out">
              {formatCurrency(totalOut)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money paid to {customer.name}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-customer-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-customer-balance">
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance > 0 ? `${customer.name} owes you` : balance < 0 ? `You owe ${customer.name}` : 'No outstanding balance'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All transactions with {customer.name}</CardDescription>
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
              <p className="text-muted-foreground mb-4">
                Start by recording your first transaction with {customer.name}
              </p>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => {
                    // Calculate running balance
                    const runningTransactions = transactions.slice(index);
                    const runningBalance = runningTransactions.reduce((sum, t) => {
                      return sum + (t.type === "in" ? t.amount : -t.amount);
                    }, 0);

                    return (
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
                        <TableCell className={`text-right font-medium ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(runningBalance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
