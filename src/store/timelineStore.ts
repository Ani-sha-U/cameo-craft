// src/store/timelineStore.ts
import create from "zustand";
import produce from "immer";
import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";
import { generateTweenFrames } from "@/utils/frameTweening";

/**
 * Timeline store: manages the sequence of frames, insertion of tween frames,
 * and helper methods for updating frames after MediaPipe segmentation.
 *
 * Important:
 * - generateTweenFrames(frameA, frameB, count) returns an array of Frames (tween frames)
 * - Each Frame must optionally contain baseFrame (masked PNG) and elements: Element[]
 */

type TimelineState = {
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  fps: number;

  // Load frames (e.g., after extraction)
  loadFrames: (frames: Frame[]) => void;

  // Insert tween frames between frameIndex and frameIndex+1
  // defaultTweenCount is 15 for your project
  insertTweenBetween: (frameIndex: number, tweenCount?: number) => void;

  // Set the baseFrame (masked) of a frame after MediaPipe segmentation
  setBaseFrame: (frameId: string, baseFrameDataUrl: string) => void;

  // Update elements of a frame (after element extraction or manual edits)
  updateFrameElements: (frameId: string, elements: Element[]) => void;

  // Replace a frame at index
  replaceFrameAt: (index: number, newFrame: Frame) => void;

  // Remove frame by id
  removeFrame: (frameId: string) => void;

  // Move a frame fromIndex -> toIndex
  moveFrame: (fromIndex: number, toIndex: number) => void;

  // Playback controls
  play: () => void;
  pause: () => void;
  gotoFrameIndex: (index: number) => void;

  // Helpers
  getFrameById: (frameId: string) => Frame | undefined;
  findFrameIndexById: (frameId: string) => number;
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  frames: [],
  currentFrameIndex: 0,
  isPlaying: false,
  fps: 30,

  loadFrames: (frames: Frame[]) =>
    set(
      produce((state: TimelineState) => {
        state.frames = frames.slice();
        state.currentFrameIndex = 0;
      }),
    ),

  insertTweenBetween: (frameIndex: number, tweenCount: number = 15) => {
    const state = get();
    const frames = state.frames.slice();

    // Validate indices
    if (frameIndex < 0 || frameIndex >= frames.length - 1) {
      console.warn("insertTweenBetween: invalid frameIndex", frameIndex);
      return;
    }

    const frameA = frames[frameIndex];
    const frameB = frames[frameIndex + 1];

    // generate tween frames
    const tweenFrames = generateTweenFrames(frameA, frameB, tweenCount);

    // Insert after frameIndex
    const newFrames = [...frames.slice(0, frameIndex + 1), ...tweenFrames, ...frames.slice(frameIndex + 1)];

    set(
      produce((s: TimelineState) => {
        s.frames = newFrames;
        // If playhead was after insertion point, shift it forward by tweenFrames length
        if (s.currentFrameIndex > frameIndex) {
          s.currentFrameIndex = s.currentFrameIndex + tweenFrames.length;
        }
      }),
    );
  },

  setBaseFrame: (frameId: string, baseFrameDataUrl: string) => {
    set(
      produce((state: TimelineState) => {
        const idx = state.frames.findIndex((f) => f.id === frameId);
        if (idx === -1) {
          console.warn("setBaseFrame: frame not found", frameId);
          return;
        }
        state.frames[idx] = {
          ...state.frames[idx],
          baseFrame: baseFrameDataUrl,
        } as Frame;
      }),
    );
  },

  updateFrameElements: (frameId: string, elements: Element[]) => {
    set(
      produce((state: TimelineState) => {
        const idx = state.frames.findIndex((f) => f.id === frameId);
        if (idx === -1) {
          console.warn("updateFrameElements: frame not found", frameId);
          return;
        }
        state.frames[idx] = {
          ...state.frames[idx],
          elements: elements.slice(),
        } as Frame;
      }),
    );
  },

  replaceFrameAt: (index: number, newFrame: Frame) => {
    set(
      produce((state: TimelineState) => {
        if (index < 0 || index >= state.frames.length) {
          console.warn("replaceFrameAt: invalid index", index);
          return;
        }
        state.frames[index] = newFrame;
      }),
    );
  },

  removeFrame: (frameId: string) => {
    set(
      produce((state: TimelineState) => {
        const idx = state.frames.findIndex((f) => f.id === frameId);
        if (idx === -1) return;
        state.frames.splice(idx, 1);
        if (state.currentFrameIndex >= state.frames.length) {
          state.currentFrameIndex = Math.max(0, state.frames.length - 1);
        }
      }),
    );
  },

  moveFrame: (fromIndex: number, toIndex: number) => {
    set(
      produce((state: TimelineState) => {
        if (fromIndex < 0 || fromIndex >= state.frames.length || toIndex < 0 || toIndex > state.frames.length - 1) {
          console.warn("moveFrame: invalid indices", fromIndex, toIndex);
          return;
        }
        const [frame] = state.frames.splice(fromIndex, 1);
        state.frames.splice(toIndex, 0, frame);
      }),
    );
  },

  play: () =>
    set(
      produce((state: TimelineState) => {
        state.isPlaying = true;
      }),
    ),

  pause: () =>
    set(
      produce((state: TimelineState) => {
        state.isPlaying = false;
      }),
    ),

  gotoFrameIndex: (index: number) =>
    set(
      produce((state: TimelineState) => {
        if (index < 0) index = 0;
        if (index >= state.frames.length) index = state.frames.length - 1;
        state.currentFrameIndex = index;
        state.isPlaying = false;
      }),
    ),

  getFrameById: (frameId: string) => {
    const state = get();
    return state.frames.find((f) => f.id === frameId);
  },

  findFrameIndexById: (frameId: string) => {
    const state = get();
    return state.frames.findIndex((f) => f.id === frameId);
  },
}));
