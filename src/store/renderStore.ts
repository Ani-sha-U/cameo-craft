// src/store/renderStore.ts

import create from "zustand";
import produce from "immer";
import { useTimelineStore } from "@/store/timelineStore";
import { composeFrameToDataURL } from "@/utils/frameCompositor";

type RenderState = {
  isRendering: boolean;
  playing: boolean;
  currentFrameDataUrl: string | null;
  renderCanvasWidth: number;
  renderCanvasHeight: number;

  // Play / Pause
  play: () => void;
  pause: () => void;

  // Jump to frame
  setFrameIndex: (index: number) => void;

  // Internal loop
  _tickPlayback: () => void;

  // Force re-render of current frame
  renderCurrentFrame: () => void;
};

let playbackTimer: number | null = null;

export const useRenderStore = create<RenderState>((set, get) => ({
  isRendering: false,
  playing: false,
  currentFrameDataUrl: null,
  renderCanvasWidth: 1920,
  renderCanvasHeight: 1080,

  play: () => {
    const timeline = useTimelineStore.getState();
    if (timeline.frames.length === 0) return;

    set(
      produce((state: RenderState) => {
        state.playing = true;
      }),
    );

    get()._tickPlayback();
  },

  pause: () => {
    set(
      produce((state: RenderState) => {
        state.playing = false;
      }),
    );

    if (playbackTimer) {
      cancelAnimationFrame(playbackTimer);
      playbackTimer = null;
    }
  },

  setFrameIndex: (index: number) => {
    const timeline = useTimelineStore.getState();
    timeline.gotoFrameIndex(index);

    // Immediately render the new frame
    get().renderCurrentFrame();
  },

  /**
   * Rendering loop – plays frames at correct FPS.
   * Uses requestAnimationFrame, not setInterval, to avoid flicker.
   */
  _tickPlayback: () => {
    const render = get();
    const timeline = useTimelineStore.getState();

    if (!render.playing) return;

    const fps = timeline.fps || 30;
    const frameDuration = 1000 / fps;

    let lastTimestamp = performance.now();

    const loop = () => {
      if (!get().playing) return;

      const now = performance.now();
      const delta = now - lastTimestamp;

      if (delta >= frameDuration) {
        lastTimestamp = now - (delta % frameDuration);

        const currentIdx = timeline.currentFrameIndex;
        const totalFrames = timeline.frames.length;

        // Advance frame
        if (currentIdx < totalFrames - 1) {
          timeline.gotoFrameIndex(currentIdx + 1);
        } else {
          // Loop or stop at end — here we stop
          render.pause();
          return;
        }

        // Render new frame
        render.renderCurrentFrame();
      }

      playbackTimer = requestAnimationFrame(loop);
    };

    playbackTimer = requestAnimationFrame(loop);
  },

  /**
   * Force-render the CURRENT frame into a DataURL.
   * This drives the <img> or <canvas> inside VideoPreview.
   */
  renderCurrentFrame: async () => {
    const timeline = useTimelineStore.getState();
    const render = get();

    const index = timeline.currentFrameIndex;
    const frame = timeline.frames[index];
    if (!frame) return;

    set(
      produce((state: RenderState) => {
        state.isRendering = true;
      }),
    );

    try {
      const dataUrl = await composeFrameToDataURL(frame, render.renderCanvasWidth, render.renderCanvasHeight);

      set(
        produce((state: RenderState) => {
          state.currentFrameDataUrl = dataUrl;
          state.isRendering = false;
        }),
      );
    } catch (err) {
      console.error("Failed to render frame:", err);
      set(
        produce((state: RenderState) => {
          state.isRendering = false;
        }),
      );
    }
  },
}));
