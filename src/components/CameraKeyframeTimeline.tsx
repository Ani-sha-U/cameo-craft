import { useCameraStore } from "@/store/cameraStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Film, Trash2 } from "lucide-react";

export const CameraKeyframeTimeline = () => {
  const { keyframes, removeKeyframe, duration } = useCameraStore();

  if (keyframes.length === 0) {
    return null;
  }

  return (
    <Card className="p-3 bg-card/50 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Film className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Camera Keyframes</span>
      </div>
      
      <div className="relative h-12 bg-muted/30 rounded border border-border">
        {/* Timeline markers */}
        {keyframes.map((keyframe) => {
          const position = (keyframe.time / duration) * 100;
          
          return (
            <div
              key={keyframe.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `${position}%` }}
            >
              <div className="relative">
                <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-lg cursor-pointer hover:scale-125 transition-transform" />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-popover border border-border rounded px-2 py-1 text-xs shadow-lg">
                    <div className="font-medium">{(keyframe.time / 1000).toFixed(1)}s</div>
                    <div className="text-muted-foreground text-[10px] space-y-0.5">
                      <div>Zoom: {keyframe.transform.zoom.toFixed(2)}x</div>
                      <div>Pan: {keyframe.transform.panX}, {keyframe.transform.panY}</div>
                      <div>Rotate: {keyframe.transform.rotate}°</div>
                      <div>Dolly: {keyframe.transform.dolly}</div>
                    </div>
                  </div>
                </div>
                
                {/* Delete button on hover */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  onClick={() => removeKeyframe(keyframe.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>0s</span>
        <span>{(duration / 1000).toFixed(1)}s</span>
      </div>
    </Card>
  );
};
