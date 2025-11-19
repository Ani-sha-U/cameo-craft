import { useState } from "react";
import { PromptSidebar } from "@/components/PromptSidebar";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { CameraToolbar } from "@/components/CameraToolbar";
import { CameraKeyframeTimeline } from "@/components/CameraKeyframeTimeline";
import { ElementsPanel } from "@/components/ElementsPanel";
import { ElementsCanvas } from "@/components/ElementsCanvas";
import { FrameStrip } from "@/components/FrameStrip";
import { FramePlayback } from "@/components/FramePlayback";
import { OnionSkinControls } from "@/components/OnionSkinControls";
import { RenderDialog } from "@/components/RenderDialog";
import { AssetLibrary } from "@/components/AssetLibrary";
import { ElementPropertiesPanel } from "@/components/ElementPropertiesPanel";
import { CanvasEditor } from "@/components/CanvasEditor";
import { ProjectMenu } from "@/components/ProjectMenu";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { FrameCanvas } from "@/components/FrameCanvas";
import { useFramesStore } from "@/store/framesStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssetLibraryCollapsed, setIsAssetLibraryCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'canvas'>('preview');
  const { frames } = useFramesStore();

  return (
    <div className="flex flex-col h-screen bg-background">
      <WelcomeDialog />
      
      {/* Header */}
      <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Painter
            </h1>
            <p className="text-[10px] text-muted-foreground">Frame-by-frame video editor</p>
          </div>
          <ProjectMenu />
        </div>
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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="mx-2 mt-1 w-fit h-8 text-xs">
              <TabsTrigger value="preview" className="text-xs py-1">Preview</TabsTrigger>
              <TabsTrigger value="canvas" className="text-xs py-1">Canvas Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 min-h-0 overflow-auto relative m-0">
              {frames.length > 0 ? (
                <div className="h-full flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
                  <div className="max-w-4xl w-full">
                    <FrameCanvas className="w-full h-auto rounded-lg shadow-2xl" />
                  </div>
                </div>
              ) : (
                <VideoPreview />
              )}
              <ElementsCanvas />
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 min-h-0 m-0">
              <CanvasEditor />
            </TabsContent>
          </Tabs>

          <div className="p-1 space-y-1 border-t border-border bg-card/50 max-h-[40vh] overflow-y-auto">
            <FrameStrip />
            <OnionSkinControls />
            <FramePlayback />
            <CameraToolbar />
            <CameraKeyframeTimeline />
            <Timeline />
          </div>
        </div>

        <div className="w-64 bg-card border-l border-border flex flex-col overflow-hidden">
          <ElementsPanel />
          <ElementPropertiesPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
