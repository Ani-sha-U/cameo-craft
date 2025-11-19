import { useElementsStore, Element } from "@/store/elementsStore";
import { useFramesStore } from "@/store/framesStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Trash2, Layers, Copy, ArrowRight } from "lucide-react";
import { useVideoStore } from "@/store/videoStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const ElementsPanel = () => {
  const { videoUrl } = useVideoStore();
  const { 
    elements, 
    selectedElementId, 
    isProcessing, 
    setSelectedElement, 
    updateElement,
    removeElement,
    separateElements 
  } = useElementsStore();

  const { frames, selectedFrameId, updateFrameElements } = useFramesStore();

  const selectedElement = elements.find(el => el.id === selectedElementId);
  const currentFrame = frames.find(f => f.id === selectedFrameId);
  
  // Check if selected element is in the current frame
  const elementInFrame = currentFrame?.elements.find(el => el.id === selectedElementId);

  const handleSeparate = () => {
    if (videoUrl) {
      separateElements(videoUrl);
    }
  };

  const handleDragStart = (e: React.DragEvent, element: Element) => {
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.setData('elementData', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCopyToNextFrame = () => {
    if (!selectedElementId || !selectedFrameId || !currentFrame) {
      toast.error("No element or frame selected");
      return;
    }

    const element = elementInFrame || selectedElement;
    if (!element) return;

    const currentIndex = frames.findIndex(f => f.id === selectedFrameId);
    if (currentIndex === -1 || currentIndex >= frames.length - 1) {
      toast.error("No next frame available");
      return;
    }

    const nextFrame = frames[currentIndex + 1];
    const newElement = {
      ...element,
      id: `${element.id}_copy_${Date.now()}`,
    };

    updateFrameElements(nextFrame.id, [...nextFrame.elements, newElement]);
    toast.success(`Copied element to next frame`);
  };

  const handleCopyToAllFrames = () => {
    if (!selectedElementId) {
      toast.error("No element selected");
      return;
    }

    const element = elementInFrame || selectedElement;
    if (!element) return;

    let copiedCount = 0;
    frames.forEach((frame) => {
      if (frame.id !== selectedFrameId) {
        const newElement = {
          ...element,
          id: `${element.id}_copy_${frame.id}_${Date.now()}`,
        };
        updateFrameElements(frame.id, [...frame.elements, newElement]);
        copiedCount++;
      }
    });

    toast.success(`Copied element to ${copiedCount} frames`);
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Elements</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Separate elements & drag to frames
        </p>
        
        <Button 
          onClick={handleSeparate}
          disabled={isProcessing || !videoUrl}
          className="w-full"
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Separating...
            </>
          ) : (
            "🔮 Separate Elements"
          )}
        </Button>

        {selectedElement && frames.length > 0 && (
          <div className="mt-3 space-y-2">
            <Button
              onClick={handleCopyToNextFrame}
              disabled={!selectedFrameId}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Copy className="mr-2 h-3 w-3" />
              Copy to Next Frame
            </Button>
            <Button
              onClick={handleCopyToAllFrames}
              disabled={frames.length === 0}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Layers className="mr-2 h-3 w-3" />
              Copy to All Frames
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {elements.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <p>No elements extracted yet.</p>
              <p className="mt-2">Generate a video first, then click "Separate Elements".</p>
            </div>
          ) : (
            elements.map((element) => (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, element)}
                className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
                  selectedElementId === element.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedElement(element.id)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={element.image} 
                    alt={element.label}
                    className="w-12 h-12 object-cover rounded bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{element.label}</p>
                    <p className="text-xs text-muted-foreground">Drag to frame or canvas</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(element.id);
                    }}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {currentFrame && currentFrame.elements.length > 0 && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">Frame Elements ({currentFrame.elements.length})</h3>
                {currentFrame.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-2 mb-2 rounded-lg border cursor-pointer transition-all ${
                      selectedElementId === element.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={element.image} 
                        alt={element.label}
                        className="w-8 h-8 object-cover rounded bg-muted"
                      />
                      <p className="text-xs truncate flex-1">{element.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {selectedElement && (
        <div className="p-4 border-t border-border space-y-4 bg-muted/30">
          <h3 className="font-semibold text-sm">Edit Layer</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Opacity: {elementInFrame?.opacity || selectedElement.opacity}%
              </label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[elementInFrame?.opacity || selectedElement.opacity]}
                onValueChange={(value) => {
                  if (elementInFrame && selectedFrameId && currentFrame) {
                    const updated = currentFrame.elements.map(el =>
                      el.id === selectedElementId ? { ...el, opacity: value[0] } : el
                    );
                    updateFrameElements(selectedFrameId, updated);
                  } else {
                    updateElement(selectedElementId!, { opacity: value[0] });
                  }
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Rotation: {elementInFrame?.rotation || selectedElement.rotation}°
              </label>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[elementInFrame?.rotation || selectedElement.rotation]}
                onValueChange={(value) => {
                  if (elementInFrame && selectedFrameId && currentFrame) {
                    const updated = currentFrame.elements.map(el =>
                      el.id === selectedElementId ? { ...el, rotation: value[0] } : el
                    );
                    updateFrameElements(selectedFrameId, updated);
                  } else {
                    updateElement(selectedElementId!, { rotation: value[0] });
                  }
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Blur: {elementInFrame?.blur || selectedElement.blur}px
              </label>
              <Slider
                min={0}
                max={20}
                step={1}
                value={[elementInFrame?.blur || selectedElement.blur]}
                onValueChange={(value) => {
                  if (elementInFrame && selectedFrameId && currentFrame) {
                    const updated = currentFrame.elements.map(el =>
                      el.id === selectedElementId ? { ...el, blur: value[0] } : el
                    );
                    updateFrameElements(selectedFrameId, updated);
                  } else {
                    updateElement(selectedElementId!, { blur: value[0] });
                  }
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Brightness: {elementInFrame?.brightness || selectedElement.brightness}%
              </label>
              <Slider
                min={0}
                max={200}
                step={1}
                value={[elementInFrame?.brightness || selectedElement.brightness]}
                onValueChange={(value) => {
                  if (elementInFrame && selectedFrameId && currentFrame) {
                    const updated = currentFrame.elements.map(el =>
                      el.id === selectedElementId ? { ...el, brightness: value[0] } : el
                    );
                    updateFrameElements(selectedFrameId, updated);
                  } else {
                    updateElement(selectedElementId!, { brightness: value[0] });
                  }
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Glow: {elementInFrame?.glow || selectedElement.glow}px
              </label>
              <Slider
                min={0}
                max={50}
                step={1}
                value={[elementInFrame?.glow || selectedElement.glow]}
                onValueChange={(value) => {
                  if (elementInFrame && selectedFrameId && currentFrame) {
                    const updated = currentFrame.elements.map(el =>
                      el.id === selectedElementId ? { ...el, glow: value[0] } : el
                    );
                    updateFrameElements(selectedFrameId, updated);
                  } else {
                    updateElement(selectedElementId!, { glow: value[0] });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
