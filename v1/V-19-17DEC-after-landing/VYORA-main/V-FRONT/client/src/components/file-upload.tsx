import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  category: "logo" | "hero" | "team" | "testimonial" | "coupon";
  circular?: boolean;
  accept?: string;
  className?: string;
  allowAnyFile?: boolean;
}

export function FileUpload({ 
  value, 
  onChange, 
  category, 
  circular = false,
  accept,
  className = "",
  allowAnyFile = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Get vendorId from localStorage
      const vendorId = localStorage.getItem('vendorId') || 'vendor-1';

      const response = await fetch(getApiUrl(`/api/upload/${category}?vendorId=${vendorId}`), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
      
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  const baseClasses = circular 
    ? "relative w-24 h-24 rounded-full border-2 border-dashed hover-elevate overflow-hidden"
    : "relative w-full h-32 rounded-md border-2 border-dashed hover-elevate overflow-hidden";

  return (
    <div className={`${baseClasses} ${className}`}>
      {value ? (
        <>
          <img 
            src={value} 
            alt="Uploaded" 
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleRemove}
            disabled={uploading}
            data-testid={`button-remove-${category}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer bg-muted/50">
          <input
            type="file"
            className="hidden"
            accept={allowAnyFile ? undefined : (accept || "image/*")}
            onChange={handleFileChange}
            disabled={uploading}
            data-testid={`input-upload-${category}`}
          />
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground text-center px-2">
                {circular ? "Upload" : "Click to upload"}
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

interface MultiFileUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  category: "hero" | "coupon";
  maxFiles?: number;
  className?: string;
  allowAnyFile?: boolean;
}

export function MultiFileUpload({
  values,
  onChange,
  category,
  maxFiles = 10,
  className = "",
  allowAnyFile = false
}: MultiFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max files limit
    if (values.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${maxFiles} images`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        // Get vendorId from localStorage
        const vendorId = localStorage.getItem('vendorId') || 'vendor-1';

        const response = await fetch(getApiUrl(`/api/upload/${category}?vendorId=${vendorId}`), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      onChange([...values, ...urls]);
      
      toast({
        title: "Upload successful",
        description: `${urls.length} image(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Uploaded Images Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {values.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
              <img 
                src={url} 
                alt={`Upload ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => handleRemove(index)}
                disabled={uploading}
                data-testid={`button-remove-${category}-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {values.length < maxFiles && (
        <label className="flex flex-col items-center justify-center w-full h-32 rounded-md border-2 border-dashed hover-elevate cursor-pointer bg-muted/50">
          <input
            type="file"
            className="hidden"
            accept={allowAnyFile ? undefined : "image/*"}
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            data-testid={`input-upload-${category}`}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Click to upload images ({values.length}/{maxFiles})
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Max 10MB per file
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
