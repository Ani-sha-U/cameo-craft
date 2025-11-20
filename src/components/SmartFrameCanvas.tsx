import { useFramesStore } from '@/store/framesStore';
import { useEditorStore } from '@/store/editorStore';
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
  const { frames, selectedFrameId, selectFrame, fps } = useFramesStore();
  const { isPlaying, loop, playbackSpeed, setIsPlaying } = useEditorStore();
  const [tweenedElements, setTweenedElements] = useState<Element[] | undefined>(undefined);
  
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
  const currentFrame = frames[currentIndex];

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Main playback loop with tweening and frame advancement
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!isPlayingRef.current || frames.length === 0) {
        setTweenedElements(undefined);
        return;
      }

      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const frameInterval = 1000 / (fps * playbackSpeed);
      const elapsed = timestamp - lastFrameTimeRef.current;
      const progress = Math.min(elapsed / frameInterval, 1);

      // Apply tweening between current and next frame
      const currentIdx = currentIndexRef.current;
      const nextIdx = currentIdx + 1;
      
      if (nextIdx < frames.length && progress < 1) {
        const tweened = tweenFrameElements(
          frames[currentIdx].elements,
          frames[nextIdx].elements,
          progress
        );
        setTweenedElements(tweened);
      } else {
        setTweenedElements(undefined);
      }

      // Advance to next frame when interval elapsed
      if (elapsed >= frameInterval) {
        let nextIndex = currentIdx + 1;
        
        if (nextIndex >= frames.length) {
          if (loop) {
            nextIndex = 0;
          } else {
            setIsPlaying(false);
            isPlayingRef.current = false;
            setTweenedElements(undefined);
            lastFrameTimeRef.current = 0;
            return;
          }
        }
        
        selectFrame(frames[nextIndex].id);
        lastFrameTimeRef.current = timestamp;
      }

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
