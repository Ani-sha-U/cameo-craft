import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVideoStore } from "@/store/videoStore";
import { Upload, ChevronLeft, ChevronRight, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PromptSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PromptSidebar = ({ isCollapsed, onToggleCollapse }: PromptSidebarProps) => {
  const { imageFile, setImageFile, generateVideo, isGenerating } = useVideoStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image/(png|jpeg|jpg)')) {
        toast.error("Please upload a PNG or JPG image");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Image to Video</h2>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              🤗 Hugging Face • Stable Video Diffusion
            </Badge>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="image-upload" className="text-sm font-medium text-foreground">
                Upload Image
              </label>
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded-lg border border-border"
                  />
                  <Button
                    onClick={handleRemoveImage}
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    disabled={isGenerating}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span>
                    </p>
                    <p className="text-xs text-muted-foreground">PNG or JPG (max 10MB)</p>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isGenerating}
                  />
                </label>
              )}
            </div>

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !imageFile}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity font-semibold"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating video...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>

            <div className="mt-4 p-4 bg-muted rounded-lg border border-border space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">💡 Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Upload a clear, high-quality image</li>
                  <li>• Works best with centered subjects</li>
                  <li>• The model animates your image into a short video</li>
                  <li>• Avoid blurry or low-resolution images</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⏱️ First generation may take 20-30 seconds while the model warms up
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
