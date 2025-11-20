import { useFramesStore } from '@/store/framesStore';
import { useElementsStore } from '@/store/elementsStore';
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
  const { frames, selectedFrameId } = useFramesStore();
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

    // DO NOT clear canvas - this causes black flickering
    // Instead, draw new frame directly over the previous one
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // REMOVED

    // Draw frame thumbnail as background
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentFrame.thumbnail;
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Track loaded elements
      let loadedCount = 0;
      const totalElements = elementsToRender.length;

      if (totalElements === 0) {
        onFrameRendered?.(canvas);
        return;
      }

      // Draw frame elements (or tweened elements)
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
      });
    };
  }, [currentFrame, width, height, onFrameRendered, tweenedElements]);

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
