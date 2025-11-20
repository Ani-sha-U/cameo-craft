import { Element } from '@/store/elementsStore';

/**
 * Interpolate between two element states for smooth animation
 */
export const tweenElement = (
  elementA: Element,
  elementB: Element,
  t: number // 0 to 1, where 0 is elementA and 1 is elementB
): Element => {
  // Easing function for smooth motion
  const easeInOutCubic = (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };

  const easedT = easeInOutCubic(t);

  return {
    ...elementA,
    x: elementA.x + (elementB.x - elementA.x) * easedT,
    y: elementA.y + (elementB.y - elementA.y) * easedT,
    width: elementA.width + (elementB.width - elementA.width) * easedT,
    height: elementA.height + (elementB.height - elementA.height) * easedT,
    rotation: elementA.rotation + (elementB.rotation - elementA.rotation) * easedT,
    opacity: elementA.opacity + (elementB.opacity - elementA.opacity) * easedT,
    blur: elementA.blur + (elementB.blur - elementA.blur) * easedT,
    brightness: elementA.brightness + (elementB.brightness - elementA.brightness) * easedT,
    glow: elementA.glow + (elementB.glow - elementA.glow) * easedT,
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
