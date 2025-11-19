import { useFramesStore } from '@/store/framesStore';
import { useElementsStore } from '@/store/elementsStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

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

    const newElement = {
      ...element,
      id: `${element.id}_frame_${frameId}_${Date.now()}`,
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
    <Card className="p-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Frames ({frames.length})</h3>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              className="relative flex-shrink-0 group"
              onDrop={(e) => handleFrameDrop(e, frame.id)}
              onDragOver={handleFrameDragOver}
            >
              <div
                className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:border-primary ${
                  selectedFrameId === frame.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border'
                }`}
                onClick={() => selectFrame(frame.id)}
              >
                <img
                  src={frame.thumbnail}
                  alt={`Frame ${index + 1}`}
                  className="w-32 h-20 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
                  #{index + 1} • {frame.timestamp.toFixed(2)}s
                </div>
              </div>
              
              {/* Actions */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateFrame(frame.id);
                  }}
                  title="Duplicate frame"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Element count badge */}
              {frame.elements.length > 0 && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  {frame.elements.length} layers
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
