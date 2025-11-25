import { create } from "zustand";
import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";
import { generateTweenFrames } from "@/utils/frameTweening";

export type TransitionType = "none" | "crossfade" | "slide" | "zoom";

type TimelineState = {
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  fps: number;

  loadFrames: (frames: Frame[]) => void;
  insertTweenBetween: (index: number, count?: number) => void;
  setBaseFrame: (id: string, base: string) => void;
  updateFrameElements: (id: string, elements: Element[]) => void;
  gotoFrameIndex: (index: number) => void;
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  frames: [],
  currentFrameIndex: 0,
  isPlaying: false,
  fps: 30,

  loadFrames: (frames) => set({ frames, currentFrameIndex: 0 }),

  insertTweenBetween: (idx, count = 15) => {
    const state = get();
    if (idx < 0 || idx >= state.frames.length - 1) return;

    const A = state.frames[idx];
    const B = state.frames[idx + 1];
    const tweens = generateTweenFrames(A, B, count);

    const updated = [...state.frames.slice(0, idx + 1), ...tweens, ...state.frames.slice(idx + 1)];

    set({ frames: updated });
  },

  setBaseFrame: (id, base) => {
    const state = get();
    const updated = state.frames.map((f) => (f.id === id ? { ...f, baseFrame: base } : f));
    set({ frames: updated });
  },

  updateFrameElements: (id, elements) => {
    const state = get();
    const updated = state.frames.map((f) => (f.id === id ? { ...f, elements } : f));
    set({ frames: updated });
  },

  gotoFrameIndex: (index) => {
    const total = get().frames.length;
    const clamped = Math.max(0, Math.min(index, total - 1));
    set({ currentFrameIndex: clamped, isPlaying: false });
  },
}));
