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
    <div className="bg-card border border-border rounded-lg p-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
            <Film className="w-3 h-3 mr-1" />
            Clips
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
            <Scissors className="w-3 h-3 mr-1" />
            Cut
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
            <Wand2 className="w-3 h-3 mr-1" />
            Effects
          </Button>
        </div>
        <span className="text-[9px] text-muted-foreground">0:00 / 0:05</span>
      </div>

      <div className="flex gap-1.5 h-12 bg-muted rounded-lg p-1.5 overflow-x-auto">
        {frames.map((frame) => (
          <div
            key={frame.id}
            draggable
            onDragStart={() => handleDragStart(frame.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(frame.id)}
            className={`${frame.color} rounded min-w-[60px] flex items-center justify-center cursor-move hover:opacity-80 transition-opacity`}
          >
            <span className="text-[10px] text-white font-medium">{frame.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
