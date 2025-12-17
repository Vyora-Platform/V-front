import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppointmentCardProps {
  id: string;
  patientName: string;
  patientAvatar?: string;
  serviceName: string;
  dateTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  location?: string;
  assignedTo?: string;
  onReschedule?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, color: "text-chart-3" },
  confirmed: { label: "Confirmed", variant: "default" as const, color: "text-chart-4" },
  completed: { label: "Completed", variant: "secondary" as const, color: "text-chart-2" },
  cancelled: { label: "Cancelled", variant: "secondary" as const, color: "text-destructive" }
};

export default function AppointmentCard({
  id,
  patientName,
  patientAvatar,
  serviceName,
  dateTime,
  status,
  location,
  assignedTo,
  onReschedule,
  onComplete,
  onCancel
}: AppointmentCardProps) {
  const config = statusConfig[status];

  return (
    <Card className="p-4 hover-elevate" data-testid={`appointment-card-${id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={patientAvatar} />
            <AvatarFallback>{patientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-foreground">{patientName}</h4>
            <p className="text-sm text-muted-foreground">{serviceName}</p>
          </div>
        </div>
        <Badge variant={config.variant} className={config.color} data-testid={`status-${status}`}>
          {config.label}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date(dateTime).toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{new Date(dateTime).toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}
        {assignedTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Assigned to: {assignedTo}</span>
          </div>
        )}
      </div>

      {status === "confirmed" && (
        <div className="flex gap-2">
          {onReschedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReschedule}
              className="flex-1"
              data-testid="button-reschedule"
            >
              Reschedule
            </Button>
          )}
          {onComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              className="flex-1"
              data-testid="button-complete"
            >
              Mark Complete
            </Button>
          )}
        </div>
      )}
      {status === "pending" && onCancel && (
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="w-full"
          data-testid="button-cancel"
        >
          Cancel
        </Button>
      )}
    </Card>
  );
}
