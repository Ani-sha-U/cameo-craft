import { useFramesStore } from "@/store/framesStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export const OnionSkinControls = () => {
  const { 
    onionSkinEnabled, 
    onionSkinRange, 
    setOnionSkinEnabled, 
    setOnionSkinRange 
  } = useFramesStore();

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-border">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Onion Skinning</Label>
        <Button
          variant={onionSkinEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
        >
          {onionSkinEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      {onionSkinEnabled && (
        <div className="flex items-center gap-4">
          <Label className="text-sm text-muted-foreground min-w-[60px]">Range:</Label>
          <Slider
            value={[onionSkinRange]}
            min={1}
            max={5}
            step={1}
            onValueChange={([value]) => setOnionSkinRange(value)}
            className="flex-1"
          />
          <span className="text-sm min-w-[20px]">{onionSkinRange}</span>
        </div>
      )}
    </div>
  );
};