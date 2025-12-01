import { create } from 'zustand';
import { toast } from 'sonner';
import { ImageSegmentationService, loadImageFromDataURL } from '@/services/imageSegmentation';
import { useFramesStore } from '@/store/framesStore';

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
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart';
  motionBlur?: {
    amount: number;
    angle: number;
  };
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

      // Position elements with unique IDs to prevent duplicates
      const canvasWidth = 1920;
      const canvasHeight = 1080;
      const elementWidth = 300;
      const elementHeight = 300;
      const timestamp = Date.now();
      
      const newElements: Element[] = result.elements.map((el, idx) => ({
        id: `element_${frameId || 'global'}_${timestamp}_${idx}`,
        label: el.label,
        image: el.image,
        x: (canvasWidth - elementWidth) / 2 + idx * 40,
        y: (canvasHeight - elementHeight) / 2 + idx * 40,
        width: elementWidth,
        height: elementHeight,
        rotation: 0,
        opacity: 100,
        blur: 0,
        brightness: 100,
        glow: 0,
        blendMode: 'normal' as const,
        maskImage: undefined,
        easing: 'linear',
      }));

      // Update frame with masked base frame and elements if frameId provided
      if (frameId) {
        const framesStore = useFramesStore.getState();
        const frame = framesStore.frames.find((f) => f.id === frameId);
        
        if (frame) {
          // Update frame with masked base frame (background without extracted elements)
          // This is what the compositor will use as the base layer
          const updatedFrames = framesStore.frames.map((f) => 
            f.id === frameId 
              ? { 
                  ...f, 
                  baseFrame: result.maskedFrame, // Use masked frame as base for rendering
                  maskedThumbnail: result.maskedFrame,
                  elements: newElements // Replace elements (no duplicates)
                } 
              : f
          );
          
          framesStore.addFrames(updatedFrames);
          framesStore.updateFrameElements(frameId, newElements);
        }
        
        set({ isProcessing: false });
      } else {
        // Store globally only if no frame specified
        set({ 
          elements: newElements, 
          isProcessing: false 
        });
      }
      
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