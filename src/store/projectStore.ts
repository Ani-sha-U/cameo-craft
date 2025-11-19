import { create } from 'zustand';
import { toast } from 'sonner';
import { useTimelineStore } from './timelineStore';
import { useCameraStore } from './cameraStore';
import { useElementsStore } from './elementsStore';
import { useVideoStore } from './videoStore';

interface ProjectData {
  version: string;
  name: string;
  created: string;
  modified: string;
  data: {
    timeline: any;
    camera: any;
    elements: any;
    video: any;
  };
}

interface ProjectStore {
  projectName: string;
  lastSaved: string | null;
  
  setProjectName: (name: string) => void;
  saveProject: () => void;
  loadProject: (file: File) => Promise<void>;
  exportProject: () => string;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projectName: 'Untitled Project',
  lastSaved: null,
  
  setProjectName: (name) => {
    set({ projectName: name });
  },
  
  saveProject: () => {
    const { projectName } = get();
    
    // Gather all state
    const timelineState = useTimelineStore.getState();
    const cameraState = useCameraStore.getState();
    const elementsState = useElementsStore.getState();
    const videoState = useVideoStore.getState();
    
    const projectData: ProjectData = {
      version: '1.0.0',
      name: projectName,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      data: {
        timeline: {
          clips: timelineState.clips,
          totalDuration: timelineState.totalDuration,
          zoom: timelineState.zoom,
        },
        camera: {
          keyframes: cameraState.keyframes,
          duration: cameraState.duration,
          currentTransform: cameraState.currentTransform,
        },
        elements: {
          elements: elementsState.elements,
        },
        video: {
          prompt: videoState.prompt,
          duration: videoState.duration,
          videoUrl: videoState.videoUrl,
        },
      },
    };
    
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    set({ lastSaved: new Date().toISOString() });
    toast.success('Project saved successfully');
  },
  
  loadProject: async (file: File) => {
    try {
      const text = await file.text();
      const projectData: ProjectData = JSON.parse(text);
      
      if (!projectData.version || !projectData.data) {
        throw new Error('Invalid project file format');
      }
      
      // Restore timeline state
      if (projectData.data.timeline) {
        const timelineState = useTimelineStore.getState();
        timelineState.clips.length = 0;
        projectData.data.timeline.clips.forEach((clip: any) => {
          timelineState.clips.push(clip);
        });
        useTimelineStore.setState({
          clips: projectData.data.timeline.clips,
          totalDuration: projectData.data.timeline.totalDuration,
          zoom: projectData.data.timeline.zoom,
        });
      }
      
      // Restore camera state
      if (projectData.data.camera) {
        useCameraStore.setState({
          keyframes: projectData.data.camera.keyframes,
          duration: projectData.data.camera.duration,
          currentTransform: projectData.data.camera.currentTransform,
        });
      }
      
      // Restore elements state
      if (projectData.data.elements) {
        useElementsStore.setState({
          elements: projectData.data.elements.elements,
        });
      }
      
      // Restore video state
      if (projectData.data.video) {
        useVideoStore.setState({
          prompt: projectData.data.video.prompt,
          duration: projectData.data.video.duration,
          videoUrl: projectData.data.video.videoUrl,
        });
      }
      
      set({ 
        projectName: projectData.name,
        lastSaved: projectData.modified,
      });
      
      toast.success(`Project "${projectData.name}" loaded successfully`);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project', {
        description: error instanceof Error ? error.message : 'Invalid file format',
      });
    }
  },
  
  exportProject: () => {
    const { projectName } = get();
    
    const timelineState = useTimelineStore.getState();
    const cameraState = useCameraStore.getState();
    const elementsState = useElementsStore.getState();
    const videoState = useVideoStore.getState();
    
    const projectData = {
      version: '1.0.0',
      name: projectName,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      data: {
        timeline: {
          clips: timelineState.clips,
          totalDuration: timelineState.totalDuration,
          zoom: timelineState.zoom,
        },
        camera: {
          keyframes: cameraState.keyframes,
          duration: cameraState.duration,
          currentTransform: cameraState.currentTransform,
        },
        elements: {
          elements: elementsState.elements,
        },
        video: {
          prompt: videoState.prompt,
          duration: videoState.duration,
          videoUrl: videoState.videoUrl,
        },
      },
    };
    
    return JSON.stringify(projectData, null, 2);
  },
}));