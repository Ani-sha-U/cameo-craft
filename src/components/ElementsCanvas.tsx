import { useElementsStore } from "@/store/elementsStore";
import { useRef, useEffect, useState } from "react";

export const ElementsCanvas = () => {
  const { elements, selectedElementId, setSelectedElement, updateElement } = useElementsStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setDragging({
      id: elementId,
      startX: e.clientX - element.x,
      startY: e.clientY - element.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    const newX = e.clientX - dragging.startX;
    const newY = e.clientY - dragging.startY;

    updateElement(dragging.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const assetId = e.dataTransfer.getData('assetId');
    if (!assetId) return;

    const { useAssetsStore } = require('@/store/assetsStore');
    const { assets } = useAssetsStore.getState();
    const asset = assets.find((a: any) => a.id === assetId);
    
    if (!asset) return;

    // Get drop position relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { addElement } = useElementsStore.getState();
    const newElement = {
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
    };

    addElement(newElement);
    
    const { toast } = require('sonner');
    toast.success(`Added ${asset.name} to canvas`);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging]);

  if (elements.length === 0) return null;

  return (
    <div 
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 10 }}
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
    >
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute pointer-events-auto cursor-move"
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            transform: `rotate(${element.rotation}deg)`,
            opacity: element.opacity / 100,
            filter: `blur(${element.blur}px) brightness(${element.brightness}%) drop-shadow(0 0 ${element.glow}px rgba(255, 255, 255, 0.8))`,
            border: selectedElementId === element.id ? '2px solid hsl(var(--primary))' : 'none',
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
        >
          <img 
            src={element.image} 
            alt={element.label}
            className="w-full h-full object-contain"
            draggable={false}
          />
          {selectedElementId === element.id && (
            <>
              {/* Resize handle */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-full cursor-se-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // TODO: Implement resize logic
                }}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
};