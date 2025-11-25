// src/utils/frameCompositor.ts

import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";

/**
 * Draw one frame (baseFrame + elements) onto a canvas and return PNG Blob.
 * Works for normal frames and tween frames.
 */
export const composeFrame = async (frame: Frame, width: number = 1920, height: number = 1080): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context unavailable."));
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // Load base frame: masked if available, otherwise fallback to thumbnail
    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = frame.baseFrame || frame.thumbnail;

    baseImg.onload = () => {
      // Draw base image full size
      ctx.drawImage(baseImg, 0, 0, width, height);

      const elements = frame.elements || [];

      if (elements.length === 0) {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject("Failed to export PNG.")), "image/png");
        return;
      }

      let completed = 0;
      const total = elements.length;

      elements.forEach((el) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = el.image;

        img.onload = () => {
          ctx.save();

          // Move to element center
          ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);

          ctx.globalAlpha = (el.opacity ?? 100) / 100;

          // Apply CSS-style filters
          const filters: string[] = [];
          if (el.blur && el.blur > 0) filters.push(`blur(${el.blur}px)`);
          if (el.brightness && el.brightness !== 100) filters.push(`brightness(${el.brightness}%)`);
          if (el.glow && el.glow > 0) filters.push(`drop-shadow(0 0 ${el.glow}px white)`);

          ctx.filter = filters.length > 0 ? filters.join(" ") : "none";

          // Blend mode
          if (el.blendMode) {
            ctx.globalCompositeOperation = el.blendMode as GlobalCompositeOperation;
          }

          // Draw
          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);

          ctx.restore();

          completed++;
          if (completed === total) {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject("Failed to export PNG.")), "image/png");
          }
        };

        img.onerror = () => {
          console.warn("Could not load element image:", el.image);
          completed++;
          if (completed === total) {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject("Failed to export PNG.")), "image/png");
          }
        };
      });
    };

    baseImg.onerror = () => reject("Failed to load frame base image.");
  });
};

/**
 * Convert a frame into a DataURL (often used for previews in UI)
 */
export const composeFrameToDataURL = async (
  frame: Frame,
  width: number = 1920,
  height: number = 1080,
): Promise<string> => {
  const blob = await composeFrame(frame, width, height);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Compose many frames sequentially (used for video export)
 */
export const composeFrames = async (
  frames: Frame[],
  width: number = 1920,
  height: number = 1080,
  onProgress?: (i: number, total: number) => void,
): Promise<Blob[]> => {
  const out: Blob[] = [];

  for (let i = 0; i < frames.length; i++) {
    const blob = await composeFrame(frames[i], width, height);
    out.push(blob);
    onProgress?.(i + 1, frames.length);
  }

  return out;
};
