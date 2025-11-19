import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Layers, Package, Film, Camera, Download } from "lucide-react";

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show welcome dialog on first visit
    const hasVisited = localStorage.getItem('hasVisitedGenAIEditor');
    if (!hasVisited) {
      setOpen(true);
      localStorage.setItem('hasVisitedGenAIEditor', 'true');
    }
  }, []);

  const steps = [
    {
      icon: Video,
      title: "Generate Video",
      description: "Enter a text prompt to generate AI video clips",
      step: "Step 2"
    },
    {
      icon: Film,
      title: "Auto-Add to Timeline",
      description: "Generated clips automatically appear in your timeline",
      step: "Step 4"
    },
    {
      icon: Layers,
      title: "Separate Elements",
      description: "Extract foreground/background layers for advanced editing",
      step: "Step 6"
    },
    {
      icon: Package,
      title: "Asset Library",
      description: "Drag assets, stickers, effects onto your canvas",
      step: "Step 7"
    },
    {
      icon: Camera,
      title: "Camera Controls",
      description: "Add zoom, pan, rotate with keyframe animation",
      step: "Step 5"
    },
    {
      icon: Download,
      title: "Export Video",
      description: "Render final video in multiple formats and resolutions",
      step: "Step 11"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Welcome to GenAI Video Editor
          </DialogTitle>
          <DialogDescription>
            A powerful video editor combining Canva + Blender + Runway
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{step.step}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={() => setOpen(false)}>
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
