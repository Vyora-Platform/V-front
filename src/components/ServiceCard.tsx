import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";

interface ServiceCardProps {
  id: string;
  name: string;
  category: string;
  price?: number;
  description: string;
  inclusions: string[];
  exclusions: string[];
  tags: string[];
  tat?: string;
  sampleType?: string;
  icon?: string;
  onAdd?: () => void;
  added?: boolean;
}

export default function ServiceCard({
  id,
  name,
  category,
  price,
  description,
  inclusions,
  exclusions,
  tags,
  tat,
  sampleType,
  icon = "🩺",
  onAdd,
  added = false
}: ServiceCardProps) {
  return (
    <Card className="p-6 flex flex-col hover-elevate" data-testid={`service-card-${id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
        </div>
        {price && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">₹{price}</p>
          </div>
        )}
      </div>

      <p className="text-sm text-foreground mb-4">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, idx) => (
          <Badge key={idx} variant="secondary" data-testid={`tag-${tag}`}>
            {tag}
          </Badge>
        ))}
      </div>

      {(tat || sampleType) && (
        <div className="flex gap-4 mb-4 text-sm">
          {tat && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{tat}</span>
            </div>
          )}
          {sampleType && (
            <div className="text-muted-foreground">
              Sample: <span className="font-medium">{sampleType}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Inclusions</p>
          <ul className="space-y-1">
            {inclusions.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-1 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Exclusions</p>
          <ul className="space-y-1">
            {exclusions.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-1 text-xs text-muted-foreground">
                <X className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {onAdd && (
        <Button
          onClick={onAdd}
          disabled={added}
          variant={added ? "secondary" : "default"}
          className="w-full"
          data-testid={`button-add-service-${id}`}
        >
          {added ? "Added to Catalogue" : "Add to My Catalogue"}
        </Button>
      )}
    </Card>
  );
}
