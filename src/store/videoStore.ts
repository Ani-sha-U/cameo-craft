import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VideoStore {
  imageFile: File | null;
  videoUrl: string | undefined;
  isGenerating: boolean;
  setImageFile: (file: File | null) => void;
  generateVideo: () => Promise<void>;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  imageFile: null,
  videoUrl: undefined,
  isGenerating: false,
  
  setImageFile: (file: File | null) => set({ imageFile: file }),
  
  generateVideo: async () => {
    const { imageFile } = get();
    
    if (!imageFile) {
      toast.error("Please upload an image");
      return;
    }
    
    set({ isGenerating: true });
    toast.info("Generating video...");
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Call the backend API endpoint
      const { data, error } = await supabase.functions.invoke('generate', {
        body: { image: base64Image }
      });

      if (error) {
        // Check for model loading errors
        if (error.message?.includes('warming up') || error.message?.includes('retry after 20')) {
          toast.error("Model is warming up — please retry after 20 seconds");
        } else {
          throw error;
        }
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
      toast.error("Failed to generate video");
      console.error(error);
      set({ isGenerating: false });
    }
  },
}));
