import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Minus,
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Phone,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

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

// Group transactions by date
const groupTransactionsByDate = (transactions: LedgerTransaction[]) => {
  const groups: Record<string, LedgerTransaction[]> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.transactionDate);
    let key: string;
    
    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = format(date, 'EEEE');
    } else if (isThisMonth(date)) {
      key = format(date, 'MMM dd');
    } else {
      key = format(date, 'MMM dd, yyyy');
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  
  return groups;
};

export default function VendorCustomerLedger() {
  const { customerId } = useParams();
  const [, navigate] = useLocation();
  const { vendorId } = useAuth();
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !!customerId,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/customers", customerId, "ledger-transactions"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${customerId}/ledger-transactions`));
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!customerId,
  });

  const { data: balanceData } = useQuery<{ balance: number }>({
    queryKey: ["/api/customers", customerId, "ledger-balance"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/customers/${customerId}/ledger-balance`));
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
    enabled: !!customerId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalIn = transactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0);
  const balance = balanceData?.balance || (totalIn - totalOut);

  const groupedTransactions = groupTransactionsByDate(
    [...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
  );

  const handleWhatsAppReminder = () => {
    if (!customer?.phone) return;
    
    const message = balance > 0
      ? `Hi ${customer.name}, this is a friendly reminder about your pending payment of ₹${Math.abs(balance).toLocaleString()}. Please clear the dues at your earliest convenience. Thank you!`
      : `Hi ${customer.name}, thank you for your business!`;
    
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneCall = () => {
    if (!customer?.phone) return;
    window.location.href = `tel:${customer.phone}`;
  };

  const handleAddTransaction = (type: "in" | "out") => {
    navigate(`/vendors/${vendorId}/ledger/customer/${customerId}/transaction/new?type=${type}`);
  };

  if (customerLoading || !customer) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header - Khatabook Style */}
      <div className="sticky top-0 z-50 bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
      <Button
        variant="ghost"
              size="icon"
        onClick={() => navigate("/vendor/ledger")}
              className="-ml-2"
      >
              <ArrowLeft className="h-5 w-5" />
      </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
            <div>
                <h1 className="text-base font-semibold line-clamp-1">{customer.name}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </p>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePhoneCall}
              className="text-blue-600"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleWhatsAppReminder}
              className="text-green-600"
            >
              <SiWhatsapp className="h-5 w-5" />
              </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${
                  balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : ''
                }`}>
                  ₹{Math.abs(balance).toLocaleString('en-IN')}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] ${
                    balance > 0 
                      ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20' 
                      : balance < 0 
                        ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20' 
                        : ''
                  }`}
                >
                  {balance > 0 ? 'You will GET' : balance < 0 ? 'You will GIVE' : 'Settled ✓'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-[10px] text-muted-foreground mb-0.5">You Gave</p>
              <p className="text-sm font-semibold text-red-600">₹{totalOut.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-[10px] text-muted-foreground mb-0.5">You Got</p>
              <p className="text-sm font-semibold text-green-600">₹{totalIn.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-14 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg"
            onClick={() => handleAddTransaction("out")}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Minus className="h-5 w-5" />
              </div>
              <span>YOU GAVE ₹</span>
            </div>
          </Button>
          <Button
            size="lg"
            className="h-14 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg"
            onClick={() => handleAddTransaction("in")}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span>YOU GOT ₹</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Transaction List - Scrollable */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="px-4 py-2 flex items-center justify-between sticky top-0 bg-background z-10 border-b">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Transactions ({transactions.length})
          </span>
        </div>

          {transactionsLoading ? (
          <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Record your first transaction with {customer.name}
              </p>
            </div>
          ) : (
          <div className="divide-y">
            {Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
              <div key={dateLabel}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">{dateLabel}</span>
                </div>
                
                {/* Transactions */}
                {txns.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedTransaction(
                      expandedTransaction === transaction.id ? null : transaction.id
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === "in" 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                          {transaction.type === "in" ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-xs font-semibold uppercase ${
                            transaction.type === "in" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "in" ? "You Got" : "You Gave"}
                          </span>
                          <span className={`text-base font-bold ${
                            transaction.type === "in" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "in" ? "+" : "-"}₹{transaction.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        {transaction.description && (
                          <p className="text-sm text-foreground line-clamp-1">{transaction.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="capitalize">{transaction.paymentMethod}</span>
                          <span>•</span>
                          <span>{format(new Date(transaction.transactionDate), 'hh:mm a')}</span>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      {expandedTransaction === transaction.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {/* Expanded Details */}
                    {expandedTransaction === transaction.id && (
                      <div className="mt-3 ml-13 pl-10 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <span className="ml-2 font-medium capitalize">{transaction.category.replace(/_/g, ' ')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="ml-2 font-medium capitalize">{transaction.paymentMethod}</span>
                          </div>
                        </div>
                        {transaction.note && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Note:</span>
                            <span className="ml-2">{transaction.note}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Running Balance Footer */}
      {transactions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Running Balance</span>
            <span className={`text-lg font-bold ${
              balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : ''
            }`}>
              {balance > 0 ? '+' : balance < 0 ? '-' : ''}₹{Math.abs(balance).toLocaleString('en-IN')}
            </span>
          </div>
            </div>
          )}
    </div>
  );
}
