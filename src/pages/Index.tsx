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
import { CanvasEditor } from "@/components/CanvasEditor";
import { ProjectMenu } from "@/components/ProjectMenu";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssetLibraryCollapsed, setIsAssetLibraryCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'canvas'>('preview');

  return (
    <div className="flex flex-col h-screen bg-background">
      <WelcomeDialog />
      
      {/* Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              GenAI Video Editor
            </h1>
            <p className="text-xs text-muted-foreground">Canva + Blender + Runway</p>
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
            <TabsList className="mx-4 mt-2 w-fit">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="canvas">Canvas Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 min-h-0 overflow-auto relative m-0">
              <VideoPreview />
              <ElementsCanvas />
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 min-h-0 m-0">
              <CanvasEditor />
            </TabsContent>
          </Tabs>

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
