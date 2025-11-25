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
  easeInOut: (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),

  easeInCubic: (x: number) => x * x * x,
  easeOutCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  easeInOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),

  easeInQuart: (x: number) => x * x * x * x,
  easeOutQuart: (x: number) => 1 - Math.pow(1 - x, 4),
  easeInOutQuart: (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
};

/**
 * Apply easing function to interpolation value
 */
const applyEasing = (t: number, easingType: EasingType = "easeInOutCubic"): number => {
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
  enableMotionBlur: boolean = false,
): Element => {
  // Use element's easing type or default to easeInOutCubic
  const easingType = elementA.easing || "easeInOutCubic";
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
 * Find matching element in next frame by ID or similarity
 */
export const findMatchingElement = (element: Element, nextFrameElements: Element[]): Element | null => {
  // Try exact ID match first (for copied elements)
  const exactMatch = nextFrameElements.find((e) => e.id === element.id);
  if (exactMatch) return exactMatch;

  // Try matching by label and image (for similar elements)
  const similarMatch = nextFrameElements.find((e) => e.label === element.label && e.image === element.image);
  if (similarMatch) return similarMatch;

  return null;
};

/**
 * Calculate tweened elements between two frames
 * INTERPOLATES ALL TRANSFORM PROPERTIES: x, y, width, height, rotation, opacity
 */
/**
 * Calculate tweened elements between two frames
 * INTERPOLATES ALL TRANSFORM PROPERTIES: x, y, width, height, rotation, opacity
 *
 * Special behavior:
 *  - If a "ghost" element exists at (near) 0,0 in currentFrameElements and a matching element
 *    exists in nextFrameElements, treat the ghost as the source for tweening into the match.
 */
export const tweenFrameElements = (
  currentFrameElements: Element[],
  nextFrameElements: Element[],
  t: number, // 0 to 1, progress between frames
  enableMotionBlur: boolean = true,
): Element[] => {
  const tweenedElements: Element[] = [];
  const processedIds = new Set<string>();

  // Helper: detect ghost at or near (0,0)
  const isGhost = (el: Element) => {
    // treat very small or exact 0,0 as ghost; tweak threshold if needed
    const nearZeroPos = Math.abs(el.x) < 4 && Math.abs(el.y) < 4;
    const defaultSize = el.width <= 40 && el.height <= 40 ? true : false;
    return nearZeroPos || defaultSize;
  };

  // Build lookup maps for faster matching
  const nextById = new Map(nextFrameElements.map((e) => [e.id, e]));
  const nextByImageLabel = new Map<string, Element[]>();
  for (const e of nextFrameElements) {
    const key = `${e.label}::${e.image}`;
    if (!nextByImageLabel.has(key)) nextByImageLabel.set(key, []);
    nextByImageLabel.get(key)!.push(e);
  }

  // First pass: match elements with same id OR with ghost->target pairing
  currentFrameElements.forEach((currentElement) => {
    // try exact ID match
    const exactMatch = nextById.get(currentElement.id);
    if (exactMatch) {
      processedIds.add(exactMatch.id);
      processedIds.add(currentElement.id);
      tweenedElements.push(tweenElement(currentElement, exactMatch, t, enableMotionBlur));
      return;
    }

    // If current is a ghost (at 0,0 or tiny), try to find a visually matching element in next frame
    if (isGhost(currentElement)) {
      const key = `${currentElement.label}::${currentElement.image}`;
      const candidates = nextByImageLabel.get(key) || [];

      // choose best candidate (prefer unprocessed and non-ghost)
      let chosen: Element | null = null;
      for (const cand of candidates) {
        if (!processedIds.has(cand.id)) {
          chosen = cand;
          break;
        }
      }

      if (chosen) {
        processedIds.add(chosen.id);
        processedIds.add(currentElement.id);
        // tween FROM the ghost -> TO the chosen element
        tweenedElements.push(tweenElement(currentElement, chosen, t, enableMotionBlur));
        return;
      }
    }

    // Otherwise try looser similarity (same label AND similar image)
    const similarKey = `${currentElement.label}::${currentElement.image}`;
    const similarCandidates = nextByImageLabel.get(similarKey) || [];
    if (similarCandidates.length > 0) {
      const cand = similarCandidates.find((c) => !processedIds.has(c.id));
      if (cand) {
        processedIds.add(cand.id);
        processedIds.add(currentElement.id);
        tweenedElements.push(tweenElement(currentElement, cand, t, enableMotionBlur));
        return;
      }
    }

    // If no match found: element disappears (tween to 0 opacity)
    tweenedElements.push({
      ...currentElement,
      opacity: lerp(currentElement.opacity, 0, t),
    });
  });

  // Second pass: process new elements that only exist in next frame
  nextFrameElements.forEach((nextElement) => {
    if (processedIds.has(nextElement.id)) return;

    // New element that didn't exist in current frame
    // Try to find a ghost in the current frame that we didn't match earlier
    const possibleGhost = currentFrameElements.find(
      (e) => isGhost(e) && !processedIds.has(e.id) && e.label === nextElement.label && e.image === nextElement.image,
    );
    if (possibleGhost) {
      // link ghost -> nextElement
      processedIds.add(possibleGhost.id);
      processedIds.add(nextElement.id);
      tweenedElements.push(tweenElement(possibleGhost, nextElement, t, enableMotionBlur));
      return;
    }

    // Otherwise treat it as a genuine newcomer: fade-in from opacity 0
    tweenedElements.push({
      ...nextElement,
      opacity: nextElement.opacity * t,
    });
  });

  return tweenedElements;
};
