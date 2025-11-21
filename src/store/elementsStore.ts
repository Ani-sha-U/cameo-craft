import { create } from 'zustand';
import { toast } from 'sonner';
import { ImageSegmentationService, loadImageFromDataURL } from '@/services/imageSegmentation';

export interface Element {
  id: string;
  label: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blur: number;
  brightness: number;
  glow: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  maskImage?: string;
}

interface ElementsStore {
  elements: Element[];
  selectedElementId: string | null;
  isProcessing: boolean;
  setSelectedElement: (id: string | null) => void;
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  separateElements: (frameImage: string, frameId?: string) => Promise<void>;
  removeElement: (id: string) => void;
}

export const useElementsStore = create<ElementsStore>((set, get) => ({
  elements: [],
  selectedElementId: null,
  isProcessing: false,

  setSelectedElement: (id) => set({ selectedElementId: id }),

  addElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element],
      selectedElementId: element.id,
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  separateElements: async (frameImage: string, frameId?: string) => {
    if (!frameImage) {
      toast.error("No frame image provided");
      return;
    }

    set({ isProcessing: true });
    toast.info("Processing image locally (no API key needed)...");

    try {
      const segmentationService = new ImageSegmentationService();
      const imageElement = await loadImageFromDataURL(frameImage);
      
      const result = await segmentationService.segmentImage(imageElement);
      
      segmentationService.cleanup();

      if (result.elements.length === 0) {
        toast.warning("No elements detected in frame");
        set({ isProcessing: false });
        return;
      }

      // Center elements in a typical 1920x1080 canvas with some offset per element
      const canvasWidth = 1920;
      const canvasHeight = 1080;
      const elementWidth = 300;
      const elementHeight = 300;
      
      const newElements: Element[] = result.elements.map((el, idx) => ({
        id: `element_${Date.now()}_${idx}`,
        label: el.label,
        image: el.image,
        x: (canvasWidth - elementWidth) / 2 + idx * 30,
        y: (canvasHeight - elementHeight) / 2 + idx * 30,
        width: elementWidth,
        height: elementHeight,
        rotation: 0,
        opacity: 100,
        blur: 0,
        brightness: 100,
        glow: 0,
        blendMode: 'normal' as const,
        maskImage: undefined,
      }));

      // Update frame with masked thumbnail if frameId provided
      if (frameId) {
        const { useFramesStore } = require('@/store/framesStore');
        const framesStore = useFramesStore.getState();
        const frame = framesStore.frames.find((f: any) => f.id === frameId);
        
        if (frame) {
          // Update frame with masked thumbnail and add elements
          const updatedFrame = {
            ...frame,
            maskedThumbnail: result.maskedFrame,
            elements: [...frame.elements, ...newElements]
          };
          
          const updatedFrames = framesStore.frames.map((f: any) => 
            f.id === frameId ? updatedFrame : f
          );
          
          framesStore.addFrames(updatedFrames);
        }
      }

      // Store elements globally as well for the Elements Panel
      set({ 
        elements: newElements, 
        isProcessing: false 
      });
      
      toast.success(`Extracted ${newElements.length} elements locally!`);
    } catch (error) {
      toast.error("Failed to separate elements", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      console.error(error);
      set({ isProcessing: false });
    }
  },
}));