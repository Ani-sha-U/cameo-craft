import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VideoPreviewProps {
  videoUrl?: string;
  isGenerating: boolean;
}

export const VideoPreview = ({ videoUrl, isGenerating }: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl aspect-video bg-card rounded-xl border border-border shadow-card overflow-hidden relative">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-subtle">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-foreground font-medium">Generating your video...</p>
                <p className="text-muted-foreground text-sm mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : videoUrl ? (
            <>
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                controls={false}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary"></div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-subtle">
              <div className="text-center">
                <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium">No video generated yet</p>
                <p className="text-muted-foreground text-sm mt-2">Enter a prompt and click Generate Video</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
