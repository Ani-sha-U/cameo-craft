import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  separateElements: (videoUrl: string) => Promise<void>;
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

  separateElements: async (videoUrl: string) => {
    if (!videoUrl) {
      toast.error("No video URL provided");
      return;
    }

    set({ isProcessing: true });
    toast.info("Separating elements from video...");

    try {
      const { data, error } = await supabase.functions.invoke('separateElements', {
        body: { videoUrl }
      });

      if (error || !data?.success) {
        const message = data?.error || error?.message || 'Failed to separate elements';
        toast.error("Element separation failed", {
          description: message,
        });
        console.error('Separation error:', message);
        set({ isProcessing: false });
        return;
      }

      const newElements: Element[] = data.elements.map((el: any, idx: number) => ({
        id: el.id || `element_${idx}`,
        label: el.label || `Element ${idx + 1}`,
        image: el.image,
        x: 50 + idx * 20,
        y: 50 + idx * 20,
        width: 200,
        height: 200,
        rotation: 0,
        opacity: 100,
        blur: 0,
        brightness: 100,
        glow: 0,
        blendMode: 'normal' as const,
        maskImage: undefined,
      }));

      set({ elements: newElements, isProcessing: false });
      toast.success(`Extracted ${newElements.length} elements!`);
    } catch (error) {
      toast.error("Failed to separate elements");
      console.error(error);
      set({ isProcessing: false });
    }
  },
}));