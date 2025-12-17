import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type Supplier, type InsertSupplier } from "@shared/schema";
import { Warehouse, Search, Plus, Trash2, Edit, Phone, Mail, MapPin, Building, DollarSign, Package, TrendingUp, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorSuppliers() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Fetch suppliers with search and filter
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/vendors', vendorId, 'suppliers', searchQuery, statusFilter, categoryFilter],
    enabled: !!vendorId,
    queryFn: async () => {
      let url = `/api/vendors/${vendorId}/suppliers`;
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/vendors/${vendorId}/suppliers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers'] });
      toast({ title: "Supplier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete supplier", variant: "destructive" });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingSupplier(null);
  };

  // Stats
  const activeSuppliers = suppliers?.filter(s => s.status === "active").length || 0;
  const totalOutstanding = suppliers?.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0) || 0;
  const totalSuppliers = suppliers?.length || 0;


  // Show loading while vendor ID initializes
  if (!vendorId) { return <LoadingSpinner />; }

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
            <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
            <p className="text-xs text-muted-foreground">Manage supplier relationships</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-supplier">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
              <DialogDescription>
                {editingSupplier ? "Update supplier information" : "Add a new supplier to your database"}
              </DialogDescription>
            </DialogHeader>
            <SupplierForm
              supplier={editingSupplier}
              vendorId={vendorId}
              onSuccess={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{totalSuppliers}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-lg font-bold text-green-600">{activeSuppliers}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p className="text-lg font-bold text-orange-600">₹{(totalOutstanding / 1000).toFixed(1)}k</p>
          </Card>
        </div>
      </div>

      {/* Search and Filters - Horizontal Scroll */}
      <div className="px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="relative flex-1 min-w-[200px] snap-start">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-suppliers"
            />
          </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] flex-shrink-0 snap-start" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] flex-shrink-0 snap-start" data-testid="select-category-filter">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="raw_materials">Raw Materials</SelectItem>
                <SelectItem value="finished_goods">Finished Goods</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading suppliers...</div>
          ) : suppliers && suppliers.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Supplier Name</TableHead>
                    <TableHead className="min-w-[120px]">Contact</TableHead>
                    <TableHead className="min-w-[100px]">Category</TableHead>
                    <TableHead className="min-w-[100px]">Outstanding</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                      <TableCell>
                        <div>
                          <Link href={`/vendor/suppliers/${supplier.id}`}>
                            <div className="font-medium hover:text-primary cursor-pointer" data-testid={`text-supplier-name-${supplier.id}`}>
                              {supplier.name}
                            </div>
                          </Link>
                          {supplier.businessName && (
                            <div className="text-sm text-muted-foreground">{supplier.businessName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {supplier.category?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={supplier.outstandingBalance && supplier.outstandingBalance > 0 ? "text-orange-600 font-medium" : ""}>
                          ₹{(supplier.outstandingBalance || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={supplier.status === "active" ? "default" : "secondary"}
                          data-testid={`badge-status-${supplier.id}`}
                        >
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            data-testid={`button-edit-${supplier.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier.id, supplier.name)}
                            data-testid={`button-delete-${supplier.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found. Add your first supplier to get started.
            </div>
          )}
      </div>
    </div>
  );
}

// Supplier Form Component
function SupplierForm({ supplier, vendorId, onSuccess }: { supplier: Supplier | null; vendorId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<Omit<InsertSupplier, 'vendorId'>>({
    resolver: zodResolver(insertSupplierSchema.omit({ vendorId: true })),
    defaultValues: supplier ? {
      name: supplier.name,
      businessName: supplier.businessName,
      phone: supplier.phone,
      email: supplier.email,
      contactPerson: supplier.contactPerson,
      category: supplier.category,
      status: supplier.status,
      gstin: supplier.gstin,
      pan: supplier.pan,
      addressLine1: supplier.addressLine1,
      addressLine2: supplier.addressLine2,
      city: supplier.city,
      state: supplier.state,
      pincode: supplier.pincode,
      bankName: supplier.bankName,
      accountNumber: supplier.accountNumber,
      ifscCode: supplier.ifscCode,
      notes: supplier.notes,
    } : {
      name: "",
      phone: "",
      category: "other",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/suppliers`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers'] });
      toast({ title: "Supplier created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create supplier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      if (!supplier) throw new Error("No supplier to update");
      const response = await apiRequest("PATCH", `/api/vendors/${vendorId}/suppliers/${supplier.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'suppliers'] });
      toast({ title: "Supplier updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update supplier", variant: "destructive" });
    },
  });

  const onSubmit = (data: Omit<InsertSupplier, 'vendorId'>) => {
    const supplierData = { ...data, vendorId: vendorId };
    if (supplier) {
      updateMutation.mutate(supplierData);
    } else {
      createMutation.mutate(supplierData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={["basic", "business"]} className="w-full">
          {/* Basic Information */}
          <AccordionItem value="basic">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Basic Information
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Suppliers" data-testid="input-supplier-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="ABC Enterprises Pvt Ltd" data-testid="input-business-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+91 9876543210" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" placeholder="supplier@example.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="John Doe" data-testid="input-contact-person" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="raw_materials">Raw Materials</SelectItem>
                          <SelectItem value="finished_goods">Finished Goods</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Business Details */}
          <AccordionItem value="business">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Business & Tax Details
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="22AAAAA0000A1Z5" data-testid="input-gstin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="AAAAA0000A" data-testid="input-pan" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Address */}
          <AccordionItem value="address">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="123 Main Street" data-testid="input-addressline1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Suite 456" data-testid="input-addressline2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Mumbai" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Maharashtra" data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="400001" data-testid="input-pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Banking Details */}
          <AccordionItem value="banking">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Banking & Payment
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="State Bank of India" data-testid="input-bank-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="1234567890" data-testid="input-account-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="SBIN0001234" data-testid="input-ifsc-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Additional Notes */}
          <AccordionItem value="notes">
            <AccordionTrigger className="text-base font-semibold">
              Additional Notes
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Any additional notes about the supplier..."
                        rows={3}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit-supplier"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : supplier
              ? "Update Supplier"
              : "Create Supplier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
