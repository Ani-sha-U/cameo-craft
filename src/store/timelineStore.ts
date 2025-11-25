import { create } from 'zustand';
import { toast } from 'sonner';

export type TransitionType = 'none' | 'crossfade' | 'slide' | 'zoom' | 'fade-to-black';

export interface Clip {
  id: string;
  videoUrl: string;
  startTime: number; // Position on timeline in milliseconds
  duration: number; // Clip duration in milliseconds
  trimStart: number; // Trim from video start in milliseconds
  trimEnd: number; // Trim from video end in milliseconds
  color: string;
  label: string;
  transition: TransitionType;
  transitionDuration: number; // in milliseconds
}

interface TimelineStore {
  clips: Clip[];
  selectedClipId: string | null;
  playheadPosition: number; // in milliseconds
  totalDuration: number; // in milliseconds
  isPlaying: boolean;
  zoom: number; // pixels per second
  
  // Clip management
  addClip: (videoUrl: string, label: string) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  reorderClip: (id: string, newStartTime: number) => void;
  splitClip: (id: string, splitTime: number) => void;
  
  // Selection
  selectClip: (id: string | null) => void;
  
  // Playhead
  setPlayheadPosition: (position: number) => void;
  play: () => void;
  pause: () => void;
  
  // Zoom
  setZoom: (zoom: number) => void;
  
  // Helpers
  getClipAtTime: (time: number) => Clip | null;
  calculateTotalDuration: () => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
];

let colorIndex = 0;

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  clips: [],
  selectedClipId: null,
  playheadPosition: 0,
  totalDuration: 0,
  isPlaying: false,
  zoom: 100, // 100 pixels per second
  
  addClip: (videoUrl: string, label: string) => {
    const { clips, calculateTotalDuration } = get();
    
    // Find the last clip's end time to place new clip after it
    const lastClip = clips.length > 0 
      ? clips.reduce((latest, clip) => 
          (clip.startTime + clip.duration > latest.startTime + latest.duration) ? clip : latest
        )
      : null;
    
    const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;
    
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      videoUrl,
      startTime,
      duration: 5000, // Default 5 seconds
      trimStart: 0,
      trimEnd: 0,
      color: COLORS[colorIndex % COLORS.length],
      label,
      transition: 'none',
      transitionDuration: 500,
    };
    
    colorIndex++;
    
    set({ clips: [...clips, newClip] });
    calculateTotalDuration();
    toast.success(`Added clip: ${label}`);
  },
  
  removeClip: (id: string) => {
    const { clips, selectedClipId, calculateTotalDuration } = get();
    const clip = clips.find(c => c.id === id);
    
    set({ 
      clips: clips.filter(c => c.id !== id),
      selectedClipId: selectedClipId === id ? null : selectedClipId,
    });
    
    calculateTotalDuration();
    toast.success(`Removed clip: ${clip?.label || ''}`);
  },
  
  updateClip: (id: string, updates: Partial<Clip>) => {
    set((state) => ({
      clips: state.clips.map(clip => 
        clip.id === id ? { ...clip, ...updates } : clip
      ),
    }));
    get().calculateTotalDuration();
  },
  
  reorderClip: (id: string, newStartTime: number) => {
    const clampedTime = Math.max(0, newStartTime);
    set((state) => ({
      clips: state.clips.map(clip => 
        clip.id === id ? { ...clip, startTime: clampedTime } : clip
      ),
    }));
    get().calculateTotalDuration();
  },
  
  splitClip: (id: string, splitTime: number) => {
    const { clips, calculateTotalDuration } = get();
    const clip = clips.find(c => c.id === id);
    
    if (!clip) return;
    
    const relativeTime = splitTime - clip.startTime;
    
    if (relativeTime <= 0 || relativeTime >= clip.duration) {
      toast.error("Can't split at this position");
      return;
    }
    
    const firstPart: Clip = {
      ...clip,
      id: `${clip.id}-1`,
      duration: relativeTime,
      label: `${clip.label} (1)`,
    };
    
    const secondPart: Clip = {
      ...clip,
      id: `${clip.id}-2`,
      startTime: clip.startTime + relativeTime,
      duration: clip.duration - relativeTime,
      trimStart: clip.trimStart + relativeTime,
      label: `${clip.label} (2)`,
    };
    
    set({
      clips: clips.map(c => c.id === id ? firstPart : c).concat(secondPart),
    });
    
    calculateTotalDuration();
    toast.success("Clip split successfully");
  },
  
  selectClip: (id: string | null) => {
    set({ selectedClipId: id });
  },
  
  setPlayheadPosition: (position: number) => {
    const clampedPosition = Math.max(0, Math.min(position, get().totalDuration));
    set({ playheadPosition: clampedPosition });
  },
  
  play: () => {
    set({ isPlaying: true });
    
    const startTime = Date.now();
    const startPosition = get().playheadPosition;
    
    const animate = () => {
      const { isPlaying, totalDuration } = get();
      
      if (!isPlaying) return;
      
      const elapsed = Date.now() - startTime;
      const newPosition = startPosition + elapsed;
      
      if (newPosition >= totalDuration) {
        set({ isPlaying: false, playheadPosition: 0 });
        return;
      }
      
      set({ playheadPosition: newPosition });
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  },
  
  pause: () => {
    set({ isPlaying: false });
  },
  
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(20, Math.min(500, zoom)) });
  },
  
  getClipAtTime: (time: number) => {
    const { clips } = get();
    return clips.find(clip => 
      time >= clip.startTime && time < clip.startTime + clip.duration
    ) || null;
  },
  
  calculateTotalDuration: () => {
    const { clips } = get();
    
    if (clips.length === 0) {
      set({ totalDuration: 10000 }); // Default 10 seconds
      return;
    }
    
    const maxEnd = Math.max(
      ...clips.map(clip => clip.startTime + clip.duration)
    );
    
    set({ totalDuration: Math.max(maxEnd, 10000) });
  },
}));