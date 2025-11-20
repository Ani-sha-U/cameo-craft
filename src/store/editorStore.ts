import { create } from 'zustand';
import { useFramesStore } from './framesStore';

export type EditMode = 'select' | 'cut' | 'trim' | 'split';
export type PlaybackSpeed = 0.25 | 0.5 | 1 | 1.5 | 2;

interface EditorStore {
  // Playback state
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  loop: boolean;
  
  // Edit mode
  editMode: EditMode;
  
  // Selection
  inPoint: number | null;
  outPoint: number | null;
  
  // History
  history: any[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  toggleLoop: () => void;
  setEditMode: (mode: EditMode) => void;
  setInPoint: (time: number | null) => void;
  setOutPoint: (time: number | null) => void;
  clearInOut: () => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  seekForward: (seconds: number) => void;
  seekBackward: (seconds: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  
  // History
  addToHistory: (state: any) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  loop: false,
  editMode: 'select',
  inPoint: null,
  outPoint: null,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  toggleLoop: () => set((state) => ({ loop: !state.loop })),
  setEditMode: (mode) => set({ editMode: mode }),
  setInPoint: (time) => set({ inPoint: time }),
  setOutPoint: (time) => set({ outPoint: time }),
  clearInOut: () => set({ inPoint: null, outPoint: null }),
  
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  seekForward: (seconds) => set((state) => ({ 
    currentTime: state.currentTime + (seconds * 1000) 
  })),
  
  seekBackward: (seconds) => set((state) => ({ 
    currentTime: Math.max(0, state.currentTime - (seconds * 1000)) 
  })),
  
  nextFrame: () => {
    const { frames, selectFrame, selectedFrameId } = useFramesStore.getState();
    const currentIndex = frames.findIndex(f => f.id === selectedFrameId);
    if (currentIndex < frames.length - 1) {
      selectFrame(frames[currentIndex + 1].id);
    }
  },
  
  prevFrame: () => {
    const { frames, selectFrame, selectedFrameId } = useFramesStore.getState();
    const currentIndex = frames.findIndex(f => f.id === selectedFrameId);
    if (currentIndex > 0) {
      selectFrame(frames[currentIndex - 1].id);
    }
  },
  
  goToStart: () => {
    const { frames, selectFrame } = useFramesStore.getState();
    if (frames.length > 0) {
      selectFrame(frames[0].id);
    }
    set({ currentTime: 0 });
  },
  goToEnd: () => {
    const { frames, selectFrame } = useFramesStore.getState();
    if (frames.length > 0) {
      selectFrame(frames[frames.length - 1].id);
      set({ currentTime: frames.length * 1000 });
    }
  },
  
  addToHistory: (state) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false,
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
      // Apply history state here
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1,
      });
      // Apply history state here
    }
  },
}));