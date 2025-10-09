import { Info, Clock, Maximize2, Film } from "lucide-react";

interface InfoPanelProps {
  videoInfo?: {
    duration: string;
    resolution: string;
    fps: number;
    format: string;
  };
}

export const InfoPanel = ({ videoInfo }: InfoPanelProps) => {
  const defaultInfo = {
    duration: "00:00",
    resolution: "1920x1080",
    fps: 30,
    format: "MP4",
  };

  const info = videoInfo || defaultInfo;

  return (
    <div className="w-72 bg-card border-l border-border p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-semibold text-foreground">Video Info</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Duration</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{info.duration}</p>
        </div>

        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Maximize2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Resolution</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{info.resolution}</p>
        </div>

        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Film className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Frame Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{info.fps} FPS</p>
        </div>

        <div className="p-4 bg-gradient-primary rounded-lg shadow-glow">
          <div className="text-sm font-medium text-white mb-1">Format</div>
          <p className="text-xl font-bold text-white">{info.format}</p>
        </div>
      </div>

      <div className="mt-auto p-4 bg-muted rounded-lg border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">🎬 Export Ready</h3>
        <p className="text-xs text-muted-foreground">
          Your video will be ready to export in high quality once generation is complete.
        </p>
      </div>
    </div>
  );
};
