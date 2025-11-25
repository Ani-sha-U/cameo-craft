// src/utils/frameTweening.ts

import { Element } from "@/store/elementsStore";
import { Frame } from "@/store/framesStore";

// ───────────────────────────────────────────────
// EASING UTILITIES
// ───────────────────────────────────────────────

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic"
  | "easeInQuart"
  | "easeOutQuart"
  | "easeInOutQuart";

const easingFunctions: Record<EasingType, (x: number) => number> = {
  linear: (x) => x,
  easeIn: (x) => x * x,
  easeOut: (x) => 1 - (1 - x) * (1 - x),
  easeInOut: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  easeInCubic: (x) => x * x * x,
  easeOutCubic: (x) => 1 - Math.pow(1 - x, 3),
  easeInOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  easeInQuart: (x) => x * x * x * x,
  easeOutQuart: (x) => 1 - Math.pow(1 - x, 4),
  easeInOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
};

const applyEasing = (t: number, type: EasingType = "easeInOutCubic"): number =>
  easingFunctions[type](Math.max(0, Math.min(1, t)));

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const lerpAngle = (start: number, end: number, t: number): number => {
  let diff = end - start;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return start + diff * t;
};

// ───────────────────────────────────────────────
// ELEMENT TWEENING (POSITION, SCALE, ROTATION, OPACITY)
// ───────────────────────────────────────────────

export const tweenElement = (a: Element, b: Element, t: number): Element => {
  const e = applyEasing(t, a.easing || "easeInOutCubic");

  return {
    ...a,
    x: lerp(a.x, b.x, e),
    y: lerp(a.y, b.y, e),
    width: lerp(a.width, b.width, e),
    height: lerp(a.height, b.height, e),
    rotation: lerpAngle(a.rotation, b.rotation, e),
    opacity: lerp(a.opacity, b.opacity, e),
    blur: lerp(a.blur || 0, b.blur || 0, e),
    brightness: lerp(a.brightness ?? 100, b.brightness ?? 100, e),
    glow: lerp(a.glow || 0, b.glow || 0, e),
  };
};

// Find matching element between frames
export const findMatchingElement = (a: Element, list: Element[]): Element | null => {
  const match1 = list.find((e) => e.id === a.id);
  if (match1) return match1;

  const match2 = list.find((e) => e.label === a.label && e.image === a.image);
  if (match2) return match2;

  const ghostNearZero = (e: Element) => Math.abs(e.x) < 4 && Math.abs(e.y) < 4;

  if (ghostNearZero(a)) {
    const match3 = list.find((e) => e.label === a.label);
    if (match3) return match3;
  }

  return null;
};

// Tween between element arrays
export const tweenFrameElements = (curElements: Element[], nextElements: Element[], t: number): Element[] => {
  const out: Element[] = [];
  const processed = new Set<string>();

  curElements.forEach((cur) => {
    const match = findMatchingElement(cur, nextElements);
    if (match) {
      processed.add(match.id);
      out.push(tweenElement(cur, match, t));
    } else {
      out.push({
        ...cur,
        opacity: lerp(cur.opacity, 0, t),
      });
    }
  });

  nextElements.forEach((n) => {
    if (!processed.has(n.id)) {
      out.push({
        ...n,
        opacity: lerp(0, n.opacity, t),
      });
    }
  });

  return out;
};

// ───────────────────────────────────────────────
// OPTION B — CREATE 15 TWEEN FRAMES TO INSERT
// ───────────────────────────────────────────────

export const generateTweenFrames = (frameA: Frame, frameB: Frame, count: number = 15): Frame[] => {
  const tweenFrames: Frame[] = [];

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);

    const tweenedElements = tweenFrameElements(frameA.elements, frameB.elements, t);

    tweenFrames.push({
      id: `tween_${frameA.id}_${i}_${Date.now()}`,
      thumbnail: frameA.thumbnail, // won't matter for timeline preview
      timestamp: frameA.timestamp + t * (frameB.timestamp - frameA.timestamp),
      elements: tweenedElements,
      baseFrame: frameA.baseFrame, // masked base frame from MediaPipe
      canvasState: frameA.canvasState,
    } as Frame);
  }

  return tweenFrames;
};

// ───────────────────────────────────────────────
// MEDIAPIPE SEGMENTATION + ELEMENT EXTRACTION HELPER
// ───────────────────────────────────────────────

// MediaPipe imports (installed via npm @mediapipe/tasks-vision)
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Convert a mask + original frame into:
 * 1. baseFrame (background only)
 * 2. element cutouts (image/png)
 */
export async function runMediaPipeSegmentation(frame: Frame): Promise<{
  baseFrame: string;
  elements: { label: string; image: string; x: number; y: number }[];
}> {
  // Load MediaPipe
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");

  const segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
      delegate: "GPU",
    },
    outputCategoryMask: true,
  });

  // Convert thumbnail image to ImageBitmap
  const image = await createImageBitmap(await (await fetch(frame.thumbnail)).blob());

  // Run segmentation
  const result = segmenter.segment(image);

  // The category mask (1 = person/subject, 0 = background)
  const mask = result.categoryMask?.getAsUint8Array();

  const width = image.width;
  const height = image.height;

  const off = new OffscreenCanvas(width, height);
  const octx = off.getContext("2d")!;

  // Draw original full image
  octx.drawImage(image, 0, 0);

  // Get pixel array
  const imgData = octx.getImageData(0, 0, width, height);
  const d = imgData.data;

  // baseFrame = background only (subject removed)
  const basePixels = new Uint8ClampedArray(d);
  // element cutout
  const subjectPixels = new Uint8ClampedArray(d);

  for (let i = 0; i < d.length; i += 4) {
    const m = mask ? mask[i / 4] : 0;

    if (m === 1) {
      // Background version should hide subject
      basePixels[i + 3] = 0;
    } else {
      // Subject version should hide background
      subjectPixels[i + 3] = 0;
    }
  }

  // Export base
  const baseCanvas = new OffscreenCanvas(width, height);
  baseCanvas.getContext("2d")!.putImageData(new ImageData(basePixels, width, height), 0, 0);
  const baseFrameDataUrl = baseCanvas.convertToBlob({ type: "image/png" }).then(blobToDataURL);

  // Export subject as single cutout element
  const subjectCanvas = new OffscreenCanvas(width, height);
  subjectCanvas.getContext("2d")!.putImageData(new ImageData(subjectPixels, width, height), 0, 0);
  const subjectDataUrl = subjectCanvas.convertToBlob({ type: "image/png" }).then(blobToDataURL);

  return {
    baseFrame: await baseFrameDataUrl,
    elements: [
      {
        label: "subject",
        image: await subjectDataUrl,
        x: width * 0.25,
        y: height * 0.25,
      },
    ],
  };
}

async function blobToDataURL(blob: Blob | null): Promise<string> {
  if (!blob) return "";
  return await new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}
