// src/utils/videoFrameExtractor.ts
import { Frame } from "@/store/framesStore";

interface ExtractFramesOptions {
  videoUrl: string;
  framesPerSecond?: number; // desired FPS (defaults to 30)
  maxFrames?: number; // maximum frames to extract (defaults to 500)
  thumbnailWidth?: number; // width for the timeline thumbnails (defaults to 300)
  fullResolution?: boolean; // if true, include base64 full-res PNG (optional)
}

/**
 * Reliable frame extraction without flicker or dropped frames.
 * Extracts frames sequentially and waits for frame rendering to settle.
 *
 * Each Frame entry will contain:
 *  - id
 *  - thumbnail (dataURL, small)
 *  - timestamp (seconds)
 *  - elements: [] (empty, to be filled later)
 *  - baseFrame?: string | undefined  <-- will be set after separation (masked frame)
 *  - fullFrame?: string | undefined  <-- optional full-resolution PNG (if fullResolution=true)
 */
export async function extractFramesFromVideo({
  videoUrl,
  framesPerSecond,
  maxFrames = 500,
  thumbnailWidth = 300,
  fullResolution = false,
}: ExtractFramesOptions): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true; // if browser blocks autoplay

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      reject(new Error("Failed to create 2D canvas context"));
      return;
    }

    // Wait for loadedmetadata to determine duration and dimensions
    video.addEventListener("loadedmetadata", async () => {
      try {
        const duration = video.duration;
        // fall back to 30fps if not specified
        const fps = framesPerSecond || 30;

        const totalFrames = Math.min(Math.floor(duration * fps), maxFrames);

        // Set canvas size to video resolution
        const videoWidth = video.videoWidth || 1920;
        const videoHeight = video.videoHeight || 1080;
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        const thumbnailHeight = Math.round((videoHeight / videoWidth) * thumbnailWidth);

        const frames: Frame[] = [];

        // helper: wait for next paint frame
        const waitForFrame = () => new Promise<void>((res) => requestAnimationFrame(() => res()));

        // helper: seek to time and draw frame
        const captureAt = async (
          timeSec: number,
        ): Promise<{
          thumbnailDataUrl: string;
          fullDataUrl?: string;
          actualTime: number;
        }> => {
          return await new Promise((resCapture, rejCapture) => {
            let didTimeout = false;
            const timeout = setTimeout(() => {
              didTimeout = true;
              rejCapture(new Error("Frame seek timed out"));
            }, 5000);

            const onSeeked = async () => {
              try {
                if (didTimeout) return;
                clearTimeout(timeout);
                video.removeEventListener("seeked", onSeeked);

                // Wait one frame for rendering to settle
                await waitForFrame();

                // Draw the exact video frame to the canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Create thumbnail
                const thumbCanvas = document.createElement("canvas");
                thumbCanvas.width = thumbnailWidth;
                thumbCanvas.height = thumbnailHeight;
                const thumbCtx = thumbCanvas.getContext("2d");
                if (thumbCtx) {
                  thumbCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
                }
                const thumbnailDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.92);

                let fullDataUrl: string | undefined;
                if (fullResolution) {
                  // full-res PNG snapshot (optional - large)
                  fullDataUrl = canvas.toDataURL("image/png");
                }

                resCapture({
                  thumbnailDataUrl,
                  fullDataUrl,
                  actualTime: video.currentTime,
                });
              } catch (err) {
                rejCapture(err);
              }
            };

            video.addEventListener("seeked", onSeeked, { once: true });
            // clamp time to duration - small epsilon to avoid NS errors
            video.currentTime = Math.min(timeSec, Math.max(0, duration - 0.001));
          });
        };

        // Sequential extraction loop (avoids seek race)
        for (let i = 0; i < totalFrames; i++) {
          const t = Math.min(i / fps, Math.max(0, duration - 0.001));
          const { thumbnailDataUrl, fullDataUrl, actualTime } = await captureAt(t);

          const frameId = `frame_${i}_${Date.now()}`;

          const frame: Frame = {
            id: frameId,
            thumbnail: thumbnailDataUrl,
            timestamp: actualTime,
            elements: [],
            // baseFrame will be set by MediaPipe separation (masked base without subject)
            baseFrame: undefined,
            // optional full res
            ...(fullDataUrl ? { fullFrame: fullDataUrl } : {}),
            canvasState: { zoom: 1, panX: 0, panY: 0 },
          } as unknown as Frame;

          frames.push(frame);
        }

        resolve(frames);
      } catch (err) {
        reject(err);
      }
    });

    video.addEventListener("error", (e) => {
      reject(new Error(`Failed to load video: ${(e as any)?.message || "Unknown error"}`));
    });

    // Safari mobile sometimes requires play() before seeking - attempt to load
    video.load();
  });
}

/**
 * Convenience: create an ArrayBuffer of all thumbnails (useful for caching)
 * Not necessary but provided if you want to persist frames to IndexedDB later.
 */
export async function extractThumbnailBlobs(frames: Frame[]): Promise<Blob[]> {
  const out: Blob[] = [];
  for (const f of frames) {
    const res = await fetch(f.thumbnail);
    const blob = await res.blob();
    out.push(blob);
  }
  return out;
}
