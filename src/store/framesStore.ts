import { create } from "zustand";
import { Element } from "./elementsStore";

export interface Frame {
  id: string;
  thumbnail: string;
  timestamp: number;
  elements: Element[];
  baseFrame?: string; // Masked base image (MediaPipe)
  fullFrame?: string; // Optional HD full frame
  isTween?: boolean; // Tween marker
  canvasState: {
    zoom: number;
    panX: number;
    panY: number;
  };
  preloadedImage?: HTMLImageElement; // Cache preloaded image
}

interface FramesStore {
  frames: Frame[];
  selectedFrameId: string | null;
  isExtracting: boolean;
  isPlaying: boolean;
  fps: number;
  onionSkinEnabled: boolean;
  onionSkinRange: number;
  preloadedFrames: Map<string, HTMLImageElement>; // Store all preloaded frames

  addFrames: (frames: Frame[]) => void;
  selectFrame: (id: string) => void;
  updateFrameElements: (frameId: string, elements: Element[]) => void;
  updateFrameCanvasState: (frameId: string, canvasState: Partial<Frame["canvasState"]>) => void;
  duplicateFrame: (frameId: string) => void;
  deleteFrame: (frameId: string) => void;
  clearFrames: () => void;
  setIsExtracting: (isExtracting: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setFps: (fps: number) => void;
  setOnionSkinEnabled: (enabled: boolean) => void;
  setOnionSkinRange: (range: number) => void;
  interpolateFrames: (startFrameId: string, endFrameId: string, numFrames: number) => void;
  preloadAllFrames: () => Promise<void>; // Preload all frame images
  restoreFrames: (frames: Frame[]) => void; // Restore frames for undo/redo
}

export const useFramesStore = create<FramesStore>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  isExtracting: false,
  isPlaying: false,
  fps: 12,
  onionSkinEnabled: false,
  onionSkinRange: 2,
  preloadedFrames: new Map(),

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
      frames: state.frames.map((frame) => (frame.id === frameId ? { ...frame, elements } : frame)),
    }));

    // Add to history
    const { addToHistory } = require("./editorStore").useEditorStore.getState();
    addToHistory({ frames: get().frames });
  },

  updateFrameCanvasState: (frameId, canvasState) => {
    set((state) => ({
      frames: state.frames.map((frame) =>
        frame.id === frameId ? { ...frame, canvasState: { ...frame.canvasState, ...canvasState } } : frame,
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

    const newFrames = [...state.frames.slice(0, frameIndex + 1), newFrame, ...state.frames.slice(frameIndex + 1)];

    set({ frames: newFrames, selectedFrameId: newFrame.id });
  },

  deleteFrame: (frameId) => {
    const state = get();
    const newFrames = state.frames.filter((f) => f.id !== frameId);

    // If we deleted the selected frame, select another one
    let newSelectedId = state.selectedFrameId;
    if (state.selectedFrameId === frameId) {
      if (newFrames.length > 0) {
        const deletedIndex = state.frames.findIndex((f) => f.id === frameId);
        // Try to select the next frame, or the previous if it was the last
        const nextIndex = Math.min(deletedIndex, newFrames.length - 1);
        newSelectedId = newFrames[nextIndex]?.id || null;
      } else {
        newSelectedId = null;
      }
    }

    set({ frames: newFrames, selectedFrameId: newSelectedId });
  },

  clearFrames: () => {
    set({ frames: [], selectedFrameId: null, preloadedFrames: new Map() });
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

  interpolateFrames: async (startFrameId, endFrameId, numFrames) => {
    const state = get();
    const startIndex = state.frames.findIndex((f) => f.id === startFrameId);
    const endIndex = state.frames.findIndex((f) => f.id === endFrameId);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      console.error("Invalid frame selection for interpolation");
      return;
    }

    const startFrame = state.frames[startIndex];
    const endFrame = state.frames[endIndex];

    // Import tweening utilities
    const { tweenFrameElements } = await import("@/utils/frameTweening");
    const { composeFrameToDataURL } = await import("@/utils/frameCompositor");

    // Generate interpolated frames
    const interpolatedFrames: Frame[] = [];

    for (let i = 1; i <= numFrames; i++) {
      const t = i / (numFrames + 1); // Progress from 0 to 1
      const timestamp = startFrame.timestamp + (endFrame.timestamp - startFrame.timestamp) * t;

      // Tween elements between start and end frames
      const tweenedElements = tweenFrameElements(startFrame.elements, endFrame.elements, t);

      // Create intermediate frame
      const intermediateFrame: Frame = {
        id: `frame_interpolated_${Date.now()}_${i}`,
        thumbnail: startFrame.thumbnail, // Will be updated after composition
        timestamp,
        elements: tweenedElements,
        canvasState: {
          zoom: startFrame.canvasState.zoom + (endFrame.canvasState.zoom - startFrame.canvasState.zoom) * t,
          panX: startFrame.canvasState.panX + (endFrame.canvasState.panX - startFrame.canvasState.panX) * t,
          panY: startFrame.canvasState.panY + (endFrame.canvasState.panY - startFrame.canvasState.panY) * t,
        },
      };

      interpolatedFrames.push(intermediateFrame);
    }

    // Compose all interpolated frames to get actual thumbnails
    // This happens asynchronously but we insert frames immediately for responsiveness
    const newFrames = [
      ...state.frames.slice(0, startIndex + 1),
      ...interpolatedFrames,
      ...state.frames.slice(endIndex),
    ];

    set({ frames: newFrames });

    // Compose frames in background and update thumbnails
    for (let i = 0; i < interpolatedFrames.length; i++) {
      const frame = interpolatedFrames[i];
      try {
        const composedDataURL = await composeFrameToDataURL(frame);
        // Update frame thumbnail
        set((state) => ({
          frames: state.frames.map((f) => (f.id === frame.id ? { ...f, thumbnail: composedDataURL } : f)),
        }));
      } catch (error) {
        console.error("Failed to compose interpolated frame:", error);
      }
    }
  },

  preloadAllFrames: async () => {
    const { frames } = get();
    const preloadedMap = new Map<string, HTMLImageElement>();

    await Promise.all(
      frames.map(
        (frame) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
              preloadedMap.set(frame.id, img);
              resolve();
            };

            img.onerror = () => {
              console.warn(`Failed to preload frame: ${frame.id}`);
              resolve(); // Continue even if one fails
            };

            img.src = frame.thumbnail;
          }),
      ),
    );

    set({ preloadedFrames: preloadedMap });
  },

  restoreFrames: (frames) => {
    set({ frames });
  },
}));
