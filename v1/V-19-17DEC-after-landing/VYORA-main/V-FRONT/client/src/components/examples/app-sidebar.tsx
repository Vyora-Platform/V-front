import { AppSidebar } from '../app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="vendor" />
        <div className="flex-1 p-6 bg-background">
          <h2 className="text-2xl font-bold mb-4">Main Content Area</h2>
          <p className="text-muted-foreground">
            This is where the main content would appear. The sidebar navigation is functional.
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}
