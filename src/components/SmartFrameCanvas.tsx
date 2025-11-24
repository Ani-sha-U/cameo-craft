import { useFramesStore } from '@/store/framesStore';
import { useEditorStore } from '@/store/editorStore';
import { useCameraStore } from '@/store/cameraStore';
import { FrameCanvas } from './FrameCanvas';
import { tweenFrameElements } from '@/utils/frameTweening';
import { useEffect, useState, useRef } from 'react';
import { Element } from '@/store/elementsStore';

interface SmartFrameCanvasProps {
  className?: string;
}

/**
 * Smart wrapper around FrameCanvas that automatically handles:
 * - Displaying the current frame
 * - Smooth tweening between frames during playback
 * - Real-time element updates
 */
export const SmartFrameCanvas = ({ className }: SmartFrameCanvasProps) => {
  const { frames, selectedFrameId, selectFrame, fps, preloadAllFrames, preloadedFrames } = useFramesStore();
  const { isPlaying, loop, playbackSpeed, setIsPlaying } = useEditorStore();
  const { getTransformAtTime, duration, setCurrentTime: setCameraTime } = useCameraStore();
  const [tweenedElements, setTweenedElements] = useState<Element[] | undefined>(undefined);
  
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const preloadedRef = useRef<boolean>(false);

  const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
  const currentFrame = frames[currentIndex];

  // Preload all frames when frames change
  useEffect(() => {
    if (frames.length > 0 && !preloadedRef.current) {
      preloadedRef.current = true;
      preloadAllFrames().then(() => {
        console.log(`Preloaded ${frames.length} frames`);
      });
    }
  }, [frames, preloadAllFrames]);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Main playback loop with timestamp-based frame advancement
  useEffect(() => {
    let startTimeRef = 0;
    
    const animate = (timestamp: number) => {
      if (!isPlayingRef.current || frames.length === 0) {
        setTweenedElements(undefined);
        return;
      }

      // Initialize timestamp on first frame
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
        startTimeRef = timestamp;
      }

      // Calculate elapsed time and sync camera
      const totalElapsed = timestamp - startTimeRef;
      setCameraTime(totalElapsed);

      // Calculate frame duration based on FPS and playback speed
      const frameDuration = 1000 / (fps * playbackSpeed);
      const elapsed = timestamp - lastFrameTimeRef.current;

      // Only advance to next frame when enough time has elapsed
      if (elapsed >= frameDuration) {
        const currentIdx = currentIndexRef.current;
        let nextIndex = currentIdx + 1;
        
        // Handle end of timeline
        if (nextIndex >= frames.length) {
          if (loop) {
            nextIndex = 0;
            startTimeRef = timestamp;
          } else {
            setIsPlaying(false);
            isPlayingRef.current = false;
            setTweenedElements(undefined);
            lastFrameTimeRef.current = 0;
            setCameraTime(0);
            return;
          }
        }
        
        // Advance to next frame
        selectFrame(frames[nextIndex].id);
        
        // Reset timer for next frame
        lastFrameTimeRef.current = timestamp - (elapsed - frameDuration);
        
        // Clear tweening when advancing
        setTweenedElements(undefined);
      } else {
        // Calculate smooth interpolation progress between frames
        const progress = elapsed / frameDuration;
        const currentIdx = currentIndexRef.current;
        const nextIdx = currentIdx + 1;
        
        // Apply tweening only if there's a next frame
        if (nextIdx < frames.length) {
          const tweened = tweenFrameElements(
            frames[currentIdx].elements,
            frames[nextIdx].elements,
            progress,
            true, // enableMotionBlur
            currentIdx, // current frame index
            nextIdx // next frame index
          );
          setTweenedElements(tweened);
        }
      }

      // Continue animation loop
      if (isPlayingRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlayingRef.current && frames.length > 0) {
      lastFrameTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setTweenedElements(undefined);
      lastFrameTimeRef.current = 0;
    };
  }, [isPlaying, frames, fps, playbackSpeed, loop, selectFrame, setIsPlaying]);

  if (!currentFrame) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
        <p className="text-muted-foreground">No frame selected</p>
      </div>
    );
  }

  return (
    <FrameCanvas
      frameId={selectedFrameId || undefined}
      className={className}
      tweenedElements={isPlaying ? tweenedElements : undefined}
    />
  );
};
