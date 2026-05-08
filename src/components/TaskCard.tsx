import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  assignedTo?: {
    name: string;
    avatar?: string;
  };
  onStatusChange?: (completed: boolean) => void;
}

const priorityConfig = {
  low: { label: "Low", color: "text-chart-4", icon: "🟢" },
  medium: { label: "Medium", color: "text-chart-3", icon: "🟡" },
  high: { label: "High", color: "text-destructive", icon: "🔴" }
};

export default function TaskCard({
  id,
  title,
  description,
  priority,
  status,
  dueDate,
  assignedTo,
  onStatusChange
}: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(status === "completed");
  const config = priorityConfig[priority];
  const isOverdue = new Date(dueDate) < new Date() && status !== "completed";

  const handleCheckboxChange = (checked: boolean) => {
    setIsCompleted(checked);
    onStatusChange?.(checked);
    console.log(`Task ${id} marked as ${checked ? 'completed' : 'pending'}`);
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`task-card-${id}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          className="mt-1"
          data-testid={`checkbox-task-${id}`}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={`font-semibold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {title}
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-lg">{config.icon}</span>
            </div>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(dueDate).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </span>
              {isOverdue && <span className="ml-1">(Overdue)</span>}
            </div>

            {assignedTo && (
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={assignedTo.avatar} />
                  <AvatarFallback className="text-xs">
                    {assignedTo.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{assignedTo.name}</span>
              </div>
            )}

            <Badge variant="secondary" className="text-xs">
              {status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
