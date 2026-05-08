import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ProductImageUploader({ value, onChange, maxImages = 5 }: ProductImageUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Too many images",
        description: `You can only upload ${remainingSlots} more image(s)`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image`,
            variant: "destructive",
          });
          continue;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB`,
            variant: "destructive",
          });
          continue;
        }

        // Convert to data URL for now (until object storage is configured)
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        uploadedUrls.push(dataUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
        toast({
          title: "Images added",
          description: `${uploadedUrls.length} image(s) added`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Failed to add images",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    if (value.length >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only add ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    onChange([...value, urlInput.trim()]);
    setUrlInput("");
    toast({
      title: "Image URL added",
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || value.length >= maxImages}
            onClick={() => document.getElementById('product-image-upload')?.click()}
            data-testid="button-upload-images"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Adding..." : "Upload from Device"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {value.length}/{maxImages} images
          </span>
          <input
            id="product-image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || value.length >= maxImages}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste image URL..."
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
              disabled={value.length >= maxImages}
              data-testid="input-image-url"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || value.length >= maxImages}
            data-testid="button-add-url"
          >
            Add URL
          </Button>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((imageKey, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border bg-muted overflow-hidden group"
              data-testid={`image-preview-${index}`}
            >
              <img
                src={imageKey}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Show fallback icon when image fails to load
                  const fallback = target.nextElementSibling?.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                onLoad={(e) => {
                  // Hide fallback icon when image loads successfully
                  const target = e.target as HTMLImageElement;
                  const fallback = target.nextElementSibling?.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeImage(index)}
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Fallback icon if image doesn't load (hidden by default) */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
