import { Element } from '@/store/elementsStore';

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart';

/**
 * Linear interpolation between two values
 */
const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Interpolate rotation angle, taking shortest path
 */
const lerpAngle = (startAngle: number, endAngle: number, t: number): number => {
  let diff = endAngle - startAngle;
  
  // Normalize to shortest path
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  return startAngle + diff * t;
};

/**
 * Easing functions for animation curves
 */
export const easingFunctions: Record<EasingType, (x: number) => number> = {
  linear: (x: number) => x,
  
  easeIn: (x: number) => x * x,
  easeOut: (x: number) => 1 - (1 - x) * (1 - x),
  easeInOut: (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
  
  easeInCubic: (x: number) => x * x * x,
  easeOutCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  easeInOutCubic: (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  
  easeInQuart: (x: number) => x * x * x * x,
  easeOutQuart: (x: number) => 1 - Math.pow(1 - x, 4),
  easeInOutQuart: (x: number) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2,
};

/**
 * Apply easing function to interpolation value
 */
const applyEasing = (t: number, easingType: EasingType = 'easeInOutCubic'): number => {
  return easingFunctions[easingType](t);
};

/**
 * Interpolate between two element states for smooth animation
 * Interpolates all transform properties: x, y, width, height, rotation, opacity, blur, brightness, glow
 */
export const tweenElement = (
  elementA: Element,
  elementB: Element,
  t: number, // 0 to 1, where 0 is elementA and 1 is elementB
  enableMotionBlur: boolean = false
): Element => {
  // Use element's easing type or default to easeInOutCubic
  const easingType = elementA.easing || 'easeInOutCubic';
  const easedT = applyEasing(t, easingType);

  // Calculate velocity for motion blur
  const deltaX = elementB.x - elementA.x;
  const deltaY = elementB.y - elementA.y;
  const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Apply motion blur if enabled and velocity is significant
  const motionBlurAmount = enableMotionBlur && velocity > 50 ? Math.min(velocity / 100, 10) : 0;

  return {
    ...elementA,
    // Position interpolation
    x: lerp(elementA.x, elementB.x, easedT),
    y: lerp(elementA.y, elementB.y, easedT),
    
    // Scale interpolation (width/height serve as scaleX/scaleY)
    width: lerp(elementA.width, elementB.width, easedT),
    height: lerp(elementA.height, elementB.height, easedT),
    
    // Rotation with angle wrapping for shortest path
    rotation: lerpAngle(elementA.rotation, elementB.rotation, easedT),
    
    // Visual property interpolation
    opacity: lerp(elementA.opacity, elementB.opacity, easedT),
    blur: lerp(elementA.blur, elementB.blur, easedT) + motionBlurAmount,
    brightness: lerp(elementA.brightness, elementB.brightness, easedT),
    glow: lerp(elementA.glow, elementB.glow, easedT),
    
    // Store motion blur data for rendering
    motionBlur: motionBlurAmount > 0 ? {
      amount: motionBlurAmount,
      angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    } : undefined,
  };
};

/**
 * Find matching element in next frame by ID or similarity
 */
export const findMatchingElement = (
  element: Element,
  nextFrameElements: Element[]
): Element | null => {
  // Try exact ID match first (for copied elements)
  const exactMatch = nextFrameElements.find((e) => e.id === element.id);
  if (exactMatch) return exactMatch;

  // Try matching by label and image (for similar elements)
  const similarMatch = nextFrameElements.find(
    (e) => e.label === element.label && e.image === element.image
  );
  if (similarMatch) return similarMatch;

  return null;
};

/**
 * Calculate tweened elements between two frames
 */
export const tweenFrameElements = (
  currentFrameElements: Element[],
  nextFrameElements: Element[],
  t: number, // 0 to 1, progress between frames
  enableMotionBlur: boolean = true
): Element[] => {
  const tweenedElements: Element[] = [];

  // Tween existing elements that have matches in next frame
  currentFrameElements.forEach((currentElement) => {
    const matchingElement = findMatchingElement(currentElement, nextFrameElements);
    
    if (matchingElement) {
      // Tween between current and next with motion blur
      tweenedElements.push(tweenElement(currentElement, matchingElement, t, enableMotionBlur));
    } else {
      // Fade out element that doesn't exist in next frame
      tweenedElements.push({
        ...currentElement,
        opacity: currentElement.opacity * (1 - t),
      });
    }
  });

  // Fade in new elements that only exist in next frame
  nextFrameElements.forEach((nextElement) => {
    const existsInCurrent = findMatchingElement(nextElement, currentFrameElements);
    
    if (!existsInCurrent) {
      tweenedElements.push({
        ...nextElement,
        opacity: nextElement.opacity * t,
      });
    }
  });

  return tweenedElements;
};
