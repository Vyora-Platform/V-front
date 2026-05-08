import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Theme Toggle</h2>
        <ThemeToggle />
      </div>
      <p className="text-muted-foreground">Click the button to toggle between light and dark modes.</p>
    </div>
  );
}
