import AppointmentCard from '../AppointmentCard';

export default function AppointmentCardExample() {
  return (
    <div className="max-w-md p-6 bg-background space-y-4">
      <AppointmentCard
        id="apt-1"
        patientName="Rajesh Kumar"
        serviceName="Complete Blood Count (CBC)"
        dateTime="2025-10-20T10:00:00"
        status="confirmed"
        location="Home Collection"
        assignedTo="Dr. Sharma"
        onReschedule={() => console.log('Reschedule clicked')}
        onComplete={() => console.log('Complete clicked')}
      />
      <AppointmentCard
        id="apt-2"
        patientName="Priya Patel"
        serviceName="X-Ray Chest"
        dateTime="2025-10-21T14:30:00"
        status="pending"
        location="Clinic Visit"
        onCancel={() => console.log('Cancel clicked')}
      />
    </div>
  );
}
