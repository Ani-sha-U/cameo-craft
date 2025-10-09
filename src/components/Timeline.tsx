import { Film, Scissors, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Timeline = () => {
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

      <div className="flex gap-1 h-16 bg-muted rounded-lg p-2 overflow-x-auto">
        {/* Timeline track - placeholder */}
        <div className="flex-1 bg-gradient-primary rounded opacity-50 min-w-[100px] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white font-medium">Video Clip</span>
          </div>
        </div>
        
        {/* Playhead indicator */}
        <div className="absolute bottom-6 left-1/2 w-0.5 h-12 bg-accent shadow-glow"></div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>0:00</span>
        <span>Duration</span>
        <span>0:00</span>
      </div>
    </div>
  );
};
