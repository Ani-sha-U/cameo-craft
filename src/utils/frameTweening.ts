import { Element } from '@/store/elementsStore';

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
 * Easing function for smooth motion (ease-in-out cubic)
 */
const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/**
 * Interpolate between two element states for smooth animation
 * Interpolates all transform properties: x, y, width, height, rotation, opacity, blur, brightness, glow
 */
export const tweenElement = (
  elementA: Element,
  elementB: Element,
  t: number // 0 to 1, where 0 is elementA and 1 is elementB
): Element => {
  const easedT = easeInOutCubic(t);

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
    blur: lerp(elementA.blur, elementB.blur, easedT),
    brightness: lerp(elementA.brightness, elementB.brightness, easedT),
    glow: lerp(elementA.glow, elementB.glow, easedT),
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
  t: number // 0 to 1, progress between frames
): Element[] => {
  const tweenedElements: Element[] = [];

  // Tween existing elements that have matches in next frame
  currentFrameElements.forEach((currentElement) => {
    const matchingElement = findMatchingElement(currentElement, nextFrameElements);
    
    if (matchingElement) {
      // Tween between current and next
      tweenedElements.push(tweenElement(currentElement, matchingElement, t));
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
