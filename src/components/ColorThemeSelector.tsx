import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

// 10 Popular Color Themes
export const colorThemes = [
  { name: "Classic Blue & White", primary: "#0A66C2", secondary: "#FFFFFF", accent: "#1E90FF" },
  { name: "Black & Gold", primary: "#000000", secondary: "#F5D76E", accent: "#D4AF37" },
  { name: "Navy & Coral", primary: "#1A2A44", secondary: "#FF6F61", accent: "#F7CAC9" },
  { name: "Green & White", primary: "#2ECC71", secondary: "#FFFFFF", accent: "#27AE60" },
  { name: "Purple & Pink", primary: "#8E44AD", secondary: "#FFC0CB", accent: "#9B59B6" },
  { name: "Teal & Orange", primary: "#1ABC9C", secondary: "#F39C12", accent: "#E67E22" },
  { name: "Gray & Blue", primary: "#2C3E50", secondary: "#3498DB", accent: "#95A5A6" },
  { name: "Red & Black", primary: "#E74C3C", secondary: "#000000", accent: "#C0392B" },
  { name: "Dark Mode", primary: "#1E1E1E", secondary: "#2C2C2C", accent: "#3A3A3A" },
  { name: "Light Pastel", primary: "#FADCD9", secondary: "#F8E2CF", accent: "#CFE8A9" }
];

interface ColorThemeSelectorProps {
  selectedTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onThemeChange: (theme: { primary: string; secondary: string; accent: string }) => void;
}

export function ColorThemeSelector({ selectedTheme, onThemeChange }: ColorThemeSelectorProps) {
  // Find if current selection matches any preset theme
  const selectedIndex = colorThemes.findIndex(
    (theme) =>
      theme.primary === selectedTheme.primary &&
      theme.secondary === selectedTheme.secondary &&
      theme.accent === selectedTheme.accent
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Theme
        </CardTitle>
        <CardDescription>
          Choose a color combination for your website. Colors apply instantly to the preview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {colorThemes.map((theme, index) => {
            const isSelected = selectedIndex === index;
            
            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => onThemeChange({
                  primary: theme.primary,
                  secondary: theme.secondary,
                  accent: theme.accent,
                })}
                className={cn(
                  "group relative p-3 rounded-lg border-2 transition-all duration-200",
                  "hover:scale-[1.03] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border hover:border-primary/50"
                )}
                data-testid={`theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {/* Color Preview Blocks */}
                <div className="flex flex-col gap-1 mb-2">
                  {/* Primary Color Block */}
                  <div
                    className="h-8 w-full rounded-md shadow-sm"
                    style={{ backgroundColor: theme.primary }}
                    title="Primary Color"
                  />
                  {/* Secondary Color Block */}
                  <div
                    className="h-6 w-full rounded-md shadow-sm border"
                    style={{ 
                      backgroundColor: theme.secondary,
                      borderColor: theme.secondary === "#FFFFFF" ? "#e5e7eb" : "transparent"
                    }}
                    title="Secondary Color"
                  />
                  {/* Accent Color Block */}
                  <div
                    className="h-4 w-full rounded-md shadow-sm"
                    style={{ backgroundColor: theme.accent }}
                    title="Accent Color"
                  />
                </div>

                {/* Theme Name */}
                <p className="text-xs font-medium text-center text-muted-foreground truncate">
                  {theme.name}
                </p>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Theme Display */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">Current Colors:</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border shadow-sm"
                style={{ backgroundColor: selectedTheme.primary }}
              />
              <span className="text-xs font-mono">{selectedTheme.primary}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border shadow-sm"
                style={{ 
                  backgroundColor: selectedTheme.secondary,
                  borderColor: selectedTheme.secondary === "#FFFFFF" ? "#e5e7eb" : "transparent"
                }}
              />
              <span className="text-xs font-mono">{selectedTheme.secondary}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border shadow-sm"
                style={{ backgroundColor: selectedTheme.accent }}
              />
              <span className="text-xs font-mono">{selectedTheme.accent}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ColorThemeSelector;

