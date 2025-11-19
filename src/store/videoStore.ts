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
    toast.info("Generating video...");
    
    try {
      // Call the backend API endpoint
      const { data, error } = await supabase.functions.invoke('generate', {
        body: { prompt, duration }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Unknown error';
        toast.error(`Video generation failed`, {
          description: message.includes('429') 
            ? 'Rate limit exceeded. Please try again in a moment.' 
            : message.includes('402')
            ? 'Insufficient credits. Please add more credits to continue.'
            : message || 'Please check your prompt and try again.',
        });
        console.error('Video generation error:', message);
        set({ isGenerating: false });
        return;
      }

      // Set the video URL from API response
      set({ 
        videoUrl: data.video_url,
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
