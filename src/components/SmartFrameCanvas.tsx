import { useFramesStore } from '@/store/framesStore';
import { useEditorStore } from '@/store/editorStore';
import { FrameCanvas } from './FrameCanvas';
import { tweenFrameElements } from '@/utils/frameTweening';
import { useEffect, useState } from 'react';
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
  const { frames, selectedFrameId } = useFramesStore();
  const { isPlaying } = useEditorStore();
  const [tweenedElements, setTweenedElements] = useState<Element[] | undefined>(undefined);

  const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
  const currentFrame = frames[currentIndex];
  const nextFrame = currentIndex < frames.length - 1 ? frames[currentIndex + 1] : null;

  // Handle tweening during playback
  useEffect(() => {
    if (!isPlaying || !currentFrame || !nextFrame) {
      setTweenedElements(undefined);
      return;
    }

    let animationFrameId: number;
    let startTime: number | null = null;
    const fps = useFramesStore.getState().fps;
    const playbackSpeed = useEditorStore.getState().playbackSpeed;
    const frameDuration = 1000 / (fps * playbackSpeed);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / frameDuration, 1);

      if (progress < 1 && currentFrame && nextFrame) {
        // Calculate tweened elements
        const tweened = tweenFrameElements(
          currentFrame.elements,
          nextFrame.elements,
          progress
        );
        setTweenedElements(tweened);
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setTweenedElements(undefined);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setTweenedElements(undefined);
    };
  }, [isPlaying, currentFrame, nextFrame]);

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
