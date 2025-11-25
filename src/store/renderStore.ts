// src/store/renderStore.ts

import create from "zustand";
import { useTimelineStore } from "@/store/timelineStore";
import { composeFrameToDataURL } from "@/utils/frameCompositor";

type RenderState = {
  playing: boolean;
  isRendering: boolean;
  currentFrameDataUrl: string | null;
  renderCanvasWidth: number;
  renderCanvasHeight: number;

  play: () => void;
  pause: () => void;
  setFrameIndex: (index: number) => void;
  renderCurrentFrame: () => void;

  _tickPlayback: () => void;
};

let playbackTimer: number | null = null;

export const useRenderStore = create<RenderState>((set, get) => ({
  playing: false,
  isRendering: false,
  currentFrameDataUrl: null,
  renderCanvasWidth: 1920,
  renderCanvasHeight: 1080,

  play: () => {
    const timeline = useTimelineStore.getState();
    if (timeline.frames.length === 0) return;

    set({ playing: true });
    get()._tickPlayback();
  },

  pause: () => {
    set({ playing: false });
    if (playbackTimer) {
      cancelAnimationFrame(playbackTimer);
      playbackTimer = null;
    }
  },

  setFrameIndex: (index: number) => {
    const timeline = useTimelineStore.getState();
    timeline.gotoFrameIndex(index);
    get().renderCurrentFrame();
  },

  _tickPlayback: () => {
    if (!get().playing) return;

    const timeline = useTimelineStore.getState();
    const fps = timeline.fps || 30;
    const msPerFrame = 1000 / fps;

    let last = performance.now();

    const loop = () => {
      if (!get().playing) return;

      const now = performance.now();
      const delta = now - last;

      if (delta >= msPerFrame) {
        last = now - (delta % msPerFrame);

        const i = timeline.currentFrameIndex;
        const total = timeline.frames.length;

        if (i < total - 1) {
          timeline.gotoFrameIndex(i + 1);
        } else {
          get().pause();
          return;
        }

        get().renderCurrentFrame();
      }

      playbackTimer = requestAnimationFrame(loop);
    };

    playbackTimer = requestAnimationFrame(loop);
  },

  renderCurrentFrame: async () => {
    const timeline = useTimelineStore.getState();
    const frame = timeline.frames[timeline.currentFrameIndex];

    if (!frame) return;

    set({ isRendering: true });

    try {
      const dataUrl = await composeFrameToDataURL(frame, get().renderCanvasWidth, get().renderCanvasHeight);

      set({
        currentFrameDataUrl: dataUrl,
        isRendering: false,
      });
    } catch (err) {
      console.error("Render error:", err);
      set({ isRendering: false });
    }
  },
}));
