import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useVideoStore } from "@/store/videoStore";
import { ChevronLeft, ChevronRight, Loader2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromptSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PromptSidebar = ({ isCollapsed, onToggleCollapse }: PromptSidebarProps) => {
  const { prompt, setPrompt, duration, setDuration, generateVideo, isGenerating } = useVideoStore();

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-card border-r border-border transition-all duration-300 flex flex-col gap-6 relative`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-2 text-muted-foreground hover:text-foreground z-10"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </Button>

      {!isCollapsed && (
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">AI Generate</h2>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              Step 2: Text → Video
            </Badge>
            <p className="text-xs text-muted-foreground">
              Generated videos auto-add to timeline and Asset Library
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="prompt-input" className="text-sm font-medium text-foreground">
                Enter Your Prompt
              </label>
              <Textarea
                id="prompt-input"
                placeholder="Describe the video you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isGenerating}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="duration-slider" className="text-sm font-medium text-foreground">
                Duration: {duration} seconds
              </label>
              <Slider
                id="duration-slider"
                min={3}
                max={10}
                step={1}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                disabled={isGenerating}
                className="w-full"
              />
            </div>

            <Button 
              onClick={generateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Video"
              )}
            </Button>

            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <div>
                <h3 className="text-sm font-medium mb-2 text-foreground">✨ Workflow</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>1. Enter your prompt and generate</li>
                  <li>2. Video auto-adds to timeline</li>
                  <li>3. Use "Separate Elements" for layers</li>
                  <li>4. Add assets, text, and effects</li>
                  <li>5. Adjust camera and export</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 text-foreground">💡 Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Be specific and descriptive</li>
                  <li>• Include style: "cinematic, 4K, neon"</li>
                  <li>• Describe actions and mood</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
