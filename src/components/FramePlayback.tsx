import { useFramesStore } from "@/store/framesStore";
import { useEditorStore } from "@/store/editorStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { tweenFrameElements } from "@/utils/frameTweening";
import { Element } from "@/store/elementsStore";

export const FramePlayback = () => {
  const { 
    frames, 
    selectedFrameId, 
    fps, 
    selectFrame, 
    setFps,
    updateFrameElements 
  } = useFramesStore();

  const { isPlaying, setIsPlaying, loop, playbackSpeed } = useEditorStore();
  
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const [tweenProgress, setTweenProgress] = useState<number>(0);

  const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);

  // Smooth playback with tweening between frames
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setTweenProgress(0);
      return;
    }

    const frameInterval = 1000 / (fps * playbackSpeed);
    const tweenSteps = 4; // Number of tween steps between frames for smooth motion

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      const progress = Math.min(elapsed / frameInterval, 1);
      
      // Update tween progress for smooth interpolation
      setTweenProgress(progress);

      if (elapsed >= frameInterval) {
        let nextIndex = currentIndex + 1;
        
        if (nextIndex >= frames.length) {
          if (loop) {
            nextIndex = 0;
          } else {
            setIsPlaying(false);
            setTweenProgress(0);
            return;
          }
        }
        
        selectFrame(frames[nextIndex].id);
        lastFrameTimeRef.current = timestamp;
        setTweenProgress(0);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setTweenProgress(0);
    };
  }, [isPlaying, currentIndex, frames, fps, playbackSpeed, loop, selectFrame, setIsPlaying]);

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
    <div className="flex flex-col gap-2 p-2 bg-background/50 border-t border-border">
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => selectFrame(frames[0].id)}
          disabled={currentIndex === 0}
        >
          <SkipBack className="h-3 w-3" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handlePrevFrame}
          disabled={currentIndex === 0}
        >
          <SkipBack className="h-3 w-3" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          className="h-7 w-7"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleNextFrame}
          disabled={currentIndex === frames.length - 1}
        >
          <SkipForward className="h-3 w-3" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => selectFrame(frames[frames.length - 1].id)}
          disabled={currentIndex === frames.length - 1}
        >
          <SkipForward className="h-3 w-3" />
        </Button>

        <div className="flex-1 px-2">
          <Slider
            value={[currentIndex]}
            min={0}
            max={frames.length - 1}
            step={1}
            onValueChange={([value]) => handleFrameSelect(value)}
            className="cursor-pointer"
          />
        </div>

        <span className="text-xs text-muted-foreground min-w-[60px] text-right">
          {currentIndex + 1}/{frames.length}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground min-w-[30px]">FPS:</label>
        <Slider
          value={[fps]}
          min={1}
          max={60}
          step={1}
          onValueChange={([value]) => setFps(value)}
          className="flex-1"
        />
        <span className="text-xs min-w-[30px]">{fps}</span>
      </div>
    </div>
  );
};