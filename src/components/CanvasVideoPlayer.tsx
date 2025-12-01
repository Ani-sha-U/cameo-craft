import { useEffect, useRef, useState, useCallback } from "react";
import { Frame } from "@/store/framesStore";
import { renderFrameToCanvas } from "@/utils/frameCompositor";
import { tweenFrameElements } from "@/utils/frameTweening";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface CanvasVideoPlayerProps {
  frames: Frame[];
  fps?: number;
  width?: number;
  height?: number;
  className?: string;
  onFrameChange?: (frameIndex: number) => void;
}

/**
 * Canvas-based video player for stable frame playback
 * Uses direct canvas rendering instead of video element
 * Based on WebAV and ccapture.js architecture
 */
export const CanvasVideoPlayer = ({
  frames,
  fps = 24,
  width = 1920,
  height = 1080,
  className = "",
  onFrameChange,
}: CanvasVideoPlayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const frameInterval = 1000 / fps;

  /**
   * Render a specific frame to canvas
   */
  const renderFrame = useCallback(
    async (frameIndex: number, useInterpolation: boolean = false) => {
      if (!canvasRef.current || frames.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        const currentFrame = frames[frameIndex];
        
        if (!currentFrame) return;

        // Check if we need interpolation between frames
        if (useInterpolation && frameIndex < frames.length - 1) {
          const nextFrame = frames[frameIndex + 1];
          const subFrameProgress = (Date.now() - lastFrameTimeRef.current) / frameInterval;
          const t = Math.min(1, subFrameProgress);

          // Tween elements for smooth interpolation
          const tweenedElements = tweenFrameElements(
            currentFrame.elements,
            nextFrame.elements,
            t,
            true // Enable motion blur
          );

          // Create virtual frame with interpolated elements
          const interpolatedFrame: Frame = {
            ...currentFrame,
            elements: tweenedElements,
          };

          await renderFrameToCanvas(interpolatedFrame, canvas, ctx);
        } else {
          // Render frame directly without interpolation
          await renderFrameToCanvas(currentFrame, canvas, ctx);
        }
      } catch (error) {
        console.error("Frame render error:", error);
      }
    },
    [frames, frameInterval]
  );

  /**
   * Animation loop for playback
   */
  const animate = useCallback(
    (currentTime: number) => {
      if (!isPlaying) return;

      const elapsed = currentTime - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        // Advance to next frame
        setCurrentFrameIndex((prev) => {
          const next = (prev + 1) % frames.length;
          if (onFrameChange) onFrameChange(next);
          return next;
        });

        lastFrameTimeRef.current = currentTime;
        renderFrame(currentFrameIndex, true);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [isPlaying, currentFrameIndex, frames.length, frameInterval, renderFrame, onFrameChange]
  );

  /**
   * Start playback
   */
  const play = useCallback(() => {
    setIsPlaying(true);
    lastFrameTimeRef.current = performance.now();
  }, []);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Seek to specific frame
   */
  const seekToFrame = useCallback(
    (frameIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(frameIndex, frames.length - 1));
      setCurrentFrameIndex(clampedIndex);
      renderFrame(clampedIndex, false);
      if (onFrameChange) onFrameChange(clampedIndex);
    },
    [frames.length, renderFrame, onFrameChange]
  );

  /**
   * Initialize canvas and render first frame
   */
  useEffect(() => {
    if (frames.length > 0) {
      renderFrame(0, false);
      setIsReady(true);
    }
  }, [frames, renderFrame]);

  /**
   * Handle playback loop
   */
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  /**
   * Re-render current frame when it changes
   */
  useEffect(() => {
    if (!isPlaying && isReady) {
      renderFrame(currentFrameIndex, false);
    }
  }, [currentFrameIndex, isPlaying, isReady, renderFrame]);

  if (frames.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
        <p className="text-sm text-muted-foreground">No frames to display</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Canvas Display */}
      <div className="relative rounded-lg overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto"
        />

        {/* Frame Counter */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-mono">
          {currentFrameIndex + 1} / {frames.length}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex flex-col gap-2 bg-background/50 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => seekToFrame(currentFrameIndex - 1)}
            disabled={currentFrameIndex === 0}
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="default"
            onClick={() => (isPlaying ? pause() : play())}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => seekToFrame(currentFrameIndex + 1)}
            disabled={currentFrameIndex === frames.length - 1}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Timeline Scrubber */}
        <Slider
          value={[currentFrameIndex]}
          min={0}
          max={frames.length - 1}
          step={1}
          onValueChange={(value) => seekToFrame(value[0])}
          className="cursor-pointer"
        />

        {/* Playback Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fps} FPS</span>
          <span>{(frames.length / fps).toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
};
