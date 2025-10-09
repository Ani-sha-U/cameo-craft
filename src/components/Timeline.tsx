import { useState } from "react";
import { Film, Scissors, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Frame {
  id: number;
  color: string;
  label: string;
}

const initialFrames: Frame[] = [
  { id: 1, color: "bg-blue-500", label: "Frame 1" },
  { id: 2, color: "bg-purple-500", label: "Frame 2" },
  { id: 3, color: "bg-pink-500", label: "Frame 3" },
  { id: 4, color: "bg-cyan-500", label: "Frame 4" },
  { id: 5, color: "bg-green-500", label: "Frame 5" },
];

export const Timeline = () => {
  const [frames, setFrames] = useState<Frame[]>(initialFrames);
  const [draggedFrame, setDraggedFrame] = useState<number | null>(null);

  const handleDragStart = (id: number) => {
    setDraggedFrame(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (draggedFrame === null) return;

    const draggedIndex = frames.findIndex((f) => f.id === draggedFrame);
    const targetIndex = frames.findIndex((f) => f.id === targetId);

    if (draggedIndex === targetIndex) return;

    const newFrames = [...frames];
    const [removed] = newFrames.splice(draggedIndex, 1);
    newFrames.splice(targetIndex, 0, removed);

    setFrames(newFrames);
    setDraggedFrame(null);
  };

  return (
    <div className="h-32 bg-card border-t border-border p-4">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
          <Film className="w-4 h-4 mr-2" />
          Clips
        </Button>
        <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
          <Scissors className="w-4 h-4 mr-2" />
          Cut
        </Button>
        <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
          <Wand2 className="w-4 h-4 mr-2" />
          Effects
        </Button>
      </div>

      <div className="flex gap-2 h-16 bg-muted rounded-lg p-2 overflow-x-auto">
        {frames.map((frame) => (
          <div
            key={frame.id}
            draggable
            onDragStart={() => handleDragStart(frame.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(frame.id)}
            className={`${frame.color} rounded min-w-[80px] flex items-center justify-center cursor-move hover:opacity-80 transition-opacity`}
          >
            <span className="text-xs text-white font-medium">{frame.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>0:00</span>
        <span>Drag frames to reorder</span>
        <span>0:05</span>
      </div>
    </div>
  );
};
