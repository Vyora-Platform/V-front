import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";

interface QuotationItem {
  type: 'product' | 'service';
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendorProductId?: string;
  vendorCatalogueId?: string;
}

interface QuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: QuotationItem[];
  subdomain: string;
  primaryColor?: string;
  customerToken?: string | null;
  onSuccess?: () => void;
}

export function QuotationModal({
  open,
  onOpenChange,
  items,
  subdomain,
  primaryColor = "#4F46E5",
  customerToken,
  onSuccess,
}: QuotationModalProps) {
  const { toast } = useToast();
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Submit quotation mutation
  const submitQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      const headers: any = { 'Content-Type': 'application/json' };
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }
      
      const response = await fetch(getApiUrl(`/api/mini-website/${subdomain}/quotations`), {
        method: 'POST',
        headers,
        body: JSON.stringify(quotationData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request quote');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quotation requested!",
        description: "We'll send you a detailed quote shortly.",
      });
      setCustomerForm({ name: "", email: "", phone: "", notes: "" });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit quotation request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!customerForm.name.trim()) {
      toast({ 
        title: "Name Required", 
        description: "Please enter your name", 
        variant: "destructive" 
      });
      return;
    }
    if (!customerForm.phone.trim()) {
      toast({ 
        title: "Phone Required", 
        description: "Please enter your phone number", 
        variant: "destructive" 
      });
      return;
    }

    // Submit quotation request
    submitQuotationMutation.mutate({
      customer: customerForm,
      items: items,
      estimatedTotal: cartTotal,
      notes: customerForm.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Quote</DialogTitle>
          <DialogDescription>
            Fill in your details and we'll send you a detailed quotation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Items Summary */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3">Items for Quote</h4>
            <div className="space-y-2 text-sm">
              {items.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="flex justify-between">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Estimated Total</span>
                <span style={{ color: primaryColor }}>₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="quote-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quote-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="quote-email">Email</Label>
              <Input
                id="quote-email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="quote-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quote-phone"
                type="tel"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div>
              <Label htmlFor="quote-notes">Additional Requirements</Label>
              <Input
                id="quote-notes"
                value={customerForm.notes}
                onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                placeholder="Tell us more about your requirements..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            style={{ backgroundColor: primaryColor, color: "white" }}
            onClick={handleSubmit}
            disabled={submitQuotationMutation.isPending}
          >
            {submitQuotationMutation.isPending ? "Sending Request..." : "Request Quote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

