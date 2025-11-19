import { Frame } from '@/store/framesStore';

interface ExtractFramesOptions {
  videoUrl: string;
  framesPerSecond?: number; // How many frames to extract per second (default: 1)
  maxFrames?: number; // Maximum number of frames to extract (default: 100)
}

export async function extractFramesFromVideo({
  videoUrl,
  framesPerSecond = 1,
  maxFrames = 100,
}: ExtractFramesOptions): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.preload = 'metadata';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const interval = 1 / framesPerSecond;
      const framesToExtract = Math.min(
        Math.floor(duration * framesPerSecond),
        maxFrames
      );

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const frames: Frame[] = [];
      let currentFrame = 0;

      const captureFrame = () => {
        if (currentFrame >= framesToExtract) {
          resolve(frames);
          return;
        }

        const timestamp = currentFrame * interval;
        video.currentTime = timestamp;
      };

      video.addEventListener('seeked', () => {
        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to thumbnail (scaled down for performance)
        const thumbnailCanvas = document.createElement('canvas');
        const thumbnailCtx = thumbnailCanvas.getContext('2d');
        const thumbnailWidth = 160;
        const thumbnailHeight = (canvas.height / canvas.width) * thumbnailWidth;

        thumbnailCanvas.width = thumbnailWidth;
        thumbnailCanvas.height = thumbnailHeight;

        if (thumbnailCtx) {
          thumbnailCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
          const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7);

          frames.push({
            id: `frame_${currentFrame}_${Date.now()}`,
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

        currentFrame++;
        captureFrame();
      });

      captureFrame();
    });

    video.addEventListener('error', (e) => {
      reject(new Error(`Failed to load video: ${e.message || 'Unknown error'}`));
    });
  });
}
