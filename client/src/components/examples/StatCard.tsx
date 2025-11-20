import StatCard from '../StatCard';
import { Activity, Calendar, DollarSign, Users } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-background">
      <StatCard
        title="Total Revenue"
        value="₹2,45,830"
        icon={DollarSign}
        trend={{ value: "12.5%", isPositive: true }}
      />
      <StatCard
        title="Appointments"
        value="156"
        icon={Calendar}
        trend={{ value: "8.2%", isPositive: true }}
        subtitle="This month"
      />
      <StatCard
        title="Active Vendors"
        value="48"
        icon={Users}
        trend={{ value: "3.1%", isPositive: false }}
      />
      <StatCard
        title="Tasks Completed"
        value="89"
        icon={Activity}
        subtitle="This week"
      />
    </div>
  );
}
