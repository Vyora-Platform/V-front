import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getApiUrl } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  ArrowLeft, 
  Phone, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Calendar, 
  FileText, 
  Mail, 
  MapPin,
  MoreVertical,
  Download,
  Share2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  Receipt,
  Building2
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

type Supplier = {
  id: string;
  name: string;
  businessName: string | null;
  phone: string;
  email: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  status: string;
};

type LedgerTransaction = {
  id: string;
  vendorId: string;
  customerId: string | null;
  supplierId: string | null;
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
  excludeFromBalance: boolean | null;
  isPOSSale: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type SupplierLedgerSummary = {
  totalGiven: number;
  totalReceived: number;
  balance: number;
  transactionCount: number;
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
      key = format(date, 'EEEE'); // Day name
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

export default function VendorLedgerSupplierDashboard() {
  const { vendorId } = useAuth();
  const params = useParams<{ supplierId: string }>();
  const [, setLocation] = useLocation();
  const supplierId = params.supplierId!;
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  // Fetch supplier details
  const { data: supplier, isLoading: supplierLoading } = useQuery<Supplier>({
    queryKey: [`/api/suppliers/${supplierId}`],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/suppliers/${supplierId}`));
      if (!response.ok) throw new Error('Failed to fetch supplier');
      return response.json();
    },
  });

  // Fetch supplier ledger transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<LedgerTransaction[]>({
    queryKey: ["/api/suppliers", supplierId, "ledger-transactions"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/suppliers/${supplierId}/ledger-transactions`));
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Calculate summary - Supplier Accounting Logic:
  // "You Paid" (type=out) = Payment made to supplier = Reduces what you owe
  // "You Got" (type=in) = Goods/credit received from supplier = Increases what you owe
  // Balance = totalIn - totalOut = what you owe supplier
  // Positive balance = "You will GIVE" (you owe supplier)
  // Negative balance = "You will GET" (supplier owes you, e.g., advance paid)
  const balanceTransactions = transactions.filter(t => !t.excludeFromBalance);
  const totalGot = balanceTransactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = balanceTransactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0);
  const summary: SupplierLedgerSummary = {
    // Show all transactions for totals
    totalGiven: transactions.filter(t => t.type === "out").reduce((sum, t) => sum + t.amount, 0),
    totalReceived: transactions.filter(t => t.type === "in").reduce((sum, t) => sum + t.amount, 0),
    // Balance = totalIn - totalOut (what you owe supplier)
    // Positive = You owe supplier = "You will GIVE"
    // Negative = Supplier owes you = "You will GET"
    balance: totalGot - totalPaid,
    transactionCount: transactions.length,
  };

  const groupedTransactions = groupTransactionsByDate(
    [...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
  );

  const handleWhatsAppMessage = () => {
    if (!supplier?.phone) return;
    
    // Positive balance = you owe supplier
    const message = summary.balance > 0
      ? `Hi ${supplier.name}, regarding the pending payment of ₹${Math.abs(summary.balance).toLocaleString()}. We will process it soon. Thank you for your partnership!`
      : `Hi ${supplier.name}, thank you for your business partnership!`;
    
    const whatsappUrl = `https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneCall = () => {
    if (!supplier?.phone) return;
    window.location.href = `tel:${supplier.phone}`;
  };

  const handleAddTransaction = (type: "in" | "out") => {
    setLocation(`/vendors/${vendorId}/ledger/supplier/${supplierId}/transaction/new?type=${type}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (supplierLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header - Khatabook Style */}
      <div className="sticky top-0 z-30 bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/vendor/ledger`)}
              className="-ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setShowContactSheet(true)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
                <span className="text-lg font-bold text-orange-600">
                  {supplier?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-base font-semibold line-clamp-1">{supplier?.name}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {supplier?.businessName || supplier?.phone}
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
              onClick={handleWhatsAppMessage}
              className="text-green-600"
            >
              <SiWhatsapp className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download Statement
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Statement
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Balance Card - Khatabook Style */}
        {/* For suppliers: positive balance = You will GIVE (you owe them) */}
        <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${
                  summary.balance > 0 ? 'text-green-600' : summary.balance < 0 ? 'text-red-600' : ''
                }`}>
                  ₹{Math.abs(summary.balance).toLocaleString('en-IN')}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] ${
                    summary.balance > 0 
                      ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20' 
                      : summary.balance < 0 
                        ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20' 
                        : ''
                  }`}
                >
                  {summary.balance > 0 ? 'You will GIVE' : summary.balance < 0 ? 'You will GET' : 'Settled ✓'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-[10px] text-muted-foreground mb-0.5">You Paid</p>
              <p className="text-sm font-semibold text-red-600">₹{summary.totalGiven.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-[10px] text-muted-foreground mb-0.5">You Got</p>
              <p className="text-sm font-semibold text-green-600">₹{summary.totalReceived.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/60">
              <p className="text-[10px] text-muted-foreground mb-0.5">Entries</p>
              <p className="text-sm font-semibold">{summary.transactionCount}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Khatabook Style */}
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
              <span>YOU PAID ₹</span>
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
            Transactions
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Sort
            </Button>
          </div>
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
              <Receipt className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Record your first transaction with {supplier?.name}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(groupedTransactions).map(([dateLabel, txns]) => (
              <div key={dateLabel}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-muted/30 sticky top-10 z-10">
                  <span className="text-xs font-medium text-muted-foreground">{dateLabel}</span>
                </div>
                
                {/* Transactions for this date */}
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
                            {transaction.type === "in" ? "You Got" : "You Paid"}
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
                        
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span className="capitalize">{transaction.paymentMethod}</span>
                          <span>•</span>
                          <span>{format(new Date(transaction.transactionDate), 'hh:mm a')}</span>
                          {transaction.attachments?.length > 0 && (
                            <>
                              <span>•</span>
                              <FileText className="h-3 w-3" />
                            </>
                          )}
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
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs text-destructive">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Running Balance Footer - For suppliers: positive = You will GIVE */}
      {transactions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Running Balance</span>
            <span className={`text-lg font-bold ${
              summary.balance > 0 ? 'text-green-600' : summary.balance < 0 ? 'text-red-600' : ''
            }`}>
              {summary.balance > 0 ? '' : summary.balance < 0 ? '-' : ''}₹{Math.abs(summary.balance).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Contact Details Sheet */}
      <Sheet open={showContactSheet} onOpenChange={setShowContactSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">
                  {supplier?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold">{supplier?.name}</p>
                {supplier?.businessName && (
                  <p className="text-sm text-muted-foreground">{supplier.businessName}</p>
                )}
                <Badge variant={supplier?.status === "active" ? "default" : "secondary"}>
                  {supplier?.status}
                </Badge>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 pb-6">
            {/* Contact Actions */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={handlePhoneCall}
              >
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Call</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={handleWhatsAppMessage}
              >
                <SiWhatsapp className="h-5 w-5 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Share2 className="h-5 w-5 text-primary" />
                <span className="text-xs">Share</span>
              </Button>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{supplier?.phone}</p>
                </div>
              </div>
              {supplier?.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{supplier.email}</p>
                  </div>
                </div>
              )}
              {(supplier?.addressLine1 || supplier?.city) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">
                      {[supplier.addressLine1, supplier.city, supplier.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}



