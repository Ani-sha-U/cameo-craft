import { useFramesStore } from "@/store/framesStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef } from "react";

export const FramePlayback = () => {
  const { 
    frames, 
    selectedFrameId, 
    isPlaying, 
    fps, 
    selectFrame, 
    setIsPlaying, 
    setFps 
  } = useFramesStore();
  
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const frameInterval = 1000 / fps;

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        const nextIndex = (currentIndex + 1) % frames.length;
        selectFrame(frames[nextIndex].id);
        lastFrameTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentIndex, frames, fps, selectFrame]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      lastFrameTimeRef.current = 0;
    }
  };

  const handlePrevFrame = () => {
    if (currentIndex > 0) {
      selectFrame(frames[currentIndex - 1].id);
    }
  };

  const handleNextFrame = () => {
    if (currentIndex < frames.length - 1) {
      selectFrame(frames[currentIndex + 1].id);
    }
  };

  const handleFrameSelect = (index: number) => {
    selectFrame(frames[index].id);
  };

  if (frames.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-background/50 border-t border-border">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => selectFrame(frames[0].id)}
          disabled={currentIndex === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevFrame}
          disabled={currentIndex === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextFrame}
          disabled={currentIndex === frames.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => selectFrame(frames[frames.length - 1].id)}
          disabled={currentIndex === frames.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="flex-1 px-4">
          <Slider
            value={[currentIndex]}
            min={0}
            max={frames.length - 1}
            step={1}
            onValueChange={([value]) => handleFrameSelect(value)}
            className="cursor-pointer"
          />
        </div>

        <span className="text-sm text-muted-foreground min-w-[80px] text-right">
          Frame {currentIndex + 1} / {frames.length}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground">FPS:</label>
        <Slider
          value={[fps]}
          min={1}
          max={60}
          step={1}
          onValueChange={([value]) => setFps(value)}
          className="w-32"
        />
        <span className="text-sm min-w-[40px]">{fps}</span>
      </div>
    </div>
  );
};