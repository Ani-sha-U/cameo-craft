import { useCameraStore } from "@/store/cameraStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Camera, 
  ZoomIn, 
  Move, 
  RotateCw, 
  Maximize2,
  Play,
  Square,
  RotateCcw,
  Plus
} from "lucide-react";
import { useState } from "react";

export const CameraToolbar = () => {
  const {
    currentTransform,
    isPlaying,
    currentTime,
    duration,
    setZoom,
    setPanX,
    setPanY,
    setRotate,
    setDolly,
    addKeyframe,
    playPreview,
    stopPreview,
    resetCamera,
  } = useCameraStore();

  const [showControls, setShowControls] = useState(true);

  return (
    <Card className="p-4 bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Virtual Camera</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowControls(!showControls)}
        >
          {showControls ? 'Hide' : 'Show'}
        </Button>
      </div>

      {showControls && (
        <div className="space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Zoom</label>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentTransform.zoom.toFixed(2)}x
              </span>
            </div>
            <Slider
              value={[currentTransform.zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={0.5}
              max={3}
              step={0.1}
              disabled={isPlaying}
            />
          </div>

          {/* Pan X Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Pan X</label>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentTransform.panX}px
              </span>
            </div>
            <Slider
              value={[currentTransform.panX]}
              onValueChange={([value]) => setPanX(value)}
              min={-500}
              max={500}
              step={10}
              disabled={isPlaying}
            />
          </div>

          {/* Pan Y Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Pan Y</label>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentTransform.panY}px
              </span>
            </div>
            <Slider
              value={[currentTransform.panY]}
              onValueChange={([value]) => setPanY(value)}
              min={-500}
              max={500}
              step={10}
              disabled={isPlaying}
            />
          </div>

          {/* Rotate Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Rotate</label>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentTransform.rotate}°
              </span>
            </div>
            <Slider
              value={[currentTransform.rotate]}
              onValueChange={([value]) => setRotate(value)}
              min={-30}
              max={30}
              step={1}
              disabled={isPlaying}
            />
          </div>

          {/* Dolly Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Dolly</label>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentTransform.dolly}
              </span>
            </div>
            <Slider
              value={[currentTransform.dolly]}
              onValueChange={([value]) => setDolly(value)}
              min={-100}
              max={100}
              step={5}
              disabled={isPlaying}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addKeyframe(currentTime)}
              disabled={isPlaying}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Keyframe
            </Button>
            
            {!isPlaying ? (
              <Button
                size="sm"
                variant="default"
                onClick={playPreview}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                Preview
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopPreview}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={resetCamera}
            disabled={isPlaying}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Camera
          </Button>

          {/* Playback Progress */}
          {isPlaying && (
            <div className="space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(currentTime / 1000).toFixed(1)}s</span>
                <span>{(duration / 1000).toFixed(1)}s</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
