import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  StepBack, 
  StepForward,
  Repeat,
  Gauge
} from "lucide-react";
import { useEditorStore, PlaybackSpeed } from "@/store/editorStore";
import { useFramesStore } from "@/store/framesStore";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const TransportControls = () => {
  const { 
    isPlaying, 
    playbackSpeed, 
    loop,
    togglePlayPause,
    setPlaybackSpeed,
    toggleLoop,
    goToStart,
    goToEnd,
    nextFrame,
    prevFrame,
  } = useEditorStore();
  
  const { frames, selectedFrameId, selectFrame } = useFramesStore();
  
  const currentIndex = frames.findIndex(f => f.id === selectedFrameId);
  const progress = frames.length > 0 ? ((currentIndex + 1) / frames.length) * 100 : 0;

  const handleScrub = (value: number[]) => {
    const index = Math.floor((value[0] / 100) * frames.length);
    if (frames[index]) {
      selectFrame(frames[index].id);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-card/50 border-t border-border">
      {/* Progress Bar */}
      <div className="px-2">
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={handleScrub}
          className="cursor-pointer"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Go to Start */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={goToStart}
            title="Go to Start (Home)"
          >
            <SkipBack className="h-3 w-3" />
          </Button>
          
          {/* Previous Frame */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={prevFrame}
            disabled={currentIndex === 0}
            title="Previous Frame (←)"
          >
            <StepBack className="h-3 w-3" />
          </Button>
          
          {/* Play/Pause */}
          <Button
            variant={isPlaying ? "destructive" : "default"}
            size="icon"
            className="h-8 w-8"
            onClick={togglePlayPause}
            disabled={frames.length === 0}
            title="Play/Pause (Space/K)"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          {/* Next Frame */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={nextFrame}
            disabled={currentIndex === frames.length - 1}
            title="Next Frame (→)"
          >
            <StepForward className="h-3 w-3" />
          </Button>
          
          {/* Go to End */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={goToEnd}
            title="Go to End (End)"
          >
            <SkipForward className="h-3 w-3" />
          </Button>

          {/* Loop Toggle */}
          <Button
            variant={loop ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={toggleLoop}
            title="Loop Playback"
          >
            <Repeat className={cn("h-3 w-3", loop && "text-primary-foreground")} />
          </Button>
        </div>

        {/* Frame Counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1} / {frames.length}
          </span>
          
          {/* Playback Speed */}
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(value) => setPlaybackSpeed(parseFloat(value) as PlaybackSpeed)}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <Gauge className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.25">0.25x</SelectItem>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-[10px] text-muted-foreground text-center">
        Space: Play/Pause • ←/→: Frame • Shift+←/→: Seek • I/O: In/Out • Ctrl+D: Duplicate
      </div>
    </div>
  );
};