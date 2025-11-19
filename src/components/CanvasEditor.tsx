import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Circle, Textbox, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Trash2,
  Copy,
} from "lucide-react";
import { useElementsStore } from "@/store/elementsStore";
import { toast } from "sonner";

export const CanvasEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  
  // Filters state
  const [blur, setBlur] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);

  const { elements } = useElementsStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1920,
      height: 1080,
      backgroundColor: '#1a1a1a',
    });

    setFabricCanvas(canvas);

    // Selection events
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  // Sync elements to canvas
  useEffect(() => {
    if (!fabricCanvas || elements.length === 0) return;

    // Add elements as images
    elements.forEach((element) => {
      FabricImage.fromURL(element.image, {
        crossOrigin: 'anonymous',
      }).then((img) => {
        if (!img) return;
        
        img.set({
          left: element.x,
          top: element.y,
          scaleX: element.width / (img.width || 1),
          scaleY: element.height / (img.height || 1),
          angle: element.rotation,
          opacity: element.opacity / 100,
        });

        // Apply filters
        const filters: any[] = [];
        
        if (element.blur > 0) {
          filters.push(new (window as any).fabric.filters.Blur({ blur: element.blur / 10 }));
        }
        
        if (element.brightness !== 100) {
          filters.push(new (window as any).fabric.filters.Brightness({ 
            brightness: (element.brightness - 100) / 100 
          }));
        }

        if (filters.length > 0) {
          img.filters = filters;
          img.applyFilters();
        }

        fabricCanvas.add(img);
        fabricCanvas.renderAll();
      });
    });
  }, [elements, fabricCanvas]);

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new Textbox('Double-click to edit', {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: '#ffffff',
      fontFamily: 'Arial',
      width: 300,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success('Text added to canvas');
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      fill: '#3b82f6',
      width: 200,
      height: 150,
      stroke: '#ffffff',
      strokeWidth: 2,
    });

    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
    toast.success('Rectangle added to canvas');
  };

  const addCircle = () => {
    if (!fabricCanvas) return;

    const circle = new Circle({
      left: 100,
      top: 100,
      fill: '#8b5cf6',
      radius: 75,
      stroke: '#ffffff',
      strokeWidth: 2,
    });

    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.renderAll();
    toast.success('Circle added to canvas');
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;

    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    setSelectedObject(null);
    toast.success('Object deleted');
  };

  const duplicateSelected = () => {
    if (!fabricCanvas || !selectedObject) return;

    selectedObject.clone((cloned: any) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      toast.success('Object duplicated');
    });
  };

  const applyFilters = () => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== 'image') return;

    const filters: any[] = [];

    if (blur > 0) {
      filters.push(new (window as any).fabric.filters.Blur({ blur: blur / 10 }));
    }

    if (brightness !== 0) {
      filters.push(new (window as any).fabric.filters.Brightness({ brightness: brightness / 100 }));
    }

    if (contrast !== 0) {
      filters.push(new (window as any).fabric.filters.Contrast({ contrast: contrast / 100 }));
    }

    if (saturation !== 0) {
      filters.push(new (window as any).fabric.filters.Saturation({ saturation: saturation / 100 }));
    }

    selectedObject.filters = filters;
    selectedObject.applyFilters();
    fabricCanvas.renderAll();
  };

  useEffect(() => {
    if (selectedObject && selectedObject.type === 'image') {
      applyFilters();
    }
  }, [blur, brightness, contrast, saturation]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Toolbar */}
      <Card className="m-4 p-3 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={addText}
              className="h-8"
            >
              <Type className="h-4 w-4 mr-1" />
              Text
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={addRectangle}
              className="h-8"
            >
              <Square className="h-4 w-4 mr-1" />
              Rectangle
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={addCircle}
              className="h-8"
            >
              <CircleIcon className="h-4 w-4 mr-1" />
              Circle
            </Button>

            <div className="h-6 w-px bg-border mx-2" />

            {selectedObject && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={duplicateSelected}
                  className="h-8"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteSelected}
                  className="h-8"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {selectedObject && selectedObject.type === 'image' && (
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Blur: {blur}</Label>
                <Slider
                  value={[blur]}
                  onValueChange={([value]) => setBlur(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Brightness: {brightness}</Label>
                <Slider
                  value={[brightness]}
                  onValueChange={([value]) => setBrightness(value)}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Contrast: {contrast}</Label>
                <Slider
                  value={[contrast]}
                  onValueChange={([value]) => setContrast(value)}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Saturation: {saturation}</Label>
                <Slider
                  value={[saturation]}
                  onValueChange={([value]) => setSaturation(value)}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="relative shadow-2xl">
          <canvas ref={canvasRef} className="border border-border rounded-lg" />
        </div>
      </div>
    </div>
  );
};