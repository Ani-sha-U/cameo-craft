import { useCameraStore } from "@/store/cameraStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Film, Trash2, Edit, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const CameraKeyframeTimeline = () => {
  const { 
    keyframes, 
    currentTime,
    duration, 
    selectedKeyframeId,
    removeKeyframe, 
    selectKeyframe,
    loadKeyframe,
    moveKeyframe,
    setCurrentTime,
    exportCameraPath,
  } = useCameraStore();

  const [draggingKeyframe, setDraggingKeyframe] = useState<string | null>(null);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const getTimeFromPosition = (clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingKeyframe || draggingPlayhead) return;
    const newTime = getTimeFromPosition(e.clientX);
    setCurrentTime(newTime);
  };

  const handleKeyframeMouseDown = (e: React.MouseEvent, keyframeId: string) => {
    e.stopPropagation();
    setDraggingKeyframe(keyframeId);
    selectKeyframe(keyframeId);
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingPlayhead(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggingKeyframe) {
      const newTime = getTimeFromPosition(e.clientX);
      moveKeyframe(draggingKeyframe, newTime);
    } else if (draggingPlayhead) {
      const newTime = getTimeFromPosition(e.clientX);
      setCurrentTime(newTime);
    }
  };

  const handleMouseUp = () => {
    setDraggingKeyframe(null);
    setDraggingPlayhead(false);
  };

  // Add mouse event listeners
  useEffect(() => {
    if (draggingKeyframe || draggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingKeyframe, draggingPlayhead]);

  if (keyframes.length === 0 && currentTime === 0) {
    return null;
  }

  const playheadPosition = (currentTime / duration) * 100;

  return (
    <Card className="p-3 bg-card/50 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Camera Keyframes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {(currentTime / 1000).toFixed(2)}s / {(duration / 1000).toFixed(1)}s
          </div>
          {keyframes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={exportCameraPath}
              className="h-7 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export JSON
            </Button>
          )}
        </div>
      </div>
      
      <div 
        ref={timelineRef}
        className="relative h-12 bg-muted/30 rounded border border-border cursor-pointer select-none"
        onClick={handleTimelineClick}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 cursor-ew-resize"
          style={{ left: `${playheadPosition}%` }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rotate-45" />
        </div>

        {/* Time markers */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-1">
          {[0, 1, 2, 3, 4, 5].map((sec) => (
            <div key={sec} className="text-[9px] text-muted-foreground">
              {sec}s
            </div>
          ))}
        </div>

        {/* Keyframe markers */}
        {keyframes.map((keyframe) => {
          const position = (keyframe.time / duration) * 100;
          const isSelected = selectedKeyframeId === keyframe.id;
          
          return (
            <div
              key={keyframe.id}
              className="absolute top-2 -translate-x-1/2 group z-10"
              style={{ left: `${position}%` }}
              onMouseDown={(e) => handleKeyframeMouseDown(e, keyframe.id)}
            >
              <div className="relative">
                {/* Keyframe diamond */}
                <div 
                  className={`w-4 h-4 rotate-45 cursor-move transition-all ${
                    isSelected 
                      ? 'bg-primary border-2 border-primary-foreground scale-110' 
                      : 'bg-primary/80 border-2 border-background hover:scale-110'
                  }`}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                  <div className="bg-popover border border-border rounded px-2 py-1.5 text-[10px] shadow-lg">
                    <div className="font-semibold text-foreground mb-1">
                      {(keyframe.time / 1000).toFixed(2)}s
                    </div>
                    <div className="text-muted-foreground space-y-0.5">
                      <div>Zoom: {keyframe.transform.zoom.toFixed(2)}x</div>
                      <div>Pan: ({keyframe.transform.panX}, {keyframe.transform.panY})</div>
                      <div>Rotate: {keyframe.transform.rotate}°</div>
                      <div>Dolly: {keyframe.transform.dolly}</div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadKeyframe(keyframe.id);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKeyframe(keyframe.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {keyframes.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          💡 Click timeline to scrub • Drag keyframes to move • Click Edit to load values
        </div>
      )}
    </Card>
  );
};