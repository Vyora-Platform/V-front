import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Trash2, Send, Check, X, Clock, ArrowLeft, 
  User, Calendar, IndianRupee, Package, Wrench, 
  Download, Share2, CheckCircle2, XCircle, Mail, Phone, MapPin,
  Receipt, Building2, Hash, Copy, ExternalLink
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { format } from "date-fns";
import type { Quotation, Customer } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

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

export default function VendorQuotationDetail() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const quotationId = params.id;
  const { toast } = useToast();

  // Fetch quotation
  const { data: quotation, isLoading: loadingQuotation } = useQuery<Quotation>({
    queryKey: ["/api/quotations", quotationId],
    enabled: !!quotationId,
  });

  // Fetch quotation items
  const { data: items = [] } = useQuery<QuotationItem[]>({
    queryKey: ["/api/quotations", quotationId, "items"],
    enabled: !!quotationId,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/vendors", vendorId, "customers"],
    enabled: !!vendorId,
  });

  const customer = customers.find(c => c.id === quotation?.customerId);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/quotations/${quotationId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Quotation status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/quotations/${quotationId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Quotation Deleted",
        description: "Quotation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "quotations"] });
      setLocation("/vendor/quotations");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const getStatusConfig = (status: string, isRequest: boolean = false) => {
    switch (status) {
      case "draft":
        return { 
          color: isRequest 
            ? "bg-amber-100 text-amber-700 border-amber-200" 
            : "bg-blue-100 text-blue-700 border-blue-200", 
          icon: isRequest ? Clock : FileText, 
          label: isRequest ? "Pending" : "Created",
          gradient: isRequest ? "from-amber-500 to-amber-600" : "from-blue-500 to-blue-600",
          bgColor: isRequest ? "bg-amber-50" : "bg-blue-50"
        };
      case "sent":
        return { 
          color: "bg-blue-100 text-blue-700 border-blue-200", 
          icon: Send, 
          label: "Sent",
          gradient: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-50"
        };
      case "accepted":
        return { 
          color: "bg-emerald-100 text-emerald-700 border-emerald-200", 
          icon: CheckCircle2, 
          label: "Accepted",
          gradient: "from-emerald-500 to-emerald-600",
          bgColor: "bg-emerald-50"
        };
      case "rejected":
        return { 
          color: "bg-red-100 text-red-700 border-red-200", 
          icon: XCircle, 
          label: "Rejected",
          gradient: "from-red-500 to-red-600",
          bgColor: "bg-red-50"
        };
      case "expired":
        return { 
          color: "bg-amber-100 text-amber-700 border-amber-200", 
          icon: Clock, 
          label: "Expired",
          gradient: "from-amber-500 to-amber-600",
          bgColor: "bg-amber-50"
        };
      default:
        return { 
          color: "bg-slate-100 text-slate-700 border-slate-200", 
          icon: Clock, 
          label: status,
          gradient: "from-slate-500 to-slate-600",
          bgColor: "bg-slate-50"
        };
    }
  };

  if (!vendorId) {
    return <LoadingSpinner />;
  }

  if (loadingQuotation) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">Loading quotation...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 items-center justify-center p-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Quotation Not Found</h3>
        <p className="text-slate-500 text-center mb-6">The quotation you're looking for doesn't exist</p>
        <Button 
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              setLocation("/vendor/quotations");
            }
          }}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotations
        </Button>
      </div>
    );
  }

  const isRequest = (quotation.source || "manual") === "miniwebsite";
  const statusConfig = getStatusConfig(quotation.status, isRequest);
  const StatusIcon = statusConfig.icon;

  // Separate items by type
  const productItems = items.filter(item => item.itemType === "product");
  const serviceItems = items.filter(item => item.itemType === "service");
  const chargeItems = items.filter(item => item.itemType === "charge");

  const subtotal = parseFloat(quotation.subtotal || "0");
  const taxAmount = parseFloat(quotation.taxAmount || "0");
  const discountAmount = parseFloat(quotation.discountAmount || "0");
  const additionalCharges = parseFloat(quotation.additionalCharges || "0");
  const totalAmount = parseFloat(quotation.totalAmount || "0");

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-y-auto">
      {/* Hero Header */}
      <div className={`bg-gradient-to-br ${statusConfig.gradient} text-white`}>
        <div className="px-4 py-4 safe-area-inset-top">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Use history back for standard e-commerce UX
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  setLocation("/vendor/quotations");
                }
              }}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Badge className="bg-white/20 text-white border-0">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Quotation Header */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-lg font-bold mb-1">{quotation.quotationNumber}</h1>
            <p className="text-white/70 text-sm">
              Created on {format(new Date(quotation.quotationDate), "dd MMM yyyy")}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xs text-white/70 mb-1">Total Amount</p>
              <p className="text-xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-xs text-white/70 mb-1">Valid Until</p>
              <p className="text-xl font-bold">{format(new Date(quotation.validUntil), "dd MMM")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 shadow-xl">
        <div className="p-4 space-y-4">
          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {customer?.name.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{customer?.name || "Unknown"}</h3>
                  {customer?.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(customer.phone)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {customer?.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="flex-1">{customer.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(customer.email || "")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {customer?.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="flex-1">{customer.address}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {customer?.phone && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => window.open(`tel:${customer.phone}`, '_self')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => window.open(`https://wa.me/${customer.phone?.replace(/\D/g, '')}`, '_blank')}
                  >
                    <FaWhatsapp className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Section */}
          {productItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600" />
                  Products ({productItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {productItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × ₹{parseFloat(item.rate).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-indigo-600">₹{parseFloat(item.amount).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Services Section */}
          {serviceItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-600" />
                  Services ({serviceItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {serviceItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × ₹{parseFloat(item.rate).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-purple-600">₹{parseFloat(item.amount).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Additional Charges Section */}
          {chargeItems.length > 0 && (
            <Card className="bg-amber-50 border-amber-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Additional Charges ({chargeItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {chargeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-amber-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800">{item.itemName}</p>
                        <p className="text-xs text-amber-600">
                          ₹{parseFloat(item.rate).toLocaleString('en-IN')} + {item.taxPercent}% tax
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-amber-700">₹{parseFloat(item.amount).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pricing Summary */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax</span>
                    <span className="font-medium text-amber-600">+₹{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Discount</span>
                    <span className="font-medium text-emerald-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {additionalCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Additional Charges</span>
                    <span className="font-medium text-amber-600">+₹{additionalCharges.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-indigo-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity Card */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Validity Period</p>
                    <p className="text-xs text-blue-600">
                      {format(new Date(quotation.quotationDate), "dd MMM yyyy")} - {format(new Date(quotation.validUntil), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                {new Date(quotation.validUntil) < new Date() && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {quotation.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          {quotation.termsAndConditions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{quotation.termsAndConditions}</p>
              </CardContent>
            </Card>
          )}

          {/* Quotation ID */}
          <Card className="bg-slate-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Hash className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{quotation.id}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(quotation.id)}
                  className="h-8"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy ID
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 pb-8 safe-area-inset-bottom">
          {quotation.status === "draft" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => deleteQuotationMutation.mutate()}
                  disabled={deleteQuotationMutation.isPending}
                  className="h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate("sent")}
                  disabled={updateStatusMutation.isPending}
                  className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Customer
                </Button>
              </div>
            </div>
          )}

          {quotation.status === "sent" && (
            <div className="space-y-3">
              <p className="text-sm text-center text-slate-500">Waiting for customer response</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate("rejected")}
                  disabled={updateStatusMutation.isPending}
                  className="h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Mark Rejected
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate("accepted")}
                  disabled={updateStatusMutation.isPending}
                  className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark Accepted
                </Button>
              </div>
            </div>
          )}

          {(quotation.status === "accepted" || quotation.status === "rejected" || quotation.status === "expired") && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-xl"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


