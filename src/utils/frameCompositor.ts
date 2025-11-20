import { Frame } from '@/store/framesStore';
import { Element } from '@/store/elementsStore';

/**
 * Renders a frame with all its elements to a canvas and returns the bitmap
 */
export const composeFrame = async (
  frame: Frame,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    // Draw base frame thumbnail
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = frame.thumbnail;

    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, width, height);

      // Draw all elements
      if (frame.elements.length === 0) {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
        return;
      }

      let loadedCount = 0;
      const totalElements = frame.elements.length;

      // Load and draw each element
      frame.elements.forEach((element) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = element.image;

        img.onload = () => {
          ctx.save();

          // Apply transformations
          ctx.globalAlpha = element.opacity / 100;
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation * Math.PI) / 180);

          // Apply filters
          const filters = [];
          if (element.blur > 0) filters.push(`blur(${element.blur}px)`);
          if (element.brightness !== 100) filters.push(`brightness(${element.brightness}%)`);
          ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

          // Apply blend mode
          if (element.blendMode) {
            ctx.globalCompositeOperation = element.blendMode as GlobalCompositeOperation;
          }

          ctx.drawImage(
            img,
            -element.width / 2,
            -element.height / 2,
            element.width,
            element.height
          );

          ctx.restore();

          loadedCount++;
          if (loadedCount === totalElements) {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            }, 'image/png');
          }
        };

        img.onerror = () => {
          console.error('Failed to load element image:', element.image);
          loadedCount++;
          if (loadedCount === totalElements) {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            }, 'image/png');
          }
        };
      });
    };

    baseImg.onerror = () => {
      reject(new Error('Failed to load base frame image'));
    };
  });
};

/**
 * Renders a frame to a data URL
 */
export const composeFrameToDataURL = async (
  frame: Frame,
  width: number = 1920,
  height: number = 1080
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
 * Batch compose multiple frames
 */
export const composeFrames = async (
  frames: Frame[],
  width: number = 1920,
  height: number = 1080,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> => {
  const composedFrames: Blob[] = [];

  for (let i = 0; i < frames.length; i++) {
    const blob = await composeFrame(frames[i], width, height);
    composedFrames.push(blob);
    onProgress?.(i + 1, frames.length);
  }

  return composedFrames;
};
