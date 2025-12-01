import { Frame } from "@/store/framesStore";
import { Element } from "@/store/elementsStore";

/**
 * Layered Frame Compositor
 * Based on animation-editor architecture with proper layer rendering
 * 
 * Rendering pipeline:
 * 1. Draw base frame (masked background without extracted elements)
 * 2. Draw each element as independent layer with transforms
 * 3. Apply effects: opacity, filters, motion blur, blend modes
 */

interface CompositionContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Create a reusable composition context
 */
const createCompositionContext = (width: number, height: number): CompositionContext => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { 
    alpha: true,
    willReadFrequently: false 
  });

  if (!ctx) throw new Error("Could not get canvas context");

  return { canvas, ctx, width, height };
};

/**
 * Load image from URL with caching support
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Draw base frame layer (background without extracted elements)
 */
const drawBaseLayer = async (
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  height: number
): Promise<void> => {
  // Use masked base frame if available, otherwise use original thumbnail
  const baseImageSrc = frame.baseFrame || frame.maskedThumbnail || frame.thumbnail;
  const baseImg = await loadImage(baseImageSrc);
  
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(baseImg, 0, 0, width, height);
  ctx.restore();
};

/**
 * Apply transform matrix to element
 * Uses proper translate -> rotate -> scale order
 */
const applyElementTransform = (
  ctx: CanvasRenderingContext2D,
  element: Element,
  img: HTMLImageElement
): void => {
  // Move to element position
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  
  // Apply rotation around center
  ctx.rotate((element.rotation * Math.PI) / 180);
  
  // Scale based on element size vs original image size
  const scaleX = element.width / img.width;
  const scaleY = element.height / img.height;
  ctx.scale(scaleX, scaleY);
};

/**
 * Apply visual effects to element
 */
const applyElementEffects = (
  ctx: CanvasRenderingContext2D,
  element: Element
): void => {
  // Opacity
  ctx.globalAlpha = element.opacity / 100;

  // Blend mode
  if (element.blendMode && element.blendMode !== 'normal') {
    ctx.globalCompositeOperation = element.blendMode as GlobalCompositeOperation;
  }

  // Filters: blur, brightness, glow (motion blur applied separately)
  const filters: string[] = [];
  
  if (element.blur > 0) {
    filters.push(`blur(${element.blur}px)`);
  }
  
  if (element.brightness !== 100) {
    filters.push(`brightness(${element.brightness}%)`);
  }
  
  if (element.glow > 0) {
    filters.push(`drop-shadow(0 0 ${element.glow}px rgba(255, 255, 255, 0.8))`);
  }

  // Apply motion blur if present
  if (element.motionBlur && element.motionBlur.amount > 0) {
    const { amount, angle } = element.motionBlur;
    // Convert angle to X/Y blur
    const angleRad = (angle * Math.PI) / 180;
    const blurX = Math.cos(angleRad) * amount;
    const blurY = Math.sin(angleRad) * amount;
    filters.push(`blur(${Math.abs(blurX) + Math.abs(blurY)}px)`);
  }

  ctx.filter = filters.length > 0 ? filters.join(" ") : "none";
};

/**
 * Draw a single element layer
 */
const drawElementLayer = async (
  ctx: CanvasRenderingContext2D,
  element: Element
): Promise<void> => {
  const img = await loadImage(element.image);

  ctx.save();

  // Apply transform with proper scaling
  applyElementTransform(ctx, element, img);

  // Apply effects
  applyElementEffects(ctx, element);

  // Draw element at origin (transforms already applied)
  // Image is drawn at its original size, transforms handle scaling
  ctx.drawImage(
    img,
    -img.width / 2,
    -img.height / 2,
    img.width,
    img.height
  );

  ctx.restore();
};

/**
 * Compose a single frame with all its elements
 * Returns a Blob for efficient handling
 */
export const composeFrame = async (
  frame: Frame,
  width: number = 1920,
  height: number = 1080
): Promise<Blob> => {
  const { canvas, ctx } = createCompositionContext(width, height);

  try {
    // Layer 1: Draw base frame (background)
    await drawBaseLayer(ctx, frame, width, height);

    // Layer 2+: Draw each element
    for (const element of frame.elements) {
      try {
        await drawElementLayer(ctx, element);
      } catch (error) {
        console.error(`Failed to draw element ${element.id}:`, error);
        // Continue rendering other elements
      }
    }

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      }, "image/png");
    });
  } catch (error) {
    console.error("Frame composition error:", error);
    throw error;
  }
};

/**
 * Compose a single frame and return as data URL
 * Used for generating thumbnails
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
 * Compose multiple frames with progress callback
 * Used for video rendering pipeline
 */
export const composeFrames = async (
  frames: Frame[],
  width: number = 1920,
  height: number = 1080,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> => {
  const composedBlobs: Blob[] = [];

  for (let i = 0; i < frames.length; i++) {
    try {
      const blob = await composeFrame(frames[i], width, height);
      composedBlobs.push(blob);
      
      if (onProgress) {
        onProgress(i + 1, frames.length);
      }
    } catch (error) {
      console.error(`Failed to compose frame ${i}:`, error);
      throw error;
    }
  }

  return composedBlobs;
};

/**
 * Render a frame directly to an existing canvas
 * Used for real-time preview playback
 */
export const renderFrameToCanvas = async (
  frame: Frame,
  targetCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D
): Promise<void> => {
  const { width, height } = targetCanvas;

  try {
    // Draw base layer
    await drawBaseLayer(targetCtx, frame, width, height);

    // Draw element layers
    for (const element of frame.elements) {
      try {
        await drawElementLayer(targetCtx, element);
      } catch (error) {
        console.error(`Failed to render element ${element.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Frame render error:", error);
    throw error;
  }
};
