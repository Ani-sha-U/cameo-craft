import { useState } from "react";
import { PromptSidebar } from "@/components/PromptSidebar";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { InfoPanel } from "@/components/InfoPanel";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [videoInfo] = useState({
    duration: "00:05",
    resolution: "1920x1080",
    fps: 30,
    format: "MP4",
  });

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
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <div className="flex-1 flex flex-col">
          <VideoPreview />
          <Timeline />
        </div>

        <InfoPanel videoInfo={videoInfo} />
      </div>
    </div>
  );
};

export default Index;
