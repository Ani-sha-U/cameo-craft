import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";

/**
 * Renders a frame with all its elements to a canvas and returns the bitmap
 */
export const composeFrame = async (frame: Frame, width: number = 1920, height: number = 1080): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return reject(new Error("Could not get canvas context"));

    ctx.clearRect(0, 0, width, height);

    // ⛔ DO NOT USE frame.thumbnail — it contains the original subject
    // ✅ Use masked base frame instead
    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = frame.baseFrame || frame.thumbnail; // fallback ONLY if no separation

    baseImg.onload = () => {
      // Draw base frame WITHOUT original elements
      ctx.drawImage(baseImg, 0, 0, width, height);

      if (frame.elements.length === 0) {
        return canvas.toBlob((b) => (b ? resolve(b) : reject("Blob failed")), "image/png");
      }

      let loaded = 0;
      const total = frame.elements.length;

      frame.elements.forEach((el) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = el.image;

        img.onload = () => {
          ctx.save();

          // Apply global transforms
          ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);

          ctx.globalAlpha = el.opacity / 100;

          // Apply visual filters
          const filters = [];
          if (el.blur) filters.push(`blur(${el.blur}px)`);
          if (el.brightness !== 100) filters.push(`brightness(${el.brightness}%)`);
          if (el.glow) filters.push(`drop-shadow(0 0 ${el.glow}px white)`);

          ctx.filter = filters.join(" ") || "none";

          if (el.blendMode) {
            ctx.globalCompositeOperation = el.blendMode as GlobalCompositeOperation;
          }

          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);

          ctx.restore();

          loaded++;
          if (loaded === total) {
            canvas.toBlob((b) => (b ? resolve(b) : reject("Blob failed")), "image/png");
          }
        };

        img.onerror = () => {
          console.error("Element load fail", el.image);
          loaded++;
          if (loaded === total) {
            canvas.toBlob((b) => (b ? resolve(b) : reject("Blob failed")), "image/png");
          }
        };
      });
    };

    baseImg.onerror = () => reject(new Error("Base frame failed to load"));
  });
};
