import StatCard from "@/components/StatCard";
import AppointmentCard from "@/components/AppointmentCard";
import TaskCard from "@/components/TaskCard";
import NotificationBell from "@/components/NotificationBell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Activity, Users, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// TODO: remove mock data
const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
];

const upcomingAppointments = [
  {
    id: "1",
    patientName: "Rajesh Kumar",
    serviceName: "Complete Blood Count",
    dateTime: "2025-10-20T10:00:00",
    status: "confirmed" as const,
    location: "Home Collection",
    assignedTo: "Dr. Sharma"
  },
  {
    id: "2",
    patientName: "Priya Patel",
    serviceName: "X-Ray Chest",
    dateTime: "2025-10-20T14:30:00",
    status: "pending" as const,
    location: "Clinic Visit"
  },
];

const todayTasks = [
  {
    id: "1",
    title: "Update lab equipment maintenance records",
    priority: "high" as const,
    status: "pending" as const,
    dueDate: "2025-10-19T23:59:59",
    assignedTo: { name: "Amit Singh" }
  },
  {
    id: "2",
    title: "Restock sample collection supplies",
    priority: "medium" as const,
    status: "in_progress" as const,
    dueDate: "2025-10-19T23:59:59",
    assignedTo: { name: "Neha Verma" }
  },
];

export default function VendorDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Button data-testid="button-new-appointment">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="₹3,28,000"
          icon={DollarSign}
          trend={{ value: "12.5%", isPositive: true }}
        />
        <StatCard
          title="Appointments"
          value="24"
          icon={Calendar}
          subtitle="This week"
          trend={{ value: "8.2%", isPositive: true }}
        />
        <StatCard
          title="Tasks Pending"
          value="12"
          icon={Activity}
          subtitle="Due this week"
        />
        <StatCard
          title="Active Employees"
          value="8"
          icon={Users}
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Appointments</h3>
            <Button variant="ghost" size="sm" data-testid="button-view-all-appointments">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                {...apt}
                onReschedule={() => console.log('Reschedule', apt.id)}
                onComplete={() => console.log('Complete', apt.id)}
                onCancel={() => console.log('Cancel', apt.id)}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Today's Tasks</h3>
          <Button variant="ghost" size="sm" data-testid="button-view-all-tasks">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onStatusChange={(completed) => console.log('Task status:', task.id, completed)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
