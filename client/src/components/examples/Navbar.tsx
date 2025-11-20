import Navbar from '../Navbar';

export default function NavbarExample() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar
        userName="Dr. Rajesh Kumar"
        userRole="Clinic Owner"
        notificationCount={5}
        showMenuButton={true}
        onMenuClick={() => console.log('Menu clicked')}
      />
      <div className="p-6">
        <p className="text-muted-foreground">Content area below navbar</p>
      </div>
    </div>
  );
}
