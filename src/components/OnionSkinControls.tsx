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
    <div className="flex flex-col gap-2 p-2 border-b border-border">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Onion Skin</Label>
        <Button
          variant={onionSkinEnabled ? "default" : "outline"}
          size="sm"
          className="h-6 text-xs"
          onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
        >
          {onionSkinEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </Button>
      </div>

      {onionSkinEnabled && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground min-w-[45px]">Range:</Label>
          <Slider
            value={[onionSkinRange]}
            min={1}
            max={5}
            step={1}
            onValueChange={([value]) => setOnionSkinRange(value)}
            className="flex-1"
          />
          <span className="text-xs min-w-[15px]">{onionSkinRange}</span>
        </div>
      )}
    </div>
  );
};