import { ReactNode, useState, useCallback } from "react";
import { useSubscription, ProRestrictedAction } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Crown, Lock, Sparkles, Check, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface ProActionGuardProps {
  children: ReactNode;
  action?: ProRestrictedAction;
  onBlocked?: (message: string) => void;
  showInlineWarning?: boolean;
  className?: string;
}

/**
 * ProActionGuard - Wraps action buttons/elements to enforce Pro subscription
 * 
 * Non-Pro users can VIEW all features but cannot:
 * - Save, Create, Update, Delete
 * - Publish, Download, Export, Submit
 * - Send, Generate, Activate, Deactivate
 * 
 * When a non-Pro user clicks a protected action, an upgrade modal is shown.
 */
export function ProActionGuard({ 
  children, 
  action = 'save',
  onBlocked,
  showInlineWarning = false,
  className = ""
}: ProActionGuardProps) {
  const { isPro, canPerformAction, getActionRestrictedMessage } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [, setLocation] = useLocation();

  const handleClick = useCallback((e: React.MouseEvent) => {
    const check = canPerformAction(action);
    
    if (!check.allowed) {
      // Block the action and show upgrade prompt
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`[PRO_GUARD] UI Action blocked: ${action}`);
      
      setShowUpgradeModal(true);
      onBlocked?.(check.message);
      return false;
    }
    
    // Pro user - allow the action to proceed
    return true;
  }, [action, canPerformAction, onBlocked]);

  // If Pro user, just render children without any wrapper
  if (isPro) {
    return <>{children}</>;
  }

  // Non-Pro user - wrap with click interceptor
  return (
    <>
      <div 
        className={`pro-action-guard ${className}`}
        onClick={handleClick}
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {/* Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={action}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          setLocation('/vendor/account');
        }}
      />

      {/* Optional inline warning */}
      {showInlineWarning && (
        <div className="flex items-center gap-1.5 text-amber-600 text-xs mt-1">
          <Lock className="h-3 w-3" />
          <span>{getActionRestrictedMessage(action)}</span>
        </div>
      )}
    </>
  );
}

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: ProRestrictedAction;
  onUpgrade: () => void;
}

/**
 * Upgrade Modal shown when non-Pro user attempts a restricted action
 */
export function ProUpgradeModal({ isOpen, onClose, action, onUpgrade }: ProUpgradeModalProps) {
  const actionLabels: Record<ProRestrictedAction, string> = {
    save: "save",
    create: "create",
    update: "update",
    delete: "delete",
    publish: "publish",
    download: "download",
    export: "export",
    submit: "submit",
    send: "send",
    generate: "generate",
    activate: "activate",
    deactivate: "deactivate"
  };

  const actionLabel = action ? actionLabels[action] : "perform this action";

  const proFeatures = [
    "Unlimited saves & exports",
    "Publish your mini website",
    "Full POS & order management",
    "Advanced analytics & reports",
    "Marketing & greeting cards",
    "Priority support"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Crown className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-white">
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription className="text-violet-100">
              Upgrade to Pro to {actionLabel} this feature.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Features list */}
        <div className="p-5 space-y-4">
          <div className="space-y-3">
            {proFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 text-center border border-violet-100">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm text-violet-700 font-medium">Special Offer</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ₹399<span className="text-sm font-normal text-gray-500">/month</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button 
              onClick={onUpgrade}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ProActionButton - A button that automatically shows upgrade prompt for non-Pro users
 */
interface ProActionButtonProps {
  action?: ProRestrictedAction;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ProActionButton({
  action = 'save',
  onClick,
  children,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  type = "button"
}: ProActionButtonProps) {
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    const check = canPerformAction(action);
    
    if (!check.allowed) {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[PRO_GUARD] Button action blocked: ${action}`);
      setShowUpgradeModal(true);
      return;
    }
    
    onClick?.(e);
  };

  return (
    <>
      <Button
        type={type}
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={handleClick}
      >
        {children}
        {!isPro && <Lock className="w-3.5 h-3.5 ml-1.5 opacity-60" />}
      </Button>

      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={action}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          setLocation('/vendor/account');
        }}
      />
    </>
  );
}

/**
 * Hook to use Pro action guard programmatically
 */
export function useProActionGuard() {
  const { isPro, canPerformAction, getActionRestrictedMessage } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<ProRestrictedAction>('save');
  const [, setLocation] = useLocation();

  const guardAction = useCallback(<T,>(
    action: ProRestrictedAction,
    callback: () => T | Promise<T>
  ): T | Promise<T> | null => {
    const check = canPerformAction(action);
    
    if (!check.allowed) {
      console.log(`[PRO_GUARD] Programmatic action blocked: ${action}`);
      setBlockedAction(action);
      setShowUpgradeModal(true);
      return null;
    }
    
    return callback();
  }, [canPerformAction]);

  const UpgradeModal = useCallback(() => (
    <ProUpgradeModal 
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      action={blockedAction}
      onUpgrade={() => {
        setShowUpgradeModal(false);
        setLocation('/vendor/account');
      }}
    />
  ), [showUpgradeModal, blockedAction, setLocation]);

  return {
    isPro,
    guardAction,
    canPerformAction,
    getActionRestrictedMessage,
    showUpgradeModal,
    setShowUpgradeModal,
    UpgradeModal
  };
}

export default ProActionGuard;

