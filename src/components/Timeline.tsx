import { useRef, useState, useEffect } from "react";
import { useTimelineStore, TransitionType } from "@/store/timelineStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Play, 
  Pause, 
  Scissors, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  Film
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVideoStore } from "@/store/videoStore";

const TRANSITION_LABELS: Record<TransitionType, string> = {
  'none': 'None',
  'crossfade': 'Crossfade',
  'slide': 'Slide',
  'zoom': 'Zoom',
  'fade-to-black': 'Fade to Black',
};

export const Timeline = () => {
  const { videoUrl } = useVideoStore();
  const {
    clips,
    selectedClipId,
    playheadPosition,
    totalDuration,
    isPlaying,
    zoom,
    addClip,
    removeClip,
    updateClip,
    reorderClip,
    splitClip,
    selectClip,
    setPlayheadPosition,
    play,
    pause,
    setZoom,
  } = useTimelineStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [resizingClip, setResizingClip] = useState<{ id: string; side: 'start' | 'end' } | null>(null);
  const [splitMode, setSplitMode] = useState(false);

  const timelineWidth = (totalDuration / 1000) * zoom;

  const getTimeFromPosition = (clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / timelineWidth));
    return percentage * totalDuration;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingClip || draggingPlayhead || resizingClip) return;
    
    if (splitMode) {
      const clickTime = getTimeFromPosition(e.clientX);
      const clip = clips.find(c => 
        clickTime >= c.startTime && clickTime < c.startTime + c.duration
      );
      
      if (clip) {
        splitClip(clip.id, clickTime);
        setSplitMode(false);
      }
      return;
    }
    
    const newTime = getTimeFromPosition(e.clientX);
    setPlayheadPosition(newTime);
  };

  const handleClipMouseDown = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    setDraggingClip(clipId);
    selectClip(clipId);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, clipId: string, side: 'start' | 'end') => {
    e.stopPropagation();
    setResizingClip({ id: clipId, side });
    selectClip(clipId);
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingPlayhead(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggingClip) {
      const newTime = getTimeFromPosition(e.clientX);
      reorderClip(draggingClip, newTime);
    } else if (draggingPlayhead) {
      const newTime = getTimeFromPosition(e.clientX);
      setPlayheadPosition(newTime);
    } else if (resizingClip) {
      const clip = clips.find(c => c.id === resizingClip.id);
      if (!clip) return;
      
      const mouseTime = getTimeFromPosition(e.clientX);
      
      if (resizingClip.side === 'start') {
        const maxStart = clip.startTime + clip.duration - 500;
        const newStart = Math.max(0, Math.min(mouseTime, maxStart));
        const newDuration = (clip.startTime + clip.duration) - newStart;
        updateClip(resizingClip.id, { 
          startTime: newStart, 
          duration: newDuration,
          trimStart: clip.trimStart + (newStart - clip.startTime)
        });
      } else {
        const minEnd = clip.startTime + 500;
        const newEnd = Math.max(minEnd, mouseTime);
        const newDuration = newEnd - clip.startTime;
        updateClip(resizingClip.id, { duration: newDuration });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingClip(null);
    setDraggingPlayhead(false);
    setResizingClip(null);
  };

  useEffect(() => {
    if (draggingClip || draggingPlayhead || resizingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingClip, draggingPlayhead, resizingClip]);

  const selectedClip = clips.find(c => c.id === selectedClipId);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 100);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs}`;
  };

  return (
    <Card className="p-3 bg-card border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2">
            <Film className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Step 9: Timeline Editing</span>
          </div>
          <div className="h-4 w-px bg-border" />
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => videoUrl && addClip(videoUrl, `Clip ${clips.length + 1}`)}
            disabled={!videoUrl}
            className="h-7"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Clip
          </Button>
          
          <Button
            size="sm"
            variant={splitMode ? "default" : "outline"}
            onClick={() => setSplitMode(!splitMode)}
            disabled={clips.length === 0}
            className="h-7"
          >
            <Scissors className="h-3 w-3 mr-1" />
            {splitMode ? 'Click to Split' : 'Split'}
          </Button>
          
          {selectedClipId && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeClip(selectedClipId)}
              className="h-7"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom(zoom - 20)}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          
          <span className="text-xs text-muted-foreground min-w-[80px] text-center">
            {formatTime(playheadPosition)} / {formatTime(totalDuration)}
          </span>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom(zoom + 20)}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={isPlaying ? pause : play}
            disabled={clips.length === 0}
            className="h-7"
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative">
        {/* Time Ruler */}
        <div className="h-6 bg-muted/50 border-b border-border relative mb-1">
          <div className="absolute inset-0 flex">
            {Array.from({ length: Math.ceil(totalDuration / 1000) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-[9px] text-muted-foreground"
                style={{ left: `${(i * 1000 / totalDuration) * 100}%` }}
              >
                <div className="h-2 w-px bg-border" />
                <span className="ml-1">{i}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clips Track */}
        <div 
          ref={timelineRef}
          className="relative h-20 bg-muted/30 rounded border border-border overflow-x-auto cursor-pointer"
          onClick={handleTimelineClick}
          style={{ minWidth: `${timelineWidth}px` }}
        >
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-destructive z-30 cursor-ew-resize"
            style={{ left: `${(playheadPosition / totalDuration) * 100}%` }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-destructive" />
          </div>

          {/* Clips */}
          {clips.map((clip) => {
            const left = (clip.startTime / totalDuration) * 100;
            const width = (clip.duration / totalDuration) * 100;
            const isSelected = selectedClipId === clip.id;

            return (
              <div
                key={clip.id}
                className={`absolute top-2 bottom-2 rounded cursor-move group transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: clip.color,
                }}
                onMouseDown={(e) => handleClipMouseDown(e, clip.id)}
              >
                {/* Clip Content */}
                <div className="relative h-full flex items-center justify-center px-2">
                  <span className="text-xs text-white font-medium truncate">
                    {clip.label}
                  </span>
                  
                  {/* Transition Indicator */}
                  {clip.transition !== 'none' && (
                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[8px] px-1 rounded-tl">
                      {TRANSITION_LABELS[clip.transition]}
                    </div>
                  )}
                </div>

                {/* Resize Handles */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, clip.id, 'start')}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeMouseDown(e, clip.id, 'end')}
                />
              </div>
            );
          })}

          {/* Empty State */}
          {clips.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Click "+ Add Clip" to start building your timeline
            </div>
          )}
        </div>
      </div>

      {/* Clip Properties */}
      {selectedClip && (
        <div className="mt-3 p-2 bg-muted/30 rounded border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs">
                <span className="font-medium">{selectedClip.label}</span>
                <span className="text-muted-foreground ml-2">
                  {formatTime(selectedClip.duration)}
                </span>
              </div>
              
              <Select
                value={selectedClip.transition}
                onValueChange={(value) => 
                  updateClip(selectedClip.id, { transition: value as TransitionType })
                }
              >
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {TRANSITION_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {clips.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          💡 Drag clips to reorder • Drag edges to trim • Click Split and then click clip to cut
        </div>
      )}
    </Card>
  );
};