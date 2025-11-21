import { useFramesStore } from '@/store/framesStore';
import { useElementsStore } from '@/store/elementsStore';
import { useCameraStore } from '@/store/cameraStore';
import { useEffect, useRef } from 'react';

interface FrameCanvasProps {
  frameId?: string;
  className?: string;
  width?: number;
  height?: number;
  onFrameRendered?: (canvas: HTMLCanvasElement) => void;
  tweenedElements?: Element[]; // Override frame elements with tweened versions
}

interface Element {
  id: string;
  label: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blur: number;
  brightness: number;
  glow?: number;
  blendMode?: string;
  mask?: string;
}

export const FrameCanvas = ({ 
  frameId, 
  className = "w-full h-auto", 
  width = 1920, 
  height = 1080,
  onFrameRendered,
  tweenedElements 
}: FrameCanvasProps) => {
  const { frames, selectedFrameId, preloadedFrames } = useFramesStore();
  const { currentTransform } = useCameraStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetFrameId = frameId || selectedFrameId;
  const currentFrame = frames.find(f => f.id === targetFrameId);

  useEffect(() => {
    if (!canvasRef.current || !currentFrame) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use tweened elements if provided, otherwise use frame elements
    const elementsToRender = tweenedElements || currentFrame.elements;

    // Use masked thumbnail if available, otherwise use original
    const frameImageSrc = currentFrame.maskedThumbnail || currentFrame.thumbnail;
    
    // CRITICAL: Determine which image to use - preloaded for originals, fresh load for masked
    const preloadedImg = preloadedFrames.get(currentFrame.id);
    const usePreloaded = preloadedImg && preloadedImg.complete && !currentFrame.maskedThumbnail;
    
    // Single render function to ensure consistent draw order
    const renderFrame = (frameImg: HTMLImageElement) => {
      // SINGLE RENDER CYCLE - Clear once at the start
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state before applying camera transforms
      ctx.save();

      // Apply camera transforms
      const { zoom, panX, panY, rotate, dolly } = currentTransform;
      
      // Apply transforms in correct order: translate -> rotate -> scale
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(zoom + dolly * 0.1, zoom + dolly * 0.1);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // ALWAYS draw base frame FIRST
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      // Then draw all elements after frame is rendered
      drawElements(ctx, canvas, elementsToRender, onFrameRendered);
      
      // Restore context state
      ctx.restore();
    };

    if (usePreloaded) {
      // Preloaded image is ready - render immediately
      renderFrame(preloadedImg);
    } else {
      // Load fresh image (masked thumbnail or fallback)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = frameImageSrc;
      
      // Wait for image to decode before rendering
      img.decode()
        .then(() => {
          renderFrame(img);
        })
        .catch(() => {
          // Fallback: try onload
          img.onload = () => renderFrame(img);
          img.onerror = () => {
            console.error('Failed to load frame image:', currentFrame.id);
            // Draw a placeholder or fallback to preloaded
            if (preloadedImg) {
              renderFrame(preloadedImg);
            } else {
              ctx.restore();
            }
          };
        });
    }
  }, [currentFrame, width, height, onFrameRendered, tweenedElements, preloadedFrames, currentTransform]);

  // Helper function to draw elements on canvas
  const drawElements = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    elementsToRender: Element[],
    onFrameRendered?: (canvas: HTMLCanvasElement) => void
  ) => {
    if (elementsToRender.length === 0) {
      onFrameRendered?.(canvas);
      return;
    }

    let loadedCount = 0;
    const totalElements = elementsToRender.length;

    elementsToRender.forEach((element) => {
        const elementImg = new Image();
        elementImg.crossOrigin = 'anonymous';
        elementImg.src = element.image;
        
        elementImg.onload = () => {
          ctx.save();
          
          // Apply transformations
          ctx.globalAlpha = element.opacity / 100;
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation * Math.PI) / 180);
          
          // Apply filters
          const filters = [];
          if (element.blur > 0) filters.push(`blur(${element.blur}px)`);
          if (element.brightness !== 100) filters.push(`brightness(${element.brightness}%)`);
          ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
          
          ctx.drawImage(
            elementImg,
            -element.width / 2,
            -element.height / 2,
            element.width,
            element.height
          );
          
          ctx.restore();

          loadedCount++;
          if (loadedCount === totalElements) {
            onFrameRendered?.(canvas);
          }
        };
        
        elementImg.onerror = () => {
          console.warn('Failed to load element image:', element.id);
          loadedCount++;
          if (loadedCount === totalElements) {
            onFrameRendered?.(canvas);
          }
        };
      });
    };

  if (!currentFrame) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};
