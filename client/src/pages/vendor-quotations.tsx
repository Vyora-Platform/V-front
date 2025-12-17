import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, FileText, Search, Trash2, Edit, Send, Check, X, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Quotation, Customer, VendorCatalogue, VendorProduct } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

// Extended type for quotation with items
type QuotationWithItems = Quotation & {
  items?: QuotationItem[];
};

type QuotationItem = {
  id: string;
  quotationId: string;
  itemType: string;
  itemId: string | null;
  itemName: string;
  description: string | null;
  quantity: string;
  rate: string;
  taxPercent: string;
  taxAmount: string;
  discountPercent: string;
  discountAmount: string;
  amount: string;
  sortOrder: number;
  createdAt: Date;
};

export default function VendorQuotations() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithItems | null>(null);
  const { toast } = useToast();

  // Fetch quotations
  const { data: quotations = [], isLoading: loadingQuotations } = useQuery<QuotationWithItems[]>({
    queryKey: ["/api/vendors", vendorId, "quotations", statusFilter !== "all" ? statusFilter : undefined],
    enabled: !!vendorId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = `/api/vendors/${vendorId}/quotations${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch quotations");
      return response.json();
    },
  });

  // Fetch customers for filter and selection
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  // Calculate stats
  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === "draft").length,
    sent: quotations.filter(q => q.status === "sent").length,
    accepted: quotations.filter(q => q.status === "accepted").length,
    rejected: quotations.filter(q => q.status === "rejected").length,
    totalValue: quotations.reduce((sum, q) => sum + parseFloat(q.totalAmount || "0"), 0),
  };

  // Filter quotations

  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

  const filteredQuotations = quotations.filter(quotation => {
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    const matchesCustomer = customerFilter === "all" || quotation.customerId === customerFilter;
    const matchesSearch = !searchQuery || 
      quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customers.find(c => c.id === quotation.customerId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCustomer && matchesSearch;
  });

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
            <h1 className="text-xl font-bold text-foreground">Quotations</h1>
            <p className="text-xs text-muted-foreground">Manage quotations</p>
          </div>
        </div>
        <QuotationDialog
          customers={customers}
          vendorId={vendorId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
          }}
        />
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Draft</p>
            <p className="text-lg font-bold">{stats.draft}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Sent</p>
            <p className="text-lg font-bold">{stats.sent}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Accepted</p>
            <p className="text-lg font-bold text-green-600">{stats.accepted}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Rejected</p>
            <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Value</p>
            <p className="text-lg font-bold">₹{stats.totalValue.toLocaleString('en-IN')}</p>
          </Card>
        </div>
      </div>

      {/* Filters and Search - Horizontal Scroll */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="relative min-w-[250px] flex-shrink-0 snap-start">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search-quotations"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] flex-shrink-0 snap-start" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-[200px] flex-shrink-0 snap-start" data-testid="select-customer-filter">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quotations List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quotations ({filteredQuotations.length})</h2>
          <div className="space-y-4">
            {loadingQuotations ? (
              <div className="p-6 text-center border rounded-lg">
                <p className="text-muted-foreground">Loading quotations...</p>
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="p-6 text-center border rounded-lg">
                <p className="text-muted-foreground">No quotations found</p>
              </div>
            ) : (
              filteredQuotations.map(quotation => (
                <QuotationCard
                  key={quotation.id}
                  quotation={quotation}
                  customer={customers.find(c => c.id === quotation.customerId)}
                  onSelect={() => setSelectedQuotation(quotation)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quotation Details Dialog */}
      {selectedQuotation && (
        <QuotationDetailsDialog
          quotation={selectedQuotation}
          customer={customers.find(c => c.id === selectedQuotation.customerId)}
          open={!!selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
        />
      )}
    </div>
  );
}

// Quotation Card Component
function QuotationCard({ 
  quotation, 
  customer,
  onSelect 
}: { 
  quotation: QuotationWithItems;
  customer?: Customer;
  onSelect: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      case "sent": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "accepted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "expired": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  return (
    <Card className="hover-elevate cursor-pointer" onClick={onSelect} data-testid={`card-quotation-${quotation.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground" data-testid={`text-quotation-number-${quotation.id}`}>
                {quotation.quotationNumber}
              </h3>
              <Badge className={getStatusColor(quotation.status)} data-testid={`badge-status-${quotation.id}`}>
                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-medium text-foreground" data-testid={`text-customer-name-${quotation.id}`}>
                  {customer?.name || "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium text-foreground">
                  {format(new Date(quotation.quotationDate), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Valid Until:</span>
                <p className="font-medium text-foreground">
                  {format(new Date(quotation.validUntil), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <p className="font-semibold text-primary text-lg" data-testid={`text-amount-${quotation.id}`}>
                  ₹{parseFloat(quotation.totalAmount || "0").toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {quotation.notes && (
              <p className="text-sm text-muted-foreground mt-2">{quotation.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Add Section Component for Multi-Select
function QuickAddSection({ 
  title, 
  items, 
  onAdd, 
  renderItem 
}: { 
  title: string; 
  items: any[]; 
  onAdd: (ids: string[]) => void; 
  renderItem: (item: any) => React.ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleItem = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    if (selected.length > 0) {
      onAdd(selected);
      setSelected([]);
      setIsExpanded(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:underline"
        >
          {title} ({items.length})
          <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
        </button>
        {selected.length > 0 && (
          <Button 
            type="button"
            size="sm" 
            onClick={handleAdd}
            className="h-7 text-xs"
          >
            Add {selected.length} {title}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
          {items.map(item => (
            <label 
              key={item.id} 
              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggleItem(item.id)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                {renderItem(item)}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Quotation Dialog Component (Create/Edit)
function QuotationDialog({ 
  quotation,
  customers,
  vendorId,
  onSuccess 
}: { 
  quotation?: QuotationWithItems;
  customers: Customer[];
  vendorId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"details" | "items">("details");
  const { toast } = useToast();

  // Form state
  const [customerId, setCustomerId] = useState(quotation?.customerId || "");
  const [validDays, setValidDays] = useState(7);
  const [notes, setNotes] = useState(quotation?.notes || "");
  const [termsAndConditions, setTermsAndConditions] = useState(quotation?.termsAndConditions || "");
  const [items, setItems] = useState<Partial<QuotationItem>[]>([]);

  // Fetch services for line items (vendor catalogue)
  const { data: services = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
  });

  // Fetch products for line items
  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
  });

  const createQuotationMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create quotation
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const quotationData = {
        vendorId: vendorId,
        customerId,
        quotationNumber: "", // Will be auto-generated
        quotationDate: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        status: "draft",
        subtotal: calculateSubtotal().toFixed(2),
        taxAmount: calculateTaxAmount().toFixed(2),
        discountAmount: calculateDiscountAmount().toFixed(2),
        additionalCharges: "0",
        totalAmount: calculateTotal().toFixed(2),
        notes,
        termsAndConditions,
      };

      const response = await apiRequest("POST", `/api/vendors/${vendorId}/quotations`, quotationData);
      const newQuotation = await response.json();

      // Step 2: Create items
      for (const item of items) {
        await apiRequest("POST", `/api/quotations/${newQuotation.id}/items`, {
          quotationId: newQuotation.id,
          ...item,
        });
      }

      return newQuotation;
    },
    onSuccess: () => {
      toast({
        title: "Quotation Created",
        description: "Your quotation has been created successfully.",
      });
      setOpen(false);
      resetForm();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerId("");
    setValidDays(7);
    setNotes("");
    setTermsAndConditions("");
    setItems([]);
    setStep("details");
  };

  const addItem = () => {
    setItems([...items, {
      itemType: "custom",
      itemName: "",
      description: "",
      quantity: "1",
      rate: "0",
      taxPercent: "0",
      discountPercent: "0",
      amount: "0",
      sortOrder: items.length,
    }]);
  };

  const addMultipleProducts = (productIds: string[]) => {
    const newItems = productIds.map((productId, idx) => {
      const product = products.find(p => p.id === productId);
      if (!product) return null;
      
      return {
        itemType: "product",
        itemId: productId,
        itemName: product.name,
        description: product.description || "",
        quantity: "1",
        rate: product.price.toString(),
        taxPercent: "0",
        discountPercent: "0",
        amount: product.price.toString(),
        sortOrder: items.length + idx,
      };
    }).filter(Boolean) as Partial<QuotationItem>[];
    
    setItems([...items, ...newItems]);
  };

  const addMultipleServices = (serviceIds: string[]) => {
    const newItems = serviceIds.map((serviceId, idx) => {
      const service = services.find(s => s.id === serviceId);
      if (!service) return null;
      
      return {
        itemType: "service",
        itemId: serviceId,
        itemName: service.name,
        description: service.description,
        quantity: "1",
        rate: service.price.toString(),
        taxPercent: "0",
        discountPercent: "0",
        amount: service.price.toString(),
        sortOrder: items.length + idx,
      };
    }).filter(Boolean) as Partial<QuotationItem>[];
    
    setItems([...items, ...newItems]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amounts
    const item = newItems[index];
    const quantity = parseFloat(item.quantity || "0");
    const rate = parseFloat(item.rate || "0");
    const taxPercent = parseFloat(item.taxPercent || "0");
    const discountPercent = parseFloat(item.discountPercent || "0");
    
    const subtotal = quantity * rate;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const amount = taxableAmount + taxAmount;
    
    newItems[index].taxAmount = taxAmount.toFixed(2);
    newItems[index].discountAmount = discountAmount.toFixed(2);
    newItems[index].amount = amount.toFixed(2);
    
    setItems(newItems);
  };

  const selectService = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    // Update all fields at once to avoid state batching issues
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemType: "service",
      itemId: serviceId,
      itemName: service.name,
      description: service.description,
      rate: service.price.toString(),
    };
    setItems(newItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Update all fields at once to avoid state batching issues
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemType: "product",
      itemId: productId,
      itemName: product.name,
      description: product.description || "",
      rate: product.price.toString(),
    };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || "0");
      const rate = parseFloat(item.rate || "0");
      return sum + (quantity * rate);
    }, 0);
  };

  const calculateTaxAmount = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
  };

  const calculateDiscountAmount = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.discountAmount || "0"), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  };

  const canProceedToItems = customerId && items.length === 0;
  const canCreateQuotation = customerId && items.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-quotation">
          <Plus className="h-4 w-4 mr-2" />
          Create Quotation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>
            {step === "details" ? "Enter quotation details and select customer" : "Add line items to the quotation"}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customerId && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p><strong>Phone:</strong> {customers.find(c => c.id === customerId)?.phone}</p>
                  <p><strong>Email:</strong> {customers.find(c => c.id === customerId)?.email || "N/A"}</p>
                  <p><strong>Address:</strong> {customers.find(c => c.id === customerId)?.address || "N/A"}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validDays">Valid For (Days)</Label>
              <Input
                id="validDays"
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                data-testid="input-valid-days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this quotation..."
                data-testid="input-notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Payment terms, delivery terms, etc..."
                data-testid="input-terms"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep("items")} 
                disabled={!customerId}
                data-testid="button-next-to-items"
              >
                Next: Add Items
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button onClick={addItem} size="sm" data-testid="button-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Item
              </Button>
            </div>

            {/* Quick Add: Multi-select Products/Services */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Add Items</CardTitle>
                <CardDescription className="text-xs">Select multiple products or services to add at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.length > 0 && (
                  <QuickAddSection
                    title="Products"
                    items={products.filter(p => p.isActive)}
                    onAdd={addMultipleProducts}
                    renderItem={(product) => (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {product.icon} {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">₹{product.price}</span>
                      </div>
                    )}
                  />
                )}
                
                {services.length > 0 && (
                  <QuickAddSection
                    title="Services"
                    items={services}
                    onAdd={addMultipleServices}
                    renderItem={(service) => (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{service.name}</span>
                        <span className="text-xs text-muted-foreground">₹{service.price}</span>
                      </div>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items added yet</p>
              ) : (
                items.map((item, index) => (
                  <Card key={index} data-testid={`item-${index}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select 
                                value={item.itemType || "custom"} 
                                onValueChange={(value) => updateItem(index, "itemType", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="service">Service</SelectItem>
                                  <SelectItem value="product">Product</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {item.itemType === "service" && (
                              <div className="space-y-2">
                                <Label>Select Service</Label>
                                <Select 
                                  value={item.itemId || ""} 
                                  onValueChange={(value) => selectService(index, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose service" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {services.map(service => (
                                      <SelectItem key={service.id} value={service.id}>
                                        {service.name} - ₹{service.price}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {item.itemType === "product" && (
                              <div className="space-y-2">
                                <Label>Select Product</Label>
                                <Select 
                                  value={item.itemId || ""} 
                                  onValueChange={(value) => selectProduct(index, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.filter(p => p.isActive).map(product => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.icon} {product.name} - ₹{product.price} ({product.stock} in stock)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {/* Display Item Name (read-only) */}
                          {item.itemName && (
                            <div className="p-3 bg-muted rounded-md">
                              <p className="font-semibold text-sm">{item.itemName}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                          )}

                          {/* For custom items, allow manual entry */}
                          {item.itemType === "custom" && (
                            <>
                              <div className="space-y-2">
                                <Label>Item Name *</Label>
                                <Input
                                  value={item.itemName || ""}
                                  onChange={(e) => updateItem(index, "itemName", e.target.value)}
                                  placeholder="Enter item name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                  value={item.description || ""}
                                  onChange={(e) => updateItem(index, "description", e.target.value)}
                                  placeholder="Item description"
                                />
                              </div>
                            </>
                          )}

                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.quantity || "1"}
                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Rate (₹)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.rate || "0"}
                                onChange={(e) => updateItem(index, "rate", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Tax (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.taxPercent || "0"}
                                onChange={(e) => updateItem(index, "taxPercent", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Discount (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.discountPercent || "0"}
                                onChange={(e) => updateItem(index, "discountPercent", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="bg-muted p-2 rounded text-sm">
                            <strong>Line Total: ₹{parseFloat(item.amount || "0").toFixed(2)}</strong>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax:</span>
                      <span>₹{calculateTaxAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Discount:</span>
                      <span>-₹{calculateDiscountAmount().toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createQuotationMutation.mutate()}
                  disabled={!canCreateQuotation || createQuotationMutation.isPending}
                  data-testid="button-create-quotation-submit"
                >
                  {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Quotation Details Dialog Component
function QuotationDetailsDialog({
  quotation,
  customer,
  open,
  onClose,
}: {
  quotation: QuotationWithItems;
  customer?: Customer;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  // Fetch quotation items
  const { data: items = [] } = useQuery<QuotationItem[]>({
    queryKey: ["/api/quotations", quotation.id, "items"],
    enabled: open,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/quotations/${quotation.id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Quotation status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
      onClose();
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/quotations/${quotation.id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Quotation Deleted",
        description: "Quotation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {quotation.quotationNumber}
          </DialogTitle>
          <DialogDescription>
            Created on {format(new Date(quotation.quotationDate), "dd MMM yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{customer?.name || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{customer?.phone || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{customer?.email || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{customer?.address || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <p className="font-semibold">₹{parseFloat(item.amount).toFixed(2)}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                      <div>Qty: {item.quantity}</div>
                      <div>Rate: ₹{item.rate}</div>
                      <div>Tax: {item.taxPercent}%</div>
                      <div>Disc: {item.discountPercent}%</div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(quotation.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax:</span>
                  <span>₹{parseFloat(quotation.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Discount:</span>
                  <span>-₹{parseFloat(quotation.discountAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Additional Charges:</span>
                  <span>₹{parseFloat(quotation.additionalCharges).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">₹{parseFloat(quotation.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(quotation.notes || quotation.termsAndConditions) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                {quotation.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes:</p>
                    <p className="text-sm">{quotation.notes}</p>
                  </div>
                )}
                {quotation.termsAndConditions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Terms & Conditions:</p>
                    <p className="text-sm">{quotation.termsAndConditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {quotation.status === "draft" && (
              <Button 
                onClick={() => updateStatusMutation.mutate("sent")}
                data-testid="button-mark-sent"
              >
                <Send className="h-4 w-4 mr-2" />
                Mark as Sent
              </Button>
            )}
            {quotation.status === "sent" && (
              <>
                <Button 
                  onClick={() => updateStatusMutation.mutate("accepted")}
                  data-testid="button-mark-accepted"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Accepted
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate("rejected")}
                  data-testid="button-mark-rejected"
                >
                  <X className="h-4 w-4 mr-2" />
                  Mark as Rejected
                </Button>
              </>
            )}
            {quotation.status === "draft" && (
              <Button 
                variant="destructive"
                onClick={() => deleteQuotationMutation.mutate()}
                data-testid="button-delete-quotation"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
