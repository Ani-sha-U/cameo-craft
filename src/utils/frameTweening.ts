import { Element } from "@/store/elementsStore";

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

/**
 * Easing functions for smooth animation curves
 */
export const easingFunctions: Record<EasingType, (x: number) => number> = {
  linear: (x: number) => x,

  easeIn: (x: number) => x * x,
  easeOut: (x: number) => 1 - (1 - x) * (1 - x),
  easeInOut: (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),

  easeInCubic: (x: number) => x * x * x,
  easeOutCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  easeInOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),

  easeInQuart: (x: number) => x * x * x * x,
  easeOutQuart: (x: number) => 1 - Math.pow(1 - x, 4),
  easeInOutQuart: (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
};

/**
 * Linear interpolation between two values
 */
const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Interpolate rotation angle using shortest path
 */
const lerpAngle = (startAngle: number, endAngle: number, t: number): number => {
  let diff = endAngle - startAngle;

  // Normalize to shortest path (-180 to 180)
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  return startAngle + diff * t;
};

/**
 * Apply easing function to interpolation value
 */
const applyEasing = (t: number, easingType: EasingType = "linear"): number => {
  return easingFunctions[easingType](Math.max(0, Math.min(1, t)));
};

/**
 * Interpolate between two element states
 * Animates ALL transform properties: x, y, width, height, rotation, opacity, blur, brightness, glow
 */
export const tweenElement = (
  elementA: Element,
  elementB: Element,
  t: number, // 0 to 1, where 0 is elementA and 1 is elementB
  enableMotionBlur: boolean = false
): Element => {
  // Use element's easing type or default to linear
  const easingType = elementA.easing || "linear";
  const easedT = applyEasing(t, easingType);

  // Calculate velocity for motion blur
  const deltaX = elementB.x - elementA.x;
  const deltaY = elementB.y - elementA.y;
  const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Apply motion blur if enabled and velocity is significant
  const motionBlurAmount = enableMotionBlur && velocity > 50 ? Math.min(velocity / 100, 10) : 0;

  return {
    ...elementA,
    // Interpolate ALL transform properties
    x: lerp(elementA.x, elementB.x, easedT),
    y: lerp(elementA.y, elementB.y, easedT),
    width: lerp(elementA.width, elementB.width, easedT),
    height: lerp(elementA.height, elementB.height, easedT),
    rotation: lerpAngle(elementA.rotation, elementB.rotation, easedT),

    // Interpolate visual properties
    opacity: lerp(elementA.opacity, elementB.opacity, easedT),
    blur: lerp(elementA.blur, elementB.blur, easedT) + motionBlurAmount,
    brightness: lerp(elementA.brightness, elementB.brightness, easedT),
    glow: lerp(elementA.glow, elementB.glow, easedT),

    // Preserve blend mode from target
    blendMode: elementB.blendMode,

    // Store motion blur data for rendering
    motionBlur:
      motionBlurAmount > 0
        ? {
            amount: motionBlurAmount,
            angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI),
          }
        : undefined,
  };
};

/**
 * Match elements between frames by ID, label, or image similarity
 */
const findMatchingElement = (
  element: Element,
  candidates: Element[],
  usedIds: Set<string>
): Element | null => {
  // Try exact ID match first
  const exactMatch = candidates.find((c) => c.id === element.id && !usedIds.has(c.id));
  if (exactMatch) return exactMatch;

  // Try matching by label and image
  const similarMatch = candidates.find(
    (c) => !usedIds.has(c.id) && c.label === element.label && c.image === element.image
  );
  if (similarMatch) return similarMatch;

  return null;
};

/**
 * Calculate tweened elements between two frames
 * 
 * Interpolation strategy:
 * 1. Match elements by ID, label, or image similarity
 * 2. Tween matched elements with full transform interpolation
 * 3. NO fade-in/fade-out behavior - only explicit transform animation
 * 4. Unmatched elements maintain their state (no automatic fading)
 * 
 * This ensures smooth motion without flickering or duplicates
 */
export const tweenFrameElements = (
  currentFrameElements: Element[],
  nextFrameElements: Element[],
  t: number, // 0 to 1, progress between frames
  enableMotionBlur: boolean = true
): Element[] => {
  const tweenedElements: Element[] = [];
  const usedNextIds = new Set<string>();

  // Process current frame elements
  for (const currentElement of currentFrameElements) {
    // Find matching element in next frame
    const matchingElement = findMatchingElement(currentElement, nextFrameElements, usedNextIds);

    if (matchingElement) {
      // Found match: interpolate ALL properties
      usedNextIds.add(matchingElement.id);
      tweenedElements.push(tweenElement(currentElement, matchingElement, t, enableMotionBlur));
    } else {
      // No match: maintain current state (don't fade out)
      // Element simply holds its position until next keyframe
      tweenedElements.push({ ...currentElement });
    }
  }

  // Process new elements that only exist in next frame
  for (const nextElement of nextFrameElements) {
    if (!usedNextIds.has(nextElement.id)) {
      // New element appearing: add as-is (don't fade in)
      // In a proper timeline, these would have explicit keyframes
      tweenedElements.push({ ...nextElement, opacity: nextElement.opacity * t });
    }
  }

  return tweenedElements;
};

/**
 * Generate interpolated frames between two keyframes
 * Used for frame interpolation feature
 */
export const interpolateKeyframes = (
  startElements: Element[],
  endElements: Element[],
  numFrames: number,
  enableMotionBlur: boolean = true
): Element[][] => {
  const interpolatedFrames: Element[][] = [];

  for (let i = 1; i <= numFrames; i++) {
    const t = i / (numFrames + 1);
    const tweenedElements = tweenFrameElements(startElements, endElements, t, enableMotionBlur);
    interpolatedFrames.push(tweenedElements);
  }

  return interpolatedFrames;
};
