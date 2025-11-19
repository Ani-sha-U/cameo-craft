import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useVideoStore } from "@/store/videoStore";
import { useCameraStore } from "@/store/cameraStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const VideoPreview = () => {
  const { videoUrl, isGenerating, duration } = useVideoStore();
  const { currentTransform } = useCameraStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate CSS transform string from camera state
  const getCameraTransform = () => {
    const { zoom, panX, panY, rotate, dolly } = currentTransform;
    const scale = zoom + (dolly / 100);
    return `translate(${panX}px, ${panY}px) scale(${scale}) rotate(${rotate}deg)`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-background to-muted/20">
      {isGenerating && (
        <div className="max-w-3xl w-full space-y-4 animate-fade-in">
          <div className="relative">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium text-foreground mb-1">Generating your video...</p>
                <p className="text-sm text-muted-foreground">This may take a few minutes</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isGenerating && videoUrl && (
        <div className="max-w-3xl w-full animate-scale-in">
          <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black group">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto"
              loop
              autoPlay
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                transform: getCameraTransform()
              }}
            />
            
            {/* Duration Badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-4 right-4 bg-black/70 text-white border-white/20"
            >
              {duration}s
            </Badge>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isGenerating && !videoUrl && (
        <div className="text-center text-muted-foreground animate-fade-in">
          <div className="bg-muted/30 rounded-full p-8 inline-block mb-4">
            <Play className="h-16 w-16 opacity-40" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">No video generated yet</p>
          <p className="text-sm">Enter a prompt and click Generate to create your first video</p>
        </div>
      )}
    </div>
  );
};
