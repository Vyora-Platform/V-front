import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, subtitle }: StatCardProps) {
  return (
    <Card className="p-4 md:p-5 hover-elevate rounded-xl min-h-[100px]" data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="p-2.5 md:p-3 rounded-xl bg-primary/10 shrink-0">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 md:mt-4 flex items-center gap-1.5">
          <span className={`text-xs md:text-sm font-medium ${trend.isPositive ? 'text-chart-2' : 'text-destructive'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  );
}
