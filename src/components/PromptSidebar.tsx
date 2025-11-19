import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVideoStore } from "@/store/videoStore";
import { ChevronLeft, ChevronRight, Loader2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromptSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PromptSidebar = ({ isCollapsed, onToggleCollapse }: PromptSidebarProps) => {
  const { prompt, setPrompt, generateVideo, isGenerating } = useVideoStore();

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
              <h2 className="text-xl font-semibold text-foreground">Text to Video</h2>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              🔮 Replicate • MiniMax Video-01
            </Badge>
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

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-foreground">Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Be specific and descriptive</li>
                <li>• Describe the scene, actions, and mood</li>
                <li>• Keep prompts clear and concise</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
