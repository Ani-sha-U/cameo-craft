import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useFramesStore } from '@/store/framesStore';
import { toast } from 'sonner';

export const useKeyboardShortcuts = () => {
  const { 
    togglePlayPause, 
    seekForward, 
    seekBackward,
    nextFrame,
    prevFrame,
    goToStart,
    goToEnd,
    setInPoint,
    setOutPoint,
    clearInOut,
    currentTime,
  } = useEditorStore();
  
  const { duplicateFrame, interpolateFrames } = useFramesStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Playback controls
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      if (e.code === 'KeyK') {
        e.preventDefault();
        togglePlayPause();
        return;
      }

      if (e.code === 'KeyJ') {
        e.preventDefault();
        seekBackward(1);
        return;
      }

      if (e.code === 'KeyL') {
        e.preventDefault();
        seekForward(1);
        return;
      }

      // Frame navigation
      if (e.code === 'ArrowLeft' && !ctrl) {
        e.preventDefault();
        if (shift) {
          seekBackward(5);
        } else {
          prevFrame();
        }
        return;
      }

      if (e.code === 'ArrowRight' && !ctrl) {
        e.preventDefault();
        if (shift) {
          seekForward(5);
        } else {
          nextFrame();
        }
        return;
      }

      // Go to start/end
      if (e.code === 'Home') {
        e.preventDefault();
        goToStart();
        return;
      }

      if (e.code === 'End') {
        e.preventDefault();
        goToEnd();
        return;
      }

      // In/Out points
      if (e.code === 'KeyI') {
        e.preventDefault();
        setInPoint(currentTime);
        toast.success('In point set');
        return;
      }

      if (e.code === 'KeyO') {
        e.preventDefault();
        setOutPoint(currentTime);
        toast.success('Out point set');
        return;
      }

      if (e.code === 'KeyX') {
        e.preventDefault();
        clearInOut();
        toast.success('In/Out points cleared');
        return;
      }

      // Undo/Redo
      if (ctrl && e.code === 'KeyZ' && !shift) {
        e.preventDefault();
        // undo();
        toast.info('Undo');
        return;
      }

      if (ctrl && shift && e.code === 'KeyZ') {
        e.preventDefault();
        // redo();
        toast.info('Redo');
        return;
      }

      // Duplicate frame
      if (ctrl && e.code === 'KeyD') {
        e.preventDefault();
        const { selectedFrameId } = useFramesStore.getState();
        if (selectedFrameId) {
          duplicateFrame(selectedFrameId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime]);
};
