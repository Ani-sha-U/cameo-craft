import { Frame } from "@/store/framesStore";

interface ExtractFramesOptions {
  videoUrl: string;
  framesPerSecond?: number;
  maxFrames?: number;
}

/**
 * Reliable frame extraction without flicker or dropped frames.
 * Extracts frames sequentially and waits for frame rendering to settle.
 */
export async function extractFramesFromVideo({
  videoUrl,
  framesPerSecond,
  maxFrames = 500,
}: ExtractFramesOptions): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.preload = "auto";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      reject(new Error("Failed to create 2D canvas context"));
      return;
    }

    video.addEventListener("loadedmetadata", async () => {
      const duration = video.duration;

      // Auto-detect FPS if not provided (AI videos are usually 24–30 fps)
      // Use browser-specific properties when available
      const detectedFps = (() => {
        const webkitVideo = video as HTMLVideoElement & { webkitDecodedFrameCount?: number };
        if (webkitVideo.webkitDecodedFrameCount !== undefined && webkitVideo.webkitDecodedFrameCount > 0) {
          return Math.round(webkitVideo.webkitDecodedFrameCount / duration);
        }
        return 30; // Default fallback
      })();
      
      const fps = framesPerSecond || Math.min(30, detectedFps);

      const totalFrames = Math.min(Math.floor(duration * fps), maxFrames);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const thumbnailWidth = 300;
      const thumbnailHeight = (canvas.height / canvas.width) * thumbnailWidth;

      const frames: Frame[] = [];

      const waitForFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(true)));

      for (let i = 0; i < totalFrames; i++) {
        const t = i / fps;

        await new Promise<void>((res) => {
          const onSeeked = async () => {
            video.removeEventListener("seeked", onSeeked);

            // Wait for frame to render
            await waitForFrame();

            // Draw to main canvas
            ctx.drawImage(video, 0, 0);

            // Thumbnail canvas
            const thumbCanvas = document.createElement("canvas");
            thumbCanvas.width = thumbnailWidth;
            thumbCanvas.height = thumbnailHeight;

            const thumbCtx = thumbCanvas.getContext("2d");
            thumbCtx?.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);

            const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.95);

            frames.push({
              id: `frame_${i}_${Date.now()}`,
              thumbnail,
              timestamp: video.currentTime,
              elements: [],
              canvasState: { zoom: 1, panX: 0, panY: 0 },
            });

            res();
          };

          video.addEventListener("seeked", onSeeked, { once: true });
          video.currentTime = Math.min(t, duration - 0.001);
        });
      }

      resolve(frames);
    });

    video.onerror = () => reject(new Error("Could not load video for frame extraction."));
  });
}
