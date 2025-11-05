import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { useVideoStore } from "@/store/videoStore";
import { Badge } from "@/components/ui/badge";

interface PromptSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PromptSidebar = ({ isCollapsed, onToggleCollapse }: PromptSidebarProps) => {
  const { prompt, setPrompt, generateVideo, isGenerating } = useVideoStore();

  const demoPrompts = [
    "A glowing neon car driving through fog at night",
    "Ocean waves crashing on a beach at sunset",
    "A bird flying over mountains with dramatic clouds",
    "Fireworks exploding in the night sky",
  ];

  const handleDemoPrompt = () => {
    const randomPrompt = demoPrompts[Math.floor(Math.random() * demoPrompts.length)];
    setPrompt(randomPrompt);
  };

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
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">AI Video Generator</h2>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              🤗 Hugging Face • zeroscope-v2-xl
            </Badge>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="prompt" className="text-sm font-medium text-foreground">
                Video Prompt
              </label>
              <Textarea
                id="prompt"
                placeholder="A sunset over the mountains with birds flying"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] resize-none bg-input border-border focus:ring-primary"
                disabled={isGenerating}
              />
            </div>

            <Button
              onClick={handleDemoPrompt}
              variant="outline"
              className="w-full"
              disabled={isGenerating}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Try Demo Prompt
            </Button>

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>

            <div className="mt-4 p-4 bg-muted rounded-lg border border-border space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">💡 Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Be specific with your descriptions</li>
                  <li>• Include details about lighting and mood</li>
                  <li>• Mention camera angles if needed</li>
                  <li>• Keep prompts clear and concise</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⏱️ First generation may take 20-30 seconds while the model loads
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
