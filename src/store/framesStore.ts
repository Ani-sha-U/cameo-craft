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
  isPlaying: boolean;
  fps: number;
  onionSkinEnabled: boolean;
  onionSkinRange: number;
  
  addFrames: (frames: Frame[]) => void;
  selectFrame: (id: string) => void;
  updateFrameElements: (frameId: string, elements: Element[]) => void;
  updateFrameCanvasState: (frameId: string, canvasState: Partial<Frame['canvasState']>) => void;
  duplicateFrame: (frameId: string) => void;
  clearFrames: () => void;
  setIsExtracting: (isExtracting: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setFps: (fps: number) => void;
  setOnionSkinEnabled: (enabled: boolean) => void;
  setOnionSkinRange: (range: number) => void;
  interpolateFrames: (startFrameId: string, endFrameId: string, numFrames: number) => void;
}

export const useFramesStore = create<FramesStore>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  isExtracting: false,
  isPlaying: false,
  fps: 24,
  onionSkinEnabled: false,
  onionSkinRange: 2,

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

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setFps: (fps) => {
    set({ fps });
  },

  setOnionSkinEnabled: (enabled) => {
    set({ onionSkinEnabled: enabled });
  },

  setOnionSkinRange: (range) => {
    set({ onionSkinRange: range });
  },

  interpolateFrames: (startFrameId, endFrameId, numFrames) => {
    const state = get();
    const startIndex = state.frames.findIndex((f) => f.id === startFrameId);
    const endIndex = state.frames.findIndex((f) => f.id === endFrameId);
    
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) return;

    const startFrame = state.frames[startIndex];
    const endFrame = state.frames[endIndex];

    // Create interpolated frames
    const newFrames: Frame[] = [];
    for (let i = 1; i <= numFrames; i++) {
      const t = i / (numFrames + 1);
      
      // Interpolate elements
      const interpolatedElements = startFrame.elements.map((startEl) => {
        const endEl = endFrame.elements.find((e) => e.id === startEl.id);
        if (!endEl) return startEl;

        return {
          ...startEl,
          id: `${startEl.id}_interp_${i}`,
          x: startEl.x + (endEl.x - startEl.x) * t,
          y: startEl.y + (endEl.y - startEl.y) * t,
          rotation: startEl.rotation + (endEl.rotation - startEl.rotation) * t,
          opacity: startEl.opacity + (endEl.opacity - startEl.opacity) * t,
          width: startEl.width + (endEl.width - startEl.width) * t,
          height: startEl.height + (endEl.height - startEl.height) * t,
        };
      });

      newFrames.push({
        id: `frame_interp_${Date.now()}_${i}`,
        thumbnail: startFrame.thumbnail,
        timestamp: startFrame.timestamp + (endFrame.timestamp - startFrame.timestamp) * t,
        elements: interpolatedElements,
        canvasState: {
          zoom: startFrame.canvasState.zoom + (endFrame.canvasState.zoom - startFrame.canvasState.zoom) * t,
          panX: startFrame.canvasState.panX + (endFrame.canvasState.panX - startFrame.canvasState.panX) * t,
          panY: startFrame.canvasState.panY + (endFrame.canvasState.panY - startFrame.canvasState.panY) * t,
        },
      });
    }

    // Insert interpolated frames
    const updatedFrames = [
      ...state.frames.slice(0, startIndex + 1),
      ...newFrames,
      ...state.frames.slice(startIndex + 1),
    ];

    set({ frames: updatedFrames });
  },
}));
