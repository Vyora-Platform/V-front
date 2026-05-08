import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Edit, Trash2 } from "lucide-react";

interface EmployeeCardProps {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar?: string;
  permissions: string[];
  status: "active" | "inactive";
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EmployeeCard({
  id,
  name,
  role,
  email,
  phone,
  avatar,
  permissions,
  status,
  onEdit,
  onDelete
}: EmployeeCardProps) {
  return (
    <Card className="p-4 hover-elevate" data-testid={`employee-card-${id}`}>
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
            <Badge variant={status === "active" ? "default" : "secondary"} data-testid={`status-${status}`}>
              {status}
            </Badge>
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{phone}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {permissions.slice(0, 3).map((permission, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {permission}
              </Badge>
            ))}
            {permissions.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{permissions.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                data-testid="button-edit"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                data-testid="button-delete"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
