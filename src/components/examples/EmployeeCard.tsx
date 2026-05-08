import EmployeeCard from '../EmployeeCard';

export default function EmployeeCardExample() {
  return (
    <div className="max-w-md p-6 bg-background space-y-4">
      <EmployeeCard
        id="emp-1"
        name="Dr. Anil Sharma"
        role="Lab Technician"
        email="anil.sharma@clinic.com"
        phone="+91 98765 43210"
        permissions={["View Appointments", "Manage Samples", "Generate Reports"]}
        status="active"
        onEdit={() => console.log('Edit employee')}
        onDelete={() => console.log('Delete employee')}
      />
      <EmployeeCard
        id="emp-2"
        name="Kavita Desai"
        role="Receptionist"
        email="kavita.d@clinic.com"
        phone="+91 98765 43211"
        permissions={["Book Appointments", "View Patients", "Manage Payments", "Send Notifications"]}
        status="active"
        onEdit={() => console.log('Edit employee')}
        onDelete={() => console.log('Delete employee')}
      />
    </div>
  );
}
