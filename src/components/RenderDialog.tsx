import { useState } from "react";
import { useRenderStore, ExportFormat } from "@/store/renderStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Video, Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  'mp4-720p': 'MP4 - 720p (HD)',
  'mp4-1080p': 'MP4 - 1080p (Full HD)',
  'webm': 'WebM - 1080p',
  'gif': 'GIF - 480p',
};

const FORMAT_DESCRIPTIONS: Record<ExportFormat, string> = {
  'mp4-720p': 'Good quality, smaller file size',
  'mp4-1080p': 'Best quality, larger file size',
  'webm': 'Web optimized, good quality',
  'gif': 'Animated, best for short clips',
};

export const RenderDialog = () => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('mp4-720p');
  
  const {
    isRendering,
    renderStatus,
    progress,
    currentStep,
    outputUrl,
    error,
    startRender,
    reset,
  } = useRenderStore();

  const handleRender = async () => {
    await startRender(format);
  };

  const handleClose = () => {
    if (!isRendering) {
      reset();
      setOpen(false);
    }
  };

  const handleDownload = () => {
    if (outputUrl) {
      window.open(outputUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Video className="h-4 w-4" />
          Render Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Export Video
          </DialogTitle>
          <DialogDescription>
            Choose your export format and render your video
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          {renderStatus === 'idle' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as ExportFormat)}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{FORMAT_LABELS[fmt]}</span>
                          <span className="text-xs text-muted-foreground">
                            {FORMAT_DESCRIPTIONS[fmt]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleRender}
                disabled={isRendering}
                className="w-full"
              >
                Start Render
              </Button>
            </>
          )}

          {/* Rendering Progress */}
          {(renderStatus === 'preparing' || renderStatus === 'rendering' || renderStatus === 'uploading') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{currentStep}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {FORMAT_LABELS[format]}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress}% complete
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p>⏱️ This may take a few minutes depending on video length and complexity.</p>
                <p className="mt-1">💡 You can close this dialog - we'll notify you when done.</p>
              </div>
            </div>
          )}

          {/* Success */}
          {renderStatus === 'completed' && outputUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Render Complete!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your video is ready to download
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Video
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {renderStatus === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Render Failed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {error || 'An unknown error occurred'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRender}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};