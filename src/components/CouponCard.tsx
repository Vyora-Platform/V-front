import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Calendar, TrendingUp, Users } from "lucide-react";

interface CouponCardProps {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  expiryDate: string;
  maxUsage: number;
  usedCount: number;
  status: "active" | "expired" | "inactive";
  applicableServices?: string[];
  onEdit?: () => void;
  onToggle?: () => void;
}

export default function CouponCard({
  id,
  code,
  description,
  discountType,
  discountValue,
  expiryDate,
  maxUsage,
  usedCount,
  status,
  applicableServices = [],
  onEdit,
  onToggle
}: CouponCardProps) {
  const isExpired = new Date(expiryDate) < new Date();
  const usagePercentage = (usedCount / maxUsage) * 100;

  return (
    <Card className="p-6 hover-elevate" data-testid={`coupon-card-${id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Tag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-mono">{code}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge
          variant={status === "active" ? "default" : "secondary"}
          className={isExpired ? "text-destructive" : ""}
          data-testid={`status-${status}`}
        >
          {isExpired ? "Expired" : status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold text-foreground">
              {discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`}
            </p>
            <p className="text-xs text-muted-foreground">Discount</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold text-foreground">{usedCount}/{maxUsage}</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Usage</span>
          <span>{usagePercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="w-4 h-4" />
        <span>
          Expires: {new Date(expiryDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>

      {applicableServices.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground mb-2">Applicable Services</p>
          <div className="flex flex-wrap gap-1">
            {applicableServices.slice(0, 2).map((service, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {service}
              </Badge>
            ))}
            {applicableServices.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{applicableServices.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1"
            data-testid="button-edit-coupon"
          >
            Edit
          </Button>
        )}
        {onToggle && !isExpired && (
          <Button
            size="sm"
            variant={status === "active" ? "outline" : "default"}
            onClick={onToggle}
            className="flex-1"
            data-testid="button-toggle-status"
          >
            {status === "active" ? "Deactivate" : "Activate"}
          </Button>
        )}
      </div>
    </Card>
  );
}
