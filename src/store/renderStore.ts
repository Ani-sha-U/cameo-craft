import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type ExportFormat = 'mp4-720p' | 'mp4-1080p' | 'webm' | 'gif';
export type RenderStatus = 'idle' | 'preparing' | 'rendering' | 'uploading' | 'completed' | 'error';

interface RenderStore {
  isRendering: boolean;
  renderStatus: RenderStatus;
  progress: number;
  currentStep: string;
  outputUrl: string | null;
  error: string | null;
  
  startRender: (format: ExportFormat) => Promise<void>;
  reset: () => void;
}

export const useRenderStore = create<RenderStore>((set, get) => ({
  isRendering: false,
  renderStatus: 'idle',
  progress: 0,
  currentStep: '',
  outputUrl: null,
  error: null,
  
  startRender: async (format: ExportFormat) => {
    const { useTimelineStore } = await import('./timelineStore');
    const { useCameraStore } = await import('./cameraStore');
    const { useElementsStore } = await import('./elementsStore');
    const { useFramesStore } = await import('./framesStore');
    const { composeFrames } = await import('@/utils/frameCompositor');
    
    const timelineState = useTimelineStore.getState();
    const cameraState = useCameraStore.getState();
    const elementsState = useElementsStore.getState();
    const framesState = useFramesStore.getState();
    
    if (timelineState.clips.length === 0 && framesState.frames.length === 0) {
      toast.error("No clips or frames to render");
      return;
    }
    
    set({ 
      isRendering: true, 
      renderStatus: 'preparing',
      progress: 0,
      currentStep: 'Preparing render data...',
      outputUrl: null,
      error: null,
    });
    
    try {
      // Compose all frames to bitmaps for final export
      set({ 
        currentStep: 'Composing frames with all edits...',
        progress: 5,
      });

      const composedFrameBlobs = await composeFrames(
        framesState.frames,
        1920,
        1080,
        (current, total) => {
          set({ 
            progress: 5 + (current / total) * 30,
            currentStep: `Composing frame ${current} of ${total}...`,
          });
        }
      );

      // Convert blobs to base64 for transmission
      const composedFramesData = await Promise.all(
        composedFrameBlobs.map((blob) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        })
      );

      // Prepare render data with composed frames
      const renderData = {
        format,
        clips: timelineState.clips,
        cameraKeyframes: cameraState.keyframes,
        elements: elementsState.elements,
        frames: framesState.frames,
        composedFrames: composedFramesData, // Send composed bitmaps
        fps: framesState.fps,
        totalDuration: timelineState.totalDuration,
      };
      
      console.log('Starting render with composed frames:', {
        frameCount: composedFramesData.length,
        format,
        fps: framesState.fps,
      });
      
      set({ 
        renderStatus: 'rendering',
        progress: 40,
        currentStep: 'Sending to render service...',
      });
      
      // Call render edge function
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: renderData
      });
      
      if (error || !data?.success) {
        const message = data?.error || error?.message || 'Render failed';
        throw new Error(message);
      }
      
      const renderJobId = data.jobId;
      
      // Poll for render status
      const pollInterval = setInterval(async () => {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('render-video', {
            body: { jobId: renderJobId }
          });
          
          if (statusError) {
            clearInterval(pollInterval);
            throw new Error(statusError.message);
          }
          
          console.log('Render status:', statusData);
          
          set({
            progress: statusData.progress || 50,
            currentStep: statusData.step || 'Rendering...',
          });
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            set({
              renderStatus: 'completed',
              progress: 100,
              currentStep: 'Render complete!',
              outputUrl: statusData.url,
              isRendering: false,
            });
            toast.success("Video rendered successfully!");
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            throw new Error(statusData.error || 'Render failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          const message = error instanceof Error ? error.message : 'Failed to check render status';
          set({
            renderStatus: 'error',
            error: message,
            isRendering: false,
          });
          toast.error("Render failed", { description: message });
        }
      }, 2000);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Render failed';
      set({
        renderStatus: 'error',
        error: message,
        isRendering: false,
      });
      toast.error("Render failed", { description: message });
      console.error('Render error:', error);
    }
  },
  
  reset: () => {
    set({
      isRendering: false,
      renderStatus: 'idle',
      progress: 0,
      currentStep: '',
      outputUrl: null,
      error: null,
    });
  },
}));