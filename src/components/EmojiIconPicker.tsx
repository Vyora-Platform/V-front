import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile, Upload, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

interface EmojiIconPickerProps {
  value?: string;
  iconUrl?: string;
  onChange: (icon: string | null, iconUrl: string | null) => void;
  label?: string;
}

export default function EmojiIconPicker({ value, iconUrl, onChange, label = "Icon / Emoji" }: EmojiIconPickerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { theme } = useTheme();

  const handleEmojiSelect = (emojiData: any) => {
    onChange(emojiData.emoji, null);
    setShowEmojiPicker(false);
  };

  const handleClear = () => {
    onChange(null, null);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex items-center gap-2">
        {/* Display current icon/emoji */}
        <div className="flex items-center justify-center w-16 h-16 border-2 border-dashed border-border rounded-md">
          {value ? (
            <span className="text-3xl" data-testid="selected-emoji">{value}</span>
          ) : iconUrl ? (
            <img src={iconUrl} alt="Icon" className="w-12 h-12 object-contain" data-testid="selected-icon" />
          ) : (
            <Smile className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            data-testid="button-emoji-picker"
            className="w-full"
          >
            <Smile className="w-4 h-4 mr-2" />
            {value ? "Change Emoji" : "Pick Emoji"}
          </Button>
          
          {(value || iconUrl) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              data-testid="button-clear-icon"
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="relative">
          <div className="absolute left-0 top-2 z-50 border rounded-lg shadow-lg bg-background">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
              width={320}
              height={400}
              data-testid="emoji-picker"
            />
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Select an emoji to represent this {label.toLowerCase()}. Icons make it easier to identify at a glance.
      </p>
    </div>
  );
}
