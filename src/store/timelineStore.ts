// src/store/timelineStore.ts
import create from "zustand";
import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";
import { generateTweenFrames } from "@/utils/frameTweening";

type TimelineState = {
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  fps: number;

  loadFrames: (frames: Frame[]) => void;
  insertTweenBetween: (frameIndex: number, tweenCount?: number) => void;
  setBaseFrame: (frameId: string, baseFrameDataUrl: string) => void;
  updateFrameElements: (frameId: string, elements: Element[]) => void;
  replaceFrameAt: (index: number, newFrame: Frame) => void;
  removeFrame: (frameId: string) => void;
  moveFrame: (fromIndex: number, toIndex: number) => void;

  play: () => void;
  pause: () => void;
  gotoFrameIndex: (index: number) => void;

  getFrameById: (frameId: string) => Frame | undefined;
  findFrameIndexById: (frameId: string) => number;
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  frames: [],
  currentFrameIndex: 0,
  isPlaying: false,
  fps: 30,

  loadFrames: (frames: Frame[]) => {
    set(() => ({
      frames: frames.slice(),
      currentFrameIndex: 0,
    }));
  },

  insertTweenBetween: (frameIndex: number, tweenCount: number = 15) => {
    const state = get();
    const frames = state.frames.slice();

    if (frameIndex < 0 || frameIndex >= frames.length - 1) {
      console.warn("insertTweenBetween: invalid frameIndex", frameIndex);
      return;
    }

    const frameA = frames[frameIndex];
    const frameB = frames[frameIndex + 1];

    const tweenFrames = generateTweenFrames(frameA, frameB, tweenCount);

    const newFrames = [...frames.slice(0, frameIndex + 1), ...tweenFrames, ...frames.slice(frameIndex + 1)];

    // Update frames and adjust currentFrameIndex if needed
    set((prev) => {
      const newIndex =
        prev.currentFrameIndex > frameIndex ? prev.currentFrameIndex + tweenFrames.length : prev.currentFrameIndex;
      return { frames: newFrames, currentFrameIndex: newIndex };
    });
  },

  setBaseFrame: (frameId: string, baseFrameDataUrl: string) => {
    const state = get();
    const idx = state.frames.findIndex((f) => f.id === frameId);
    if (idx === -1) {
      console.warn("setBaseFrame: frame not found", frameId);
      return;
    }
    const updatedFrames = state.frames.slice();
    updatedFrames[idx] = { ...updatedFrames[idx], baseFrame: baseFrameDataUrl };
    set(() => ({ frames: updatedFrames }));
  },

  updateFrameElements: (frameId: string, elements: Element[]) => {
    const state = get();
    const idx = state.frames.findIndex((f) => f.id === frameId);
    if (idx === -1) {
      console.warn("updateFrameElements: frame not found", frameId);
      return;
    }
    const updatedFrames = state.frames.slice();
    updatedFrames[idx] = { ...updatedFrames[idx], elements: elements.slice() };
    set(() => ({ frames: updatedFrames }));
  },

  replaceFrameAt: (index: number, newFrame: Frame) => {
    const state = get();
    if (index < 0 || index >= state.frames.length) {
      console.warn("replaceFrameAt: invalid index", index);
      return;
    }
    const updatedFrames = state.frames.slice();
    updatedFrames[index] = newFrame;
    set(() => ({ frames: updatedFrames }));
  },

  removeFrame: (frameId: string) => {
    const state = get();
    const idx = state.frames.findIndex((f) => f.id === frameId);
    if (idx === -1) return;
    const updated = state.frames.slice();
    updated.splice(idx, 1);
    let newCurrent = state.currentFrameIndex;
    if (newCurrent >= updated.length) newCurrent = Math.max(0, updated.length - 1);
    set(() => ({ frames: updated, currentFrameIndex: newCurrent }));
  },

  moveFrame: (fromIndex: number, toIndex: number) => {
    const state = get();
    if (fromIndex < 0 || fromIndex >= state.frames.length || toIndex < 0 || toIndex > state.frames.length - 1) {
      console.warn("moveFrame: invalid indices", fromIndex, toIndex);
      return;
    }
    const updated = state.frames.slice();
    const [frame] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, frame);
    set(() => ({ frames: updated }));
  },

  play: () => {
    set(() => ({ isPlaying: true }));
  },

  pause: () => {
    set(() => ({ isPlaying: false }));
  },

  gotoFrameIndex: (index: number) => {
    const state = get();
    let idx = index;
    if (idx < 0) idx = 0;
    if (idx >= state.frames.length) idx = Math.max(0, state.frames.length - 1);
    set(() => ({ currentFrameIndex: idx, isPlaying: false }));
  },

  getFrameById: (frameId: string) => {
    const state = get();
    return state.frames.find((f) => f.id === frameId);
  },

  findFrameIndexById: (frameId: string) => {
    const state = get();
    return state.frames.findIndex((f) => f.id === frameId);
  },
}));
