import { useElementsStore, Element } from "@/store/elementsStore";
import { useFramesStore } from "@/store/framesStore";
import { useRef, useEffect, useState } from "react";

interface DragState {
  id: string;
  startX: number;
  startY: number;
}

interface ResizeState {
  id: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export const ElementsCanvas = () => {
  const { elements, selectedElementId, setSelectedElement, updateElement } = useElementsStore();
  const { frames, selectedFrameId, updateFrameElements, onionSkinEnabled, onionSkinRange } = useFramesStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);

  // Get current frame's elements
  const currentFrame = frames.find((f) => f.id === selectedFrameId);
  const displayElements = selectedFrameId && currentFrame ? currentFrame.elements : elements;

  // Get onion skin frames
  const currentFrameIndex = frames.findIndex((f) => f.id === selectedFrameId);
  const onionSkinFrames: { frame: typeof frames[0]; opacity: number }[] = [];
  
  if (onionSkinEnabled && currentFrameIndex !== -1) {
    for (let i = 1; i <= onionSkinRange; i++) {
      // Previous frames
      if (currentFrameIndex - i >= 0) {
        onionSkinFrames.push({
          frame: frames[currentFrameIndex - i],
          opacity: 0.3 / i, // Fade out with distance
        });
      }
      // Next frames
      if (currentFrameIndex + i < frames.length) {
        onionSkinFrames.push({
          frame: frames[currentFrameIndex + i],
          opacity: 0.2 / i, // Slightly less visible for future frames
        });
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const element = displayElements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setDragging({
      id: elementId,
      startX: e.clientX - element.x,
      startY: e.clientY - element.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      const newX = e.clientX - dragging.startX;
      const newY = e.clientY - dragging.startY;

      if (selectedFrameId && currentFrame) {
        const updatedElements = currentFrame.elements.map((el) =>
          el.id === dragging.id ? { ...el, x: newX, y: newY } : el
        );
        updateFrameElements(selectedFrameId, updatedElements);
      } else {
        updateElement(dragging.id, { x: newX, y: newY });
      }
    } else if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      
      const newWidth = Math.max(50, resizing.startWidth + deltaX);
      const newHeight = Math.max(50, resizing.startHeight + deltaY);

      if (selectedFrameId && currentFrame) {
        const updatedElements = currentFrame.elements.map((el) =>
          el.id === resizing.id ? { ...el, width: newWidth, height: newHeight } : el
        );
        updateFrameElements(selectedFrameId, updatedElements);
      } else {
        updateElement(resizing.id, { width: newWidth, height: newHeight });
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = displayElements.find(el => el.id === elementId);
    if (!element) return;

    setResizing({
      id: elementId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
    });
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const elementId = e.dataTransfer.getData('elementId');
    const elementData = e.dataTransfer.getData('elementData');
    const assetId = e.dataTransfer.getData('assetId');
    
    let newElement;
    
    // Handle element from Elements Panel
    if (elementData) {
      const element = JSON.parse(elementData);
      
      // Get drop position relative to canvas
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      newElement = {
        ...element,
        id: `${element.id}_canvas_${Date.now()}`,
        x: x - 100,
        y: y - 100,
      };
    }
    // Handle asset from Asset Library
    else if (assetId) {
      const { useAssetsStore } = require('@/store/assetsStore');
      const { assets } = useAssetsStore.getState();
      const asset = assets.find((a: any) => a.id === assetId);
      
      if (!asset) return;

      // Get drop position relative to canvas
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      newElement = {
        id: `element-${Date.now()}`,
        label: asset.name,
        image: asset.imageUrl,
        x: x - 100, // Center on cursor
        y: y - 100,
        width: 200,
        height: 200,
        rotation: 0,
        opacity: 100,
        blur: 0,
        brightness: 100,
        glow: 0,
        blendMode: 'normal' as const,
        maskImage: undefined,
      };
    }
    
    if (!newElement) return;

    if (selectedFrameId && currentFrame) {
      // Add to current frame
      updateFrameElements(selectedFrameId, [...currentFrame.elements, newElement]);
      const { toast } = require('sonner');
      toast.success(`Element added to frame`, {
        description: 'All edits persist in playback, interpolation, and rendering',
      });
    } else {
      // Add to global elements
      const { addElement } = useElementsStore.getState();
      addElement(newElement);
      const { toast } = require('sonner');
      toast.success(`Element added to canvas`, {
        description: 'This element is visible across all frames',
      });
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, selectedFrameId, currentFrame]);

  const renderElement = (element: Element, opacity: number = 1, isOnionSkin: boolean = false) => (
    <div
      key={`${element.id}_${isOnionSkin ? 'onion' : 'main'}`}
      className={`absolute ${isOnionSkin ? 'pointer-events-none' : 'pointer-events-auto cursor-move'}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        opacity: (element.opacity / 100) * opacity,
        filter: `blur(${element.blur}px) brightness(${element.brightness}%) drop-shadow(0 0 ${element.glow}px rgba(255, 255, 255, 0.8))`,
        border: !isOnionSkin && selectedElementId === element.id ? '2px solid hsl(var(--primary))' : 'none',
        mixBlendMode: element.blendMode,
        maskImage: element.maskImage ? `url(${element.maskImage})` : undefined,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
      onMouseDown={!isOnionSkin ? (e) => handleMouseDown(e, element.id) : undefined}
    >
      <img 
        src={element.image} 
        alt={element.label}
        className="w-full h-full object-contain"
        draggable={false}
      />
      {!isOnionSkin && selectedElementId === element.id && (
        <>
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-full cursor-se-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
          />
          {/* Corner handles */}
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full cursor-ne-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-primary rounded-full cursor-sw-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
          />
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full cursor-nw-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
          />
        </>
      )}
    </div>
  );

  if (displayElements.length === 0 && onionSkinFrames.length === 0) return null;

  return (
    <div 
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 10 }}
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
    >
      {/* Render onion skin frames first (behind current frame) */}
      {onionSkinFrames.map(({ frame, opacity }) => 
        frame.elements.map((element) => renderElement(element, opacity, true))
      )}
      
      {/* Render current frame elements */}
      {displayElements.map((element) => renderElement(element, 1, false))}
    </div>
  );
};

