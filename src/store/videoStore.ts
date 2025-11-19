import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VideoStore {
  prompt: string;
  duration: number;
  videoUrl: string | undefined;
  isGenerating: boolean;
  setPrompt: (prompt: string) => void;
  setDuration: (duration: number) => void;
  generateVideo: () => Promise<void>;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  prompt: '',
  duration: 5,
  videoUrl: undefined,
  isGenerating: false,
  
  setPrompt: (prompt: string) => set({ prompt }),
  setDuration: (duration: number) => set({ duration }),
  
  generateVideo: async () => {
    const { prompt, duration } = get();
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    set({ isGenerating: true });
    toast.info("Starting video generation...");
    
    try {
      // Start video generation
      const { data: startData, error: startError } = await supabase.functions.invoke('generate', {
        body: { prompt, duration }
      });

      if (startError || !startData?.prediction_id) {
        const message = (startData as any)?.error || startError?.message || 'Unknown error';
        toast.error(`Failed to start generation`, {
          description: message,
        });
        console.error('Generation start error:', message);
        set({ isGenerating: false });
        return;
      }

      const predictionId = startData.prediction_id;
      console.log('Video generation started:', predictionId);
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('generate', {
            body: { predictionId }
          });

          if (statusError) {
            clearInterval(pollInterval);
            toast.error("Failed to check generation status");
            set({ isGenerating: false });
            return;
          }

          console.log('Status:', statusData.status);

          if (statusData.status === 'succeeded') {
            clearInterval(pollInterval);
            set({ 
              videoUrl: statusData.video_url,
              isGenerating: false 
            });
            toast.success("Video generated successfully!");
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            toast.error("Video generation failed", {
              description: statusData.error || 'Unknown error'
            });
            set({ isGenerating: false });
          }
        } catch (error) {
          clearInterval(pollInterval);
          toast.error("Failed to check status");
          console.error(error);
          set({ isGenerating: false });
        }
      }, 3000); // Poll every 3 seconds

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate video");
      console.error(error);
      set({ isGenerating: false });
    }
  },
}));
