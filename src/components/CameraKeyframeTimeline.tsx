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
    <Card className="p-2 bg-card/50 border border-border/50">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Film className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Keyframes</span>
      </div>
      
      <div className="relative h-8 bg-muted/30 rounded border border-border">
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
                <div className="w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-lg cursor-pointer hover:scale-125 transition-transform" />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="bg-popover border border-border rounded px-1.5 py-1 text-[10px] shadow-lg">
                    <div className="font-medium">{(keyframe.time / 1000).toFixed(1)}s</div>
                    <div className="text-muted-foreground text-[9px] space-y-0.5">
                      <div>Z: {keyframe.transform.zoom.toFixed(1)}x</div>
                      <div>P: {keyframe.transform.panX}, {keyframe.transform.panY}</div>
                      <div>R: {keyframe.transform.rotate}°</div>
                    </div>
                  </div>
                </div>
                
                {/* Delete button on hover */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5"
                  onClick={() => removeKeyframe(keyframe.id)}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
        <span>0s</span>
        <span>{(duration / 1000).toFixed(1)}s</span>
      </div>
    </Card>
  );
};
