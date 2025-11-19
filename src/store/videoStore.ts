import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VideoStore {
  prompt: string;
  videoUrl: string | undefined;
  isGenerating: boolean;
  setPrompt: (prompt: string) => void;
  generateVideo: () => Promise<void>;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  prompt: '',
  videoUrl: undefined,
  isGenerating: false,
  
  setPrompt: (prompt: string) => set({ prompt }),
  
  generateVideo: async () => {
    const { prompt } = get();
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    set({ isGenerating: true });
    toast.info("Generating video...");
    
    try {
      // Call the backend API endpoint
      const { data, error } = await supabase.functions.invoke('generate', {
        body: { prompt }
      });

      if (error) {
        const message = (data as any)?.error || error.message || '';
        toast.error(`Video generation failed: ${message}`);
        console.error('Video generation error:', message);
        set({ isGenerating: false });
        return;
      }

      // Set the video URL from API response
      set({ 
        videoUrl: data.output_url,
        isGenerating: false 
      });
      
      toast.success("Video generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate video");
      console.error(error);
      set({ isGenerating: false });
    }
  },
}));
