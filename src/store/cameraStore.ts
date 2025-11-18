import { create } from 'zustand';
import { toast } from 'sonner';

export interface CameraTransform {
  zoom: number;
  panX: number;
  panY: number;
  rotate: number;
  dolly: number;
}

export interface CameraKeyframe {
  id: string;
  time: number;
  transform: CameraTransform;
}

interface CameraStore {
  currentTransform: CameraTransform;
  keyframes: CameraKeyframe[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  setZoom: (zoom: number) => void;
  setPanX: (panX: number) => void;
  setPanY: (panY: number) => void;
  setRotate: (rotate: number) => void;
  setDolly: (dolly: number) => void;
  
  addKeyframe: (time: number) => void;
  removeKeyframe: (id: string) => void;
  updateKeyframe: (id: string, transform: CameraTransform) => void;
  
  playPreview: () => void;
  stopPreview: () => void;
  resetCamera: () => void;
  
  getTransformAtTime: (time: number) => CameraTransform;
}

const DEFAULT_TRANSFORM: CameraTransform = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotate: 0,
  dolly: 0,
};

// Ease-in-out interpolation
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Linear interpolation
const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * easeInOutCubic(t);
};

export const useCameraStore = create<CameraStore>((set, get) => ({
  currentTransform: { ...DEFAULT_TRANSFORM },
  keyframes: [],
  isPlaying: false,
  currentTime: 0,
  duration: 5000, // 5 seconds default
  
  setZoom: (zoom: number) => {
    set((state) => ({
      currentTransform: { ...state.currentTransform, zoom },
    }));
  },
  
  setPanX: (panX: number) => {
    set((state) => ({
      currentTransform: { ...state.currentTransform, panX },
    }));
  },
  
  setPanY: (panY: number) => {
    set((state) => ({
      currentTransform: { ...state.currentTransform, panY },
    }));
  },
  
  setRotate: (rotate: number) => {
    set((state) => ({
      currentTransform: { ...state.currentTransform, rotate },
    }));
  },
  
  setDolly: (dolly: number) => {
    set((state) => ({
      currentTransform: { ...state.currentTransform, dolly },
    }));
  },
  
  addKeyframe: (time: number) => {
    const { currentTransform, keyframes } = get();
    const id = `keyframe-${Date.now()}`;
    
    const newKeyframe: CameraKeyframe = {
      id,
      time,
      transform: { ...currentTransform },
    };
    
    const updatedKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    set({ keyframes: updatedKeyframes });
    toast.success(`Added keyframe at ${(time / 1000).toFixed(1)}s`);
  },
  
  removeKeyframe: (id: string) => {
    set((state) => ({
      keyframes: state.keyframes.filter((kf) => kf.id !== id),
    }));
    toast.success('Removed keyframe');
  },
  
  updateKeyframe: (id: string, transform: CameraTransform) => {
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === id ? { ...kf, transform } : kf
      ),
    }));
  },
  
  getTransformAtTime: (time: number): CameraTransform => {
    const { keyframes } = get();
    
    if (keyframes.length === 0) {
      return { ...DEFAULT_TRANSFORM };
    }
    
    // Find surrounding keyframes
    let prevKeyframe: CameraKeyframe | null = null;
    let nextKeyframe: CameraKeyframe | null = null;
    
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        prevKeyframe = keyframes[i];
      }
      if (keyframes[i].time > time && !nextKeyframe) {
        nextKeyframe = keyframes[i];
        break;
      }
    }
    
    // Before first keyframe
    if (!prevKeyframe && nextKeyframe) {
      return { ...nextKeyframe.transform };
    }
    
    // After last keyframe
    if (prevKeyframe && !nextKeyframe) {
      return { ...prevKeyframe.transform };
    }
    
    // Between two keyframes - interpolate
    if (prevKeyframe && nextKeyframe) {
      const duration = nextKeyframe.time - prevKeyframe.time;
      const elapsed = time - prevKeyframe.time;
      const t = duration > 0 ? elapsed / duration : 0;
      
      return {
        zoom: lerp(prevKeyframe.transform.zoom, nextKeyframe.transform.zoom, t),
        panX: lerp(prevKeyframe.transform.panX, nextKeyframe.transform.panX, t),
        panY: lerp(prevKeyframe.transform.panY, nextKeyframe.transform.panY, t),
        rotate: lerp(prevKeyframe.transform.rotate, nextKeyframe.transform.rotate, t),
        dolly: lerp(prevKeyframe.transform.dolly, nextKeyframe.transform.dolly, t),
      };
    }
    
    return { ...DEFAULT_TRANSFORM };
  },
  
  playPreview: () => {
    const { duration } = get();
    set({ isPlaying: true, currentTime: 0 });
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= duration) {
        set({ isPlaying: false, currentTime: 0 });
        toast.success('Camera preview complete');
        return;
      }
      
      const transform = get().getTransformAtTime(elapsed);
      set({ 
        currentTime: elapsed,
        currentTransform: transform,
      });
      
      if (get().isPlaying) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    toast.info('Playing camera preview...');
  },
  
  stopPreview: () => {
    set({ isPlaying: false });
    toast.info('Stopped camera preview');
  },
  
  resetCamera: () => {
    set({ 
      currentTransform: { ...DEFAULT_TRANSFORM },
      keyframes: [],
      isPlaying: false,
      currentTime: 0,
    });
    toast.success('Camera reset to defaults');
  },
}));
