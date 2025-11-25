// composer.ts
import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";

/**
 * Compose a single frame by drawing the masked base frame + provided elements (interpolated or static)
 */
export const composeFrame = async (
  baseFrame: Frame, // Frame object (must contain baseFrame PNG data URL if separation applied)
  elements: Element[], // Interpolated elements to draw for this frame
  width: number = 1920,
  height: number = 1080,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return reject(new Error("Could not get canvas context"));

    ctx.clearRect(0, 0, width, height);

    // Base frame without subject (preferred), fallback to thumbnail
    const baseSrc = (baseFrame as any).baseFrame || baseFrame.thumbnail;
    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = baseSrc;

    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, width, height);

      if (!elements || elements.length === 0) {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Blob failed"))), "image/png");
        return;
      }

      let drawn = 0;
      const total = elements.length;

      elements.forEach((el) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = el.image;

        img.onload = () => {
          ctx.save();

          // center-based transform
          ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);

          ctx.globalAlpha = (el.opacity ?? 100) / 100;

          // filters
          const filters: string[] = [];
          if (el.blur && el.blur > 0) filters.push(`blur(${el.blur}px)`);
          if (el.brightness !== undefined && el.brightness !== 100) filters.push(`brightness(${el.brightness}%)`);
          ctx.filter = filters.length ? filters.join(" ") : "none";

          if (el.blendMode) {
            ctx.globalCompositeOperation = el.blendMode as GlobalCompositeOperation;
          }

          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);

          ctx.restore();

          drawn++;
          if (drawn === total) {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Blob failed"))), "image/png");
          }
        };

        img.onerror = () => {
          console.warn("Failed to load element image:", el.image);
          drawn++;
          if (drawn === total) {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Blob failed"))), "image/png");
          }
        };
      });
    };

    baseImg.onerror = () => {
      reject(new Error("Failed to load base frame image"));
    };
  });
};

/**
 * Helper: compose many frames sequentially (for export)
 */
export const composeFrames = async (
  frames: Frame[],
  elementLists: Element[][],
  width: number = 1920,
  height: number = 1080,
  onProgress?: (i: number, total: number) => void,
): Promise<Blob[]> => {
  const out: Blob[] = [];
  for (let i = 0; i < frames.length; i++) {
    const blob = await composeFrame(frames[i], elementLists[i] || [], width, height);
    out.push(blob);
    onProgress?.(i + 1, frames.length);
  }
  return out;
};
