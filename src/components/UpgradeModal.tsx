import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Zap, Check, ArrowRight, Lock, Sparkles,
  ShoppingCart, BarChart3, Calendar, MessageSquare, 
  Globe, FileCheck, Tag, Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  redirectToUpgrade?: boolean;
}

const proFeatures = [
  { name: "Orders & POS", icon: ShoppingCart, description: "Full order management with point of sale" },
  { name: "Analytics & Reports", icon: BarChart3, description: "Detailed business insights" },
  { name: "Appointments & Bookings", icon: Calendar, description: "Schedule management" },
  { name: "Marketing & Greetings", icon: MessageSquare, description: "Create & share marketing posts" },
  { name: "Website Builder", icon: Globe, description: "Your own business website" },
  { name: "Invoicing & Billing", icon: FileCheck, description: "Professional invoices" },
  { name: "Coupons & Offers", icon: Tag, description: "Create promotional offers" },
  { name: "Products & Catalogue", icon: Package, description: "Complete catalogue management" },
];

export function UpgradeModal({ isOpen, onClose, feature, redirectToUpgrade = true }: UpgradeModalProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = () => {
    onClose();
    if (redirectToUpgrade) {
      setLocation("/vendor/account?upgrade=true");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upgrade to Pro</h2>
              <p className="text-sm text-white/80">Unlock all premium features</p>
            </div>
          </div>
          
          {feature && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">{feature} is a Pro feature</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold">₹399</span>
              <span className="text-muted-foreground line-through">₹499</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <Badge className="bg-green-500 mt-2">Save 20%</Badge>
          </div>

          {/* Features Grid */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-center mb-3">Everything in Pro:</p>
            <div className="grid grid-cols-2 gap-2">
              {proFeatures.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-xs font-medium">{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button 
            onClick={handleUpgrade}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Upgrade Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime • Secure payment via Razorpay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple upgrade banner for inline use
export function UpgradeBanner({ feature, className }: { feature?: string; className?: string }) {
  const [, setLocation] = useLocation();

  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            {feature ? `${feature} is a Pro feature` : "Unlock Pro Features"}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Upgrade to access all premium features
          </p>
        </div>
        <Button 
          size="sm"
          onClick={() => setLocation("/vendor/account?upgrade=true")}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Zap className="w-4 h-4 mr-1" />
          Upgrade
        </Button>
      </div>
    </div>
  );
}

// Lock overlay for pro features
export function ProFeatureLock({ 
  children, 
  feature,
  showDummy = false 
}: { 
  children: React.ReactNode; 
  feature: string;
  showDummy?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="relative">
        {/* Content with blur/opacity */}
        <div className={cn(
          "pointer-events-none select-none",
          showDummy ? "opacity-60" : "opacity-40 blur-sm"
        )}>
          {children}
        </div>

        {/* Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/50 to-white/80 dark:via-gray-900/50 dark:to-gray-900/80 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold text-lg mb-1">Pro Feature</p>
            <p className="text-sm text-muted-foreground mb-4">{feature}</p>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        feature={feature}
      />
    </>
  );
}


