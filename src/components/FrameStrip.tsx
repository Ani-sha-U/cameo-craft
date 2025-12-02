import { useFramesStore } from '@/store/framesStore';
import { useElementsStore } from '@/store/elementsStore';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { FrameInterpolationDialog } from '@/components/FrameInterpolationDialog';

export const FrameStrip = () => {
  const { frames, selectedFrameId, selectFrame, duplicateFrame, updateFrameElements } = useFramesStore();
  const { elements } = useElementsStore();

  const handleFrameDrop = (e: React.DragEvent, frameId: string) => {
    e.preventDefault();
    
    const elementId = e.dataTransfer.getData('elementId');
    const elementData = e.dataTransfer.getData('elementData');
    
    if (!elementData) return;

    const element = JSON.parse(elementData);
    const frame = frames.find(f => f.id === frameId);
    
    if (!frame) return;

    // Preserve sourceElementId for animation continuity
    // If element already has sourceElementId, keep it; otherwise use its id as source
    const newElement = {
      ...element,
      id: `${element.id}_frame_${frameId}_${Date.now()}`,
      sourceElementId: element.sourceElementId || element.id,
      x: 50,
      y: 50,
    };

    updateFrameElements(frameId, [...frame.elements, newElement]);
    toast.success(`Added ${element.label} to frame`);
  };

  const handleFrameDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  if (frames.length === 0) {
    return null;
  }

  return (
    <Card className="p-2 border-t">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold">Frames ({frames.length})</h3>
        <FrameInterpolationDialog />
      </div>
      <div className="w-full overflow-x-auto overflow-y-hidden pb-2" style={{ maxHeight: '140px' }}>
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              className="relative flex-shrink-0 group"
              onDrop={(e) => handleFrameDrop(e, frame.id)}
              onDragOver={handleFrameDragOver}
            >
              <div
                className={`cursor-pointer border-2 rounded overflow-hidden transition-all hover:border-primary ${
                  selectedFrameId === frame.id
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-border'
                }`}
                onClick={() => selectFrame(frame.id)}
              >
                <img
                  src={frame.thumbnail}
                  alt={`Frame ${index + 1}`}
                  className="w-24 h-16 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5">
                  #{index + 1} • {frame.timestamp.toFixed(1)}s
                </div>
              </div>
              
              {/* Actions */}
              <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateFrame(frame.id);
                  }}
                  title="Duplicate frame"
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              </div>

              {/* Element count badge */}
              {frame.elements.length > 0 && (
                <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] px-1 py-0.5 rounded">
                  {frame.elements.length}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
