import { useFramesStore } from '@/store/framesStore';
import { useElementsStore } from '@/store/elementsStore';
import { useEffect, useRef } from 'react';

export const FrameCanvas = () => {
  const { frames, selectedFrameId } = useFramesStore();
  const { setSelectedElement } = useElementsStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentFrame = frames.find(f => f.id === selectedFrameId);

  useEffect(() => {
    if (!canvasRef.current || !currentFrame) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw frame thumbnail as background
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentFrame.thumbnail;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw frame elements
      currentFrame.elements.forEach((element) => {
        const elementImg = new Image();
        elementImg.crossOrigin = 'anonymous';
        elementImg.src = element.image;
        elementImg.onload = () => {
          ctx.save();
          
          // Apply transformations
          ctx.globalAlpha = element.opacity / 100;
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation * Math.PI) / 180);
          
          // Apply filters (basic approach)
          if (element.blur > 0) {
            ctx.filter = `blur(${element.blur}px) brightness(${element.brightness}%)`;
          } else {
            ctx.filter = `brightness(${element.brightness}%)`;
          }
          
          ctx.drawImage(
            elementImg,
            -element.width / 2,
            -element.height / 2,
            element.width,
            element.height
          );
          
          ctx.restore();
        };
      });
    };
  }, [currentFrame]);

  if (!currentFrame) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="hidden" // Hidden canvas for preview/rendering
    />
  );
};
