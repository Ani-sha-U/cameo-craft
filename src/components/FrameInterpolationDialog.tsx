import { useState } from "react";
import { useFramesStore } from "@/store/framesStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const FrameInterpolationDialog = () => {
  const { frames, interpolateFrames } = useFramesStore();
  const [startFrameId, setStartFrameId] = useState<string>("");
  const [endFrameId, setEndFrameId] = useState<string>("");
  const [numFrames, setNumFrames] = useState<number>(5);
  const [open, setOpen] = useState(false);

  const handleInterpolate = () => {
    if (!startFrameId || !endFrameId) {
      toast.error("Please select both start and end frames");
      return;
    }

    const startIndex = frames.findIndex((f) => f.id === startFrameId);
    const endIndex = frames.findIndex((f) => f.id === endFrameId);

    if (startIndex >= endIndex) {
      toast.error("End frame must come after start frame");
      return;
    }

    interpolateFrames(startFrameId, endFrameId, numFrames);
    toast.success(`Generated ${numFrames} interpolated frames!`);
    setOpen(false);
  };

  if (frames.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Interpolate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Frame Interpolation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Start Frame (Keyframe)</Label>
            <Select value={startFrameId} onValueChange={setStartFrameId}>
              <SelectTrigger>
                <SelectValue placeholder="Select start frame" />
              </SelectTrigger>
              <SelectContent>
                {frames.map((frame, idx) => (
                  <SelectItem key={frame.id} value={frame.id}>
                    Frame #{idx + 1} ({frame.timestamp.toFixed(2)}s)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>End Frame (Keyframe)</Label>
            <Select value={endFrameId} onValueChange={setEndFrameId}>
              <SelectTrigger>
                <SelectValue placeholder="Select end frame" />
              </SelectTrigger>
              <SelectContent>
                {frames.map((frame, idx) => (
                  <SelectItem key={frame.id} value={frame.id}>
                    Frame #{idx + 1} ({frame.timestamp.toFixed(2)}s)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Number of Frames to Generate</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={numFrames}
              onChange={(e) => setNumFrames(parseInt(e.target.value) || 5)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            This will create smooth transitions between the two keyframes by interpolating element positions, rotations, and other properties.
          </p>

          <Button onClick={handleInterpolate} className="w-full">
            Generate Frames
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};