import { create } from 'zustand';
import { toast } from 'sonner';
import { segmentImage, loadImage, SegmentationResult } from '@/lib/segmentation';

export interface SegmentedLayer {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  visible: boolean;
}

interface SegmentationStore {
  layers: SegmentedLayer[];
  isProcessing: boolean;
  featherAmount: number;
  originalImage: File | null;
  
  setFeatherAmount: (amount: number) => void;
  processImage: (file: File) => Promise<void>;
  toggleLayerVisibility: (layerId: string) => void;
  exportLayer: (layerId: string) => void;
  clearLayers: () => void;
  addLayerToTimeline: (layerId: string) => void;
}

export const useSegmentationStore = create<SegmentationStore>((set, get) => ({
  layers: [],
  isProcessing: false,
  featherAmount: 0.5,
  originalImage: null,
  
  setFeatherAmount: (amount: number) => {
    set({ featherAmount: amount });
  },
  
  processImage: async (file: File) => {
    set({ isProcessing: true, originalImage: file });
    toast.info("Segmenting image...");
    
    try {
      const img = await loadImage(file);
      const { featherAmount } = get();
      const result: SegmentationResult = await segmentImage(img, featherAmount);
      
      const layers: SegmentedLayer[] = [
        {
          id: 'person',
          name: 'Person',
          blob: result.person,
          url: URL.createObjectURL(result.person),
          visible: true,
        },
        {
          id: 'background',
          name: 'Background',
          blob: result.background,
          url: URL.createObjectURL(result.background),
          visible: true,
        },
        {
          id: 'objects',
          name: 'Objects',
          blob: result.objects,
          url: URL.createObjectURL(result.objects),
          visible: true,
        },
      ];
      
      set({ layers, isProcessing: false });
      toast.success("Segmentation complete!");
    } catch (error) {
      console.error('Segmentation error:', error);
      toast.error("Failed to segment image");
      set({ isProcessing: false });
    }
  },
  
  toggleLayerVisibility: (layerId: string) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
  },
  
  exportLayer: (layerId: string) => {
    const layer = get().layers.find((l) => l.id === layerId);
    if (!layer) return;
    
    const url = layer.url;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layer.name.toLowerCase()}-layer.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success(`Exported ${layer.name} layer`);
  },
  
  clearLayers: () => {
    const { layers } = get();
    layers.forEach((layer) => URL.revokeObjectURL(layer.url));
    set({ layers: [], originalImage: null });
  },
  
  addLayerToTimeline: (layerId: string) => {
    const layer = get().layers.find((l) => l.id === layerId);
    if (layer) {
      toast.success(`Added ${layer.name} to timeline`);
      // Timeline integration will be handled by the Timeline component
    }
  },
}));
