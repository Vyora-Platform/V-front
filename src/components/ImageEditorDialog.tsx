import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Crop, Check, X } from 'lucide-react';

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onSave: (editedImage: string) => void;
  aspectRatio?: number; // 1 for square, 16/9 for landscape, etc.
}

export const ImageEditorDialog: React.FC<ImageEditorDialogProps> = ({
  open,
  onOpenChange,
  imageSrc,
  onSave,
  aspectRatio = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image when dialog opens
  useEffect(() => {
    if (open && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        // Reset transforms
        setScale(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
      };
      img.src = imageSrc;
    }
  }, [open, imageSrc]);

  // Draw image on canvas
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = container.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height) - 40; // Account for padding
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply transformations
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);

    // Calculate image dimensions to fit within circle while maintaining aspect ratio
    const circleRadius = size / 2 - 10;
    const imgAspect = image.width / image.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > 1) {
      // Landscape image
      drawWidth = circleRadius * 2;
      drawHeight = drawWidth / imgAspect;
    } else {
      // Portrait image
      drawHeight = circleRadius * 2;
      drawWidth = drawHeight * imgAspect;
    }

    drawX = -drawWidth / 2;
    drawY = -drawHeight / 2;

    // Draw image
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    // Restore context
    ctx.restore();

    // Draw circular crop mask
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [image, scale, rotation, position]);

  // Redraw when transforms change
  useEffect(() => {
    if (open && image) {
      drawImage();
    }
  }, [drawImage, open, image]);

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (newScale: number) => {
    setScale(Math.max(0.1, Math.min(3, newScale)));
  };

  // Handle rotation
  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  // Save edited image
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editedImage = canvas.toDataURL('image/png');
    onSave(editedImage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-4 h-4" />
            Edit Logo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
            style={{ height: '300px' }}
          >
            <canvas
              ref={canvasRef}
              className="cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
            {/* Circular overlay to show crop area */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white border-dashed rounded-full"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zoom</span>
                <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleZoom(scale - 0.1)}
                  disabled={scale <= 0.1}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Slider
                  value={[scale]}
                  onValueChange={(value) => handleZoom(value[0])}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleZoom(scale + 0.1)}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Rotation</span>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={rotateCounterClockwise}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {rotation}°
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={rotateClockwise}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground text-center">
              Drag to reposition • Use zoom and rotation controls
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
