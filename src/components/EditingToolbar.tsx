import { Button } from "@/components/ui/button";
import { 
  MousePointer2, 
  Scissors, 
  Move, 
  Crop,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Save,
  FolderOpen
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useFramesStore } from "@/store/framesStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export const EditingToolbar = () => {
  const { editMode, setEditMode, canUndo, canRedo, undo, redo } = useEditorStore();
  const { 
    selectedFrameId, 
    duplicateFrame, 
    deleteFrame, 
    clearFrames 
  } = useFramesStore();

  const handleDuplicate = () => {
    if (selectedFrameId) {
      duplicateFrame(selectedFrameId);
      toast.success('Frame duplicated');
    } else {
      toast.error('No frame selected');
    }
  };

  const handleDelete = () => {
    if (selectedFrameId) {
      deleteFrame(selectedFrameId);
      toast.success('Frame deleted');
    } else {
      toast.error('No frame selected');
    }
  };

  const tools = [
    { mode: 'select' as const, icon: MousePointer2, label: 'Select (V)' },
    { mode: 'cut' as const, icon: Scissors, label: 'Cut (C)' },
    { mode: 'trim' as const, icon: Crop, label: 'Trim (T)' },
    { mode: 'split' as const, icon: Move, label: 'Split (B)' },
  ];

  return (
    <div className="flex items-center gap-1 p-1.5 bg-card/50 border-b border-border">
      {/* Edit Tools */}
      <div className="flex items-center gap-0.5">
        {tools.map((tool) => (
          <Button
            key={tool.mode}
            variant={editMode === tool.mode ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditMode(tool.mode)}
            title={tool.label}
          >
            <tool.icon className={cn(
              "h-3.5 w-3.5",
              editMode === tool.mode && "text-primary-foreground"
            )} />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Frame Actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleDuplicate}
          disabled={!selectedFrameId}
          title="Duplicate Frame (Ctrl+D)"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleDelete}
          disabled={!selectedFrameId}
          title="Delete Frame (Del)"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* Project Actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          title="Save Project (Ctrl+S)"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          Save
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          title="Open Project (Ctrl+O)"
        >
          <FolderOpen className="h-3.5 w-3.5 mr-1" />
          Open
        </Button>
      </div>
    </div>
  );
};