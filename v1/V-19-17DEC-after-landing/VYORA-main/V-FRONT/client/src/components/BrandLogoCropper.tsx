import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Move, ZoomIn, ZoomOut, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrandLogoCropperProps {
  value: string | null;
  onChange: (logo: string | null) => void;
}

export function BrandLogoCropper({ value, onChange }: BrandLogoCropperProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CROP_SIZE = 200; // Size of the circular crop area

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        // Center the image initially
        const initialScale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height) * 1.2;
        setScale(initialScale);
        setPosition({
          x: (CROP_SIZE - img.width * initialScale) / 2,
          y: (CROP_SIZE - img.height * initialScale) / 2,
        });
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setIsDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageSrc) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain movement to keep image within crop area
    const img = imageRef.current!;
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;
    
    const maxX = 0;
    const minX = CROP_SIZE - imgWidth;
    const maxY = 0;
    const minY = CROP_SIZE - imgHeight;
    
    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setScale(newScale);
    
    // Adjust position to keep image centered
    if (imageRef.current) {
      const img = imageRef.current;
      const imgWidth = img.width * newScale;
      const imgHeight = img.height * newScale;
      
      const maxX = 0;
      const minX = CROP_SIZE - imgWidth;
      const maxY = 0;
      const minY = CROP_SIZE - imgHeight;
      
      setPosition({
        x: Math.max(minX, Math.min(maxX, position.x)),
        y: Math.max(minY, Math.min(maxY, position.y)),
      });
    }
  };

  const cropImage = () => {
    if (!imageSrc || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Set canvas size
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw image with current scale and position
    ctx.drawImage(
      img,
      position.x,
      position.y,
      img.width * scale,
      img.height * scale
    );

    // Convert to data URL
    const croppedDataUrl = canvas.toDataURL('image/png');
    onChange(croppedDataUrl);
    setIsDialogOpen(false);
    setImageSrc(null);
    toast({
      title: "Logo cropped",
      description: "Brand logo has been updated",
    });
  };

  const removeLogo = () => {
    onChange(null);
    toast({
      title: "Logo removed",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {value ? "Change Logo" : "Upload Logo"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeLogo}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {value && (
        <div className="relative w-32 h-32 mx-auto">
          <div className="w-32 h-32 rounded-full border-2 border-gray-300 overflow-hidden bg-muted">
            <img
              src={value}
              alt="Brand logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Brand Logo</DialogTitle>
          </DialogHeader>
          
          {imageSrc && (
            <div className="space-y-4">
              <div className="relative mx-auto" style={{ width: CROP_SIZE, height: CROP_SIZE }}>
                {/* Crop area overlay */}
                <div
                  ref={containerRef}
                  className="relative w-full h-full rounded-full border-4 border-primary overflow-hidden bg-gray-100 cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {imageSrc && imageRef.current && (
                    <img
                      src={imageSrc}
                      alt="Preview"
                      className="absolute select-none"
                      style={{
                        width: `${imageRef.current.width * scale}px`,
                        height: `${imageRef.current.height * scale}px`,
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        pointerEvents: 'none',
                      }}
                      draggable={false}
                    />
                  )}
                </div>
                
                {/* Grid overlay for alignment */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-white/30" 
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '33.33% 33.33%'
                    }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom(-0.1)}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom(0.1)}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Move className="h-3 w-3" />
                <span>Drag to reposition</span>
              </div>

              {/* Hidden canvas for cropping */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setImageSrc(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={cropImage}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

