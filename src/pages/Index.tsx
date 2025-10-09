import { useState } from "react";
import { PromptSidebar } from "@/components/PromptSidebar";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { InfoPanel } from "@/components/InfoPanel";
import { toast } from "sonner";

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [videoInfo, setVideoInfo] = useState({
    duration: "00:05",
    resolution: "1920x1080",
    fps: 30,
    format: "MP4",
  });

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    toast.info("Starting video generation...");

    try {
      // Placeholder for API call - will be implemented with backend
      // const response = await fetch('/api/generate', {
      //   method: 'POST',
      //   body: JSON.stringify({ prompt })
      // });
      
      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock video URL for demonstration
      setVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
      setVideoInfo({
        duration: "00:05",
        resolution: "1920x1080",
        fps: 30,
        format: "MP4",
      });
      
      toast.success("Video generated successfully!");
    } catch (error) {
      toast.error("Failed to generate video");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center px-6">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          GenAI Video Editor Prototype
        </h1>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <PromptSidebar 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <div className="flex-1 flex flex-col">
          <VideoPreview videoUrl={videoUrl} isGenerating={isGenerating} />
          <Timeline />
        </div>

        <InfoPanel videoInfo={videoInfo} />
      </div>
    </div>
  );
};

export default Index;
