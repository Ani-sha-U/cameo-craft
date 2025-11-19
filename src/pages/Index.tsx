import { useState } from "react";
import { PromptSidebar } from "@/components/PromptSidebar";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { CameraToolbar } from "@/components/CameraToolbar";
import { CameraKeyframeTimeline } from "@/components/CameraKeyframeTimeline";
import { ElementsPanel } from "@/components/ElementsPanel";
import { ElementsCanvas } from "@/components/ElementsCanvas";
import { RenderDialog } from "@/components/RenderDialog";
import { AssetLibrary } from "@/components/AssetLibrary";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssetLibraryCollapsed, setIsAssetLibraryCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          GenAI Video Editor Prototype
        </h1>
        <RenderDialog />
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <AssetLibrary 
          isCollapsed={isAssetLibraryCollapsed}
          onToggleCollapse={() => setIsAssetLibraryCollapsed(!isAssetLibraryCollapsed)}
        />
        
        <PromptSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto relative">
            <VideoPreview />
            <ElementsCanvas />
          </div>
          <div className="p-2 space-y-2 border-t border-border bg-card/50">
            <CameraToolbar />
            <CameraKeyframeTimeline />
            <Timeline />
          </div>
        </div>

        <ElementsPanel />
      </div>
    </div>
  );
};

export default Index;
