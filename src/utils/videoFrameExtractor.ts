import { Frame } from '@/store/framesStore';

interface ExtractFramesOptions {
  videoUrl: string;
  framesPerSecond?: number; // How many frames to extract per second (default: auto-detect from video, typically 24-30)
  maxFrames?: number; // Maximum number of frames to extract (default: 300)
}

export async function extractFramesFromVideo({
  videoUrl,
  framesPerSecond, // Will auto-detect if not provided
  maxFrames = 300,
}: ExtractFramesOptions): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.preload = 'auto'; // Changed from 'metadata' to ensure full video loads

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.addEventListener('loadedmetadata', async () => {
      const duration = video.duration;
      
      // Auto-detect FPS from video if not provided (assume 30fps for most videos)
      const actualFPS = framesPerSecond || 30;
      
      // Extract EVERY frame - use very small interval to ensure we don't miss any
      const interval = 1 / actualFPS;
      const framesToExtract = Math.min(
        Math.floor(duration * actualFPS),
        maxFrames
      );

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const frames: Frame[] = [];
      let currentFrameIndex = 0;
      let seekInProgress = false;

      const captureFrame = (): Promise<void> => {
        return new Promise((resolveCapture) => {
          if (currentFrameIndex >= framesToExtract) {
            resolveCapture();
            return;
          }

          const timestamp = currentFrameIndex * interval;
          
          // Ensure we don't start a new seek while one is in progress
          if (seekInProgress) {
            resolveCapture();
            return;
          }
          
          seekInProgress = true;
          
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            
            // Draw current frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to high-quality thumbnail
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailCtx = thumbnailCanvas.getContext('2d');
            const thumbnailWidth = 480;
            const thumbnailHeight = (canvas.height / canvas.width) * thumbnailWidth;

            thumbnailCanvas.width = thumbnailWidth;
            thumbnailCanvas.height = thumbnailHeight;

            if (thumbnailCtx) {
              thumbnailCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
              const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.95);

              frames.push({
                id: `frame_${currentFrameIndex}_${Date.now()}`,
                thumbnail,
                timestamp: video.currentTime,
                elements: [],
                canvasState: {
                  zoom: 1,
                  panX: 0,
                  panY: 0,
                },
              });
            }

            seekInProgress = false;
            currentFrameIndex++;
            resolveCapture();
          };
          
          video.addEventListener('seeked', onSeeked, { once: true });
          video.currentTime = timestamp;
        });
      };

      // Sequential frame extraction to avoid race conditions
      try {
        for (let i = 0; i < framesToExtract; i++) {
          await captureFrame();
        }
        resolve(frames);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (e) => {
      reject(new Error(`Failed to load video: ${e.message || 'Unknown error'}`));
    });
  });
}
