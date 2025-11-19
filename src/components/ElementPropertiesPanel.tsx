import { useElementsStore } from "@/store/elementsStore";
import { useFramesStore } from "@/store/framesStore";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

export const ElementPropertiesPanel = () => {
  const { elements, selectedElementId, updateElement } = useElementsStore();
  const { frames, selectedFrameId, updateFrameElements } = useFramesStore();

  const currentFrame = frames.find((f) => f.id === selectedFrameId);
  const displayElements = selectedFrameId && currentFrame ? currentFrame.elements : elements;
  const selectedElement = displayElements.find((el) => el.id === selectedElementId);

  if (!selectedElement) return null;

  const handleUpdate = (updates: any) => {
    if (selectedFrameId && currentFrame) {
      const updatedElements = currentFrame.elements.map((el) =>
        el.id === selectedElementId ? { ...el, ...updates } : el
      );
      updateFrameElements(selectedFrameId, updatedElements);
    } else {
      updateElement(selectedElementId, updates);
    }
  };

  const handleMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const maskImage = event.target?.result as string;
      handleUpdate({ maskImage });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 border-t border-border space-y-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Element Properties</h3>
        <span className="text-xs text-muted-foreground">{selectedElement.label}</span>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Opacity</Label>
          <Slider
            value={[selectedElement.opacity]}
            min={0}
            max={100}
            step={1}
            onValueChange={([value]) => handleUpdate({ opacity: value })}
          />
        </div>

        <div>
          <Label className="text-xs">Rotation</Label>
          <Slider
            value={[selectedElement.rotation]}
            min={0}
            max={360}
            step={1}
            onValueChange={([value]) => handleUpdate({ rotation: value })}
          />
        </div>

        <div>
          <Label className="text-xs">Blur</Label>
          <Slider
            value={[selectedElement.blur]}
            min={0}
            max={20}
            step={0.5}
            onValueChange={([value]) => handleUpdate({ blur: value })}
          />
        </div>

        <div>
          <Label className="text-xs">Brightness</Label>
          <Slider
            value={[selectedElement.brightness]}
            min={0}
            max={200}
            step={1}
            onValueChange={([value]) => handleUpdate({ brightness: value })}
          />
        </div>

        <div>
          <Label className="text-xs">Glow</Label>
          <Slider
            value={[selectedElement.glow]}
            min={0}
            max={50}
            step={1}
            onValueChange={([value]) => handleUpdate({ glow: value })}
          />
        </div>

        <div>
          <Label className="text-xs mb-2 block">Blend Mode</Label>
          <Select
            value={selectedElement.blendMode}
            onValueChange={(value) => handleUpdate({ blendMode: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="multiply">Multiply</SelectItem>
              <SelectItem value="screen">Screen</SelectItem>
              <SelectItem value="overlay">Overlay</SelectItem>
              <SelectItem value="darken">Darken</SelectItem>
              <SelectItem value="lighten">Lighten</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-2 block">Mask Image</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleMaskUpload}
              className="hidden"
              id="mask-upload"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => document.getElementById('mask-upload')?.click()}
            >
              <Upload className="h-3 w-3 mr-2" />
              Upload Mask
            </Button>
            {selectedElement.maskImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdate({ maskImage: undefined })}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};