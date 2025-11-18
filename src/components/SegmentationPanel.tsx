import { useRef } from "react";
import { useSegmentationStore } from "@/store/segmentationStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Upload, Eye, EyeOff, Download, Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export const SegmentationPanel = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    layers,
    isProcessing,
    featherAmount,
    setFeatherAmount,
    processImage,
    toggleLayerVisibility,
    exportLayer,
    clearLayers,
    addLayerToTimeline,
  } = useSegmentationStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Layer Separation</h2>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full"
          variant="default"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>
      </div>

      {layers.length > 0 && (
        <>
          <div className="p-4 border-b border-border">
            <label className="text-sm font-medium mb-2 block">
              Edge Feathering: {featherAmount.toFixed(2)}
            </label>
            <Slider
              value={[featherAmount]}
              onValueChange={([value]) => setFeatherAmount(value)}
              min={0}
              max={1}
              step={0.01}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Adjust to smooth segmentation edges
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {layers.map((layer) => (
              <Card key={layer.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{layer.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="h-8 w-8"
                    >
                      {layer.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => exportLayer(layer.id)}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "relative aspect-video bg-checkerboard rounded overflow-hidden mb-2",
                    !layer.visible && "opacity-30"
                  )}
                >
                  <img
                    src={layer.url}
                    alt={layer.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addLayerToTimeline(layer.id)}
                  className="w-full"
                >
                  <Layers className="mr-2 h-3 w-3" />
                  Add to Timeline
                </Button>
              </Card>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              onClick={clearLayers}
              className="w-full"
            >
              Clear All Layers
            </Button>
          </div>
        </>
      )}

      {layers.length === 0 && !isProcessing && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Upload an image to start</p>
            <p className="text-xs mt-1">Separate person, objects & background</p>
          </div>
        </div>
      )}
    </div>
  );
};
