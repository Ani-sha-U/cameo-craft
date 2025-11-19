import { useElementsStore, Element } from "@/store/elementsStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Trash2, Layers } from "lucide-react";
import { useVideoStore } from "@/store/videoStore";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const handleSeparate = () => {
    if (videoUrl) {
      separateElements(videoUrl);
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Elements</h2>
        </div>
        
        <Button 
          onClick={handleSeparate}
          disabled={isProcessing || !videoUrl}
          className="w-full"
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Separate Elements"
          )}
        </Button>
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
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
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
        </div>
      </ScrollArea>

      {selectedElement && (
        <div className="p-4 border-t border-border space-y-4 bg-muted/30">
          <h3 className="font-semibold text-sm">Edit Layer</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Opacity: {selectedElement.opacity}%
              </label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[selectedElement.opacity]}
                onValueChange={([value]) => 
                  updateElement(selectedElement.id, { opacity: value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Rotation: {selectedElement.rotation}°
              </label>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[selectedElement.rotation]}
                onValueChange={([value]) => 
                  updateElement(selectedElement.id, { rotation: value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Blur: {selectedElement.blur}px
              </label>
              <Slider
                min={0}
                max={20}
                step={1}
                value={[selectedElement.blur]}
                onValueChange={([value]) => 
                  updateElement(selectedElement.id, { blur: value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Brightness: {selectedElement.brightness}%
              </label>
              <Slider
                min={0}
                max={200}
                step={1}
                value={[selectedElement.brightness]}
                onValueChange={([value]) => 
                  updateElement(selectedElement.id, { brightness: value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Glow: {selectedElement.glow}px
              </label>
              <Slider
                min={0}
                max={50}
                step={1}
                value={[selectedElement.glow]}
                onValueChange={([value]) => 
                  updateElement(selectedElement.id, { glow: value })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};