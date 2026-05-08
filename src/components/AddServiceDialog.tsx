import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import type { MasterService } from "@shared/schema";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: MasterService;
  onConfirm: (data: {
    inclusions: string[];
    exclusions: string[];
    price: number;
    homeCollectionAvailable: boolean;
    homeCollectionCharges: number;
  }) => void;
}

export default function AddServiceDialog({
  open,
  onOpenChange,
  service,
  onConfirm
}: AddServiceDialogProps) {
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([...service.inclusions]);
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([...service.exclusions]);
  const [price, setPrice] = useState(service.basePrice || 0);
  const [homeCollectionAvailable, setHomeCollectionAvailable] = useState(false);
  const [homeCollectionCharges, setHomeCollectionCharges] = useState(0);

  // Reset state whenever the service changes
  useEffect(() => {
    setSelectedInclusions([...service.inclusions]);
    setSelectedExclusions([...service.exclusions]);
    setPrice(service.basePrice || 0);
    setHomeCollectionAvailable(false);
    setHomeCollectionCharges(0);
  }, [service]);

  const handleToggleInclusion = (item: string) => {
    setSelectedInclusions(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleToggleExclusion = (item: string) => {
    setSelectedExclusions(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = () => {
    onConfirm({
      inclusions: selectedInclusions,
      exclusions: selectedExclusions,
      price,
      homeCollectionAvailable,
      homeCollectionCharges,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" data-testid="dialog-add-service">
        <DialogHeader>
          <DialogTitle>Add {service.name} to Your Catalogue</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Service Info */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <div className="text-3xl">{service.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.category}</p>
              </div>
            </div>

            {/* Inclusions */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select Inclusions (What's included in YOUR service)
              </Label>
              <div className="space-y-2 border border-border rounded-lg p-4">
                {service.inclusions.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      id={`inclusion-${idx}`}
                      checked={selectedInclusions.includes(item)}
                      onCheckedChange={() => handleToggleInclusion(item)}
                      data-testid={`checkbox-inclusion-${idx}`}
                    />
                    <label
                      htmlFor={`inclusion-${idx}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select Exclusions (What's NOT included)
              </Label>
              <div className="space-y-2 border border-border rounded-lg p-4">
                {service.exclusions.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclusion-${idx}`}
                      checked={selectedExclusions.includes(item)}
                      onCheckedChange={() => handleToggleExclusion(item)}
                      data-testid={`checkbox-exclusion-${idx}`}
                    />
                    <label
                      htmlFor={`exclusion-${idx}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <Label htmlFor="price" className="text-base font-semibold mb-2 block">
                Your Pricing *
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">₹</span>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  placeholder="Enter your price"
                  className="flex-1"
                  data-testid="input-price"
                  required
                />
              </div>
              {service.basePrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Base price: ₹{service.basePrice}
                </p>
              )}
            </div>

            {/* Home Collection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="homeCollection"
                  checked={homeCollectionAvailable}
                  onCheckedChange={(checked) => setHomeCollectionAvailable(checked as boolean)}
                  data-testid="checkbox-home-collection"
                />
                <label
                  htmlFor="homeCollection"
                  className="text-base font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Home Sample Collection Available
                </label>
              </div>

              {homeCollectionAvailable && (
                <div>
                  <Label htmlFor="homeCharges" className="mb-2 block">
                    Home Collection Charges
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">₹</span>
                    <Input
                      id="homeCharges"
                      type="number"
                      value={homeCollectionCharges}
                      onChange={(e) => setHomeCollectionCharges(parseInt(e.target.value) || 0)}
                      placeholder="Enter charges"
                      data-testid="input-home-charges"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={price <= 0}
            data-testid="button-confirm-add"
          >
            Add to Catalogue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
