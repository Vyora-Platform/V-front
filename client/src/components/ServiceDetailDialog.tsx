import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { MasterService, VendorCatalogue } from "@shared/schema";
import ServiceDescriptionPage from "./ServiceDescriptionPage";

interface ServiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: MasterService | VendorCatalogue | null;
  primaryColor?: string;
}

export default function ServiceDetailDialog({ 
  open, 
  onOpenChange, 
  service,
  primaryColor = "#6366f1" 
}: ServiceDetailDialogProps) {
  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <ServiceDescriptionPage 
          service={service} 
          primaryColor={primaryColor}
        />
      </DialogContent>
    </Dialog>
  );
}
