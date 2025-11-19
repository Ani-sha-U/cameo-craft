import { create } from 'zustand';
import { Element } from './elementsStore';

export interface Frame {
  id: string;
  thumbnail: string; // base64 image data
  timestamp: number; // in seconds
  elements: Element[]; // elements on this frame
  canvasState: {
    zoom: number;
    panX: number;
    panY: number;
  };
}

interface FramesStore {
  frames: Frame[];
  selectedFrameId: string | null;
  isExtracting: boolean;
  
  addFrames: (frames: Frame[]) => void;
  selectFrame: (id: string) => void;
  updateFrameElements: (frameId: string, elements: Element[]) => void;
  updateFrameCanvasState: (frameId: string, canvasState: Partial<Frame['canvasState']>) => void;
  duplicateFrame: (frameId: string) => void;
  clearFrames: () => void;
  setIsExtracting: (isExtracting: boolean) => void;
}

export const useFramesStore = create<FramesStore>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  isExtracting: false,

  addFrames: (frames) => {
    set({ frames });
    // Auto-select first frame if none selected
    if (!get().selectedFrameId && frames.length > 0) {
      set({ selectedFrameId: frames[0].id });
    }
  },

  selectFrame: (id) => {
    set({ selectedFrameId: id });
  },

  updateFrameElements: (frameId, elements) => {
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === frameId ? { ...frame, elements } : frame
      ),
    }));
  },

  updateFrameCanvasState: (frameId, canvasState) => {
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === frameId
          ? { ...frame, canvasState: { ...frame.canvasState, ...canvasState } }
          : frame
      ),
    }));
  },

  duplicateFrame: (frameId) => {
    const state = get();
    const frameIndex = state.frames.findIndex((f) => f.id === frameId);
    if (frameIndex === -1) return;

    const originalFrame = state.frames[frameIndex];
    const newFrame: Frame = {
      ...originalFrame,
      id: `frame_${Date.now()}_${Math.random()}`,
      elements: originalFrame.elements.map((el) => ({
        ...el,
        id: `${el.id}_copy_${Date.now()}`,
      })),
    };

    const newFrames = [
      ...state.frames.slice(0, frameIndex + 1),
      newFrame,
      ...state.frames.slice(frameIndex + 1),
    ];

    set({ frames: newFrames, selectedFrameId: newFrame.id });
  },

  clearFrames: () => {
    set({ frames: [], selectedFrameId: null });
  },

  setIsExtracting: (isExtracting) => {
    set({ isExtracting });
  },
}));
