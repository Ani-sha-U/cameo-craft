import { create } from 'zustand';
import { toast } from 'sonner';

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
    toast.info("Starting video generation...");
    
    try {
      // Simulate generation time (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Set sample video URL
      set({ 
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
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
