import { create } from 'zustand';
import { toast } from 'sonner';
import { EnsembleSegmenter, loadImageFromDataURL } from '@/services/segmentation/ensembleSegmenter';
import { ObjectTracker } from '@/services/objectTracking/tracker';
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
  trackedPositions?: Map<number, { x: number; y: number; width: number; height: number }>;
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
  trackElement: (elementId: string, frameId: string) => Promise<void>;
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
    toast.info("Segmenting with SAM + MediaPipe ensemble...");

    try {
      const segmenter = new EnsembleSegmenter();
      const imageElement = await loadImageFromDataURL(frameImage);
      
      const result = await segmenter.segment(imageElement);
      
      segmenter.cleanup();

      if (result.objects.length === 0) {
        toast.warning("No elements detected in frame");
        set({ isProcessing: false });
        return;
      }

      // CRITICAL FIX: Use actual bounding box from segmentation
      // Elements maintain their detected position and size through ALL render pipelines
      const newElements: Element[] = result.objects.map((obj, idx) => ({
        id: `element_${Date.now()}_${idx}`,
        label: obj.label,
        image: obj.image,
        // Use detected bounding box coordinates directly
        x: obj.bbox.x,
        y: obj.bbox.y,
        width: obj.bbox.w,
        height: obj.bbox.h,
        rotation: 0,
        opacity: 100,
        blur: 0,
        brightness: 100,
        glow: 0,
        blendMode: 'normal' as const,
        maskImage: undefined,
        easing: 'easeInOutCubic',
      }));

      // Update frame with masked thumbnail if frameId provided
      if (frameId) {
        const framesStore = useFramesStore.getState();
        const frame = framesStore.frames.find((f) => f.id === frameId);
        
        if (frame) {
          // CRITICAL: Only add NEW elements, don't duplicate
          const updatedFrame = {
            ...frame,
            maskedThumbnail: result.maskedFrame,
            elements: newElements // Replace, not append
          };
          
          const updatedFrames = framesStore.frames.map((f) => 
            f.id === frameId ? updatedFrame : f
          );
          
          framesStore.addFrames(updatedFrames);
        }
      }

      // Store elements globally
      set({ 
        elements: newElements, 
        isProcessing: false 
      });
      
      toast.success(`Extracted ${newElements.length} elements with ensemble segmentation!`);
    } catch (error) {
      toast.error("Failed to separate elements", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      console.error(error);
      set({ isProcessing: false });
    }
  },

  trackElement: async (elementId: string, frameId: string) => {
    const { elements } = get();
    const element = elements.find(e => e.id === elementId);
    
    if (!element) {
      toast.error("Element not found");
      return;
    }

    set({ isProcessing: true });
    toast.info("Tracking element across frames...");

    try {
      const framesStore = useFramesStore.getState();
      const currentFrameIndex = framesStore.frames.findIndex(f => f.id === frameId);
      
      if (currentFrameIndex === -1) {
        throw new Error("Frame not found");
      }

      const tracker = new ObjectTracker();
      const positions = await tracker.trackAcrossFrames(
        { x: element.x, y: element.y, w: element.width, h: element.height },
        element.label,
        framesStore.frames.map(f => ({ image: f.thumbnail })),
        currentFrameIndex
      );

      // Update element with tracked positions
      set((state) => ({
        elements: state.elements.map((el) =>
          el.id === elementId ? { ...el, trackedPositions: positions } : el
        ),
        isProcessing: false
      }));

      toast.success(`Element tracked across ${positions.size} frames!`);
    } catch (error) {
      toast.error("Failed to track element", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      console.error(error);
      set({ isProcessing: false });
    }
  },
}));