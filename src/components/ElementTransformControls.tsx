import { Element } from "@/store/elementsStore";
import { useState, useRef, useEffect } from "react";

interface TransformControlsProps {
  element: Element;
  isSelected: boolean;
  onUpdate: (updates: Partial<Element>) => void;
}

export const ElementTransformControls = ({ 
  element, 
  isSelected,
  onUpdate 
}: TransformControlsProps) => {
  const [resizing, setResizing] = useState<{
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  
  const [rotating, setRotating] = useState<{
    startAngle: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setResizing({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startLeft: element.x,
      startTop: element.y,
    });
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    setRotating({
      startAngle: angle * (180 / Math.PI) - element.rotation,
      centerX,
      centerY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const deltaX = e.clientX - resizing.startX;
        const deltaY = e.clientY - resizing.startY;
        
        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newX = element.x;
        let newY = element.y;

        switch (resizing.handle) {
          case 'nw': // Top-left
            newWidth = resizing.startWidth - deltaX;
            newHeight = resizing.startHeight - deltaY;
            newX = resizing.startLeft + deltaX;
            newY = resizing.startTop + deltaY;
            break;
          case 'n': // Top
            newHeight = resizing.startHeight - deltaY;
            newY = resizing.startTop + deltaY;
            break;
          case 'ne': // Top-right
            newWidth = resizing.startWidth + deltaX;
            newHeight = resizing.startHeight - deltaY;
            newY = resizing.startTop + deltaY;
            break;
          case 'e': // Right
            newWidth = resizing.startWidth + deltaX;
            break;
          case 'se': // Bottom-right
            newWidth = resizing.startWidth + deltaX;
            newHeight = resizing.startHeight + deltaY;
            break;
          case 's': // Bottom
            newHeight = resizing.startHeight + deltaY;
            break;
          case 'sw': // Bottom-left
            newWidth = resizing.startWidth - deltaX;
            newHeight = resizing.startHeight + deltaY;
            newX = resizing.startLeft + deltaX;
            break;
          case 'w': // Left
            newWidth = resizing.startWidth - deltaX;
            newX = resizing.startLeft + deltaX;
            break;
        }

        // Minimum size constraints
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        onUpdate({ width: newWidth, height: newHeight, x: newX, y: newY });
      } else if (rotating) {
        const angle = Math.atan2(
          e.clientY - rotating.centerY,
          e.clientX - rotating.centerX
        );
        const rotation = angle * (180 / Math.PI) - rotating.startAngle;
        onUpdate({ rotation });
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      setRotating(null);
    };

    if (resizing || rotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, rotating, element, onUpdate]);

  if (!isSelected) return null;

  const handles = [
    { pos: 'nw', cursor: 'nw-resize', x: 0, y: 0 },
    { pos: 'n', cursor: 'n-resize', x: 50, y: 0 },
    { pos: 'ne', cursor: 'ne-resize', x: 100, y: 0 },
    { pos: 'e', cursor: 'e-resize', x: 100, y: 50 },
    { pos: 'se', cursor: 'se-resize', x: 100, y: 100 },
    { pos: 's', cursor: 's-resize', x: 50, y: 100 },
    { pos: 'sw', cursor: 'sw-resize', x: 0, y: 100 },
    { pos: 'w', cursor: 'w-resize', x: 0, y: 50 },
  ];

  return (
    <>
      {/* Selection border */}
      <div 
        className="absolute inset-0 border-2 border-primary pointer-events-none"
        style={{ borderRadius: '2px' }}
      />

      {/* 8 Resize handles */}
      {handles.map(({ pos, cursor, x, y }) => (
        <div
          key={pos}
          className="absolute w-3 h-3 bg-primary border-2 border-background rounded-full z-20"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            cursor,
          }}
          onMouseDown={(e) => handleResizeStart(e, pos)}
        />
      ))}

      {/* Rotation handle */}
      <div
        className="absolute w-3 h-3 bg-secondary border-2 border-background rounded-full z-20 cursor-grab active:cursor-grabbing"
        style={{
          left: '50%',
          top: '-20px',
          transform: 'translateX(-50%)',
        }}
        onMouseDown={handleRotateStart}
      >
        <div 
          className="absolute w-0.5 h-5 bg-primary/50 left-1/2 top-full -translate-x-1/2"
        />
      </div>
    </>
  );
};
