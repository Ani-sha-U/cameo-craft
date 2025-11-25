// interpolation.ts
import { Element } from "@/store/elementsStore";
import { easingFunctions } from "./easingUtils"; // Optional: reuse easing map if you have one

type EasingType =
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

const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

const lerpAngle = (startAngle: number, endAngle: number, t: number): number => {
  let diff = endAngle - startAngle;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return startAngle + diff * t;
};

// Minimal local easing map (or import if you have it)
const easingMap: Record<EasingType, (x: number) => number> = {
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

const applyEasing = (t: number, easingType: EasingType = "easeInOutCubic"): number =>
  (easingMap[easingType] || easingMap.easeInOutCubic)(t);

export const tweenElement = (
  elementA: Element,
  elementB: Element,
  t: number,
  enableMotionBlur: boolean = false,
): Element => {
  const easingType = (elementA as any).easing || "easeInOutCubic";
  const easedT = applyEasing(Math.max(0, Math.min(1, t)), easingType as EasingType);

  const deltaX = elementB.x - elementA.x;
  const deltaY = elementB.y - elementA.y;
  const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const motionBlurAmount = enableMotionBlur && velocity > 50 ? Math.min(velocity / 100, 10) : 0;

  return {
    ...elementA,
    x: lerp(elementA.x, elementB.x, easedT),
    y: lerp(elementA.y, elementB.y, easedT),
    width: lerp(elementA.width, elementB.width, easedT),
    height: lerp(elementA.height, elementB.height, easedT),
    rotation: lerpAngle(elementA.rotation, elementB.rotation, easedT),
    opacity: lerp(elementA.opacity, elementB.opacity, easedT),
    blur: lerp(elementA.blur || 0, elementB.blur || 0, easedT) + motionBlurAmount,
    brightness: lerp(elementA.brightness ?? 100, elementB.brightness ?? 100, easedT),
    glow: lerp(elementA.glow || 0, elementB.glow || 0, easedT),
    motionBlur:
      motionBlurAmount > 0
        ? {
            amount: motionBlurAmount,
            angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI),
          }
        : undefined,
  };
};

export const findMatchingElement = (element: Element, list: Element[]): Element | null => {
  const exact = list.find((e) => e.id === element.id);
  if (exact) return exact;
  const similar = list.find((e) => e.label === element.label && e.image === element.image);
  if (similar) return similar;
  return null;
};

/**
 * Ghost-aware tweening between two element lists.
 */
export const tweenFrameElements = (
  currentFrameElements: Element[],
  nextFrameElements: Element[],
  t: number,
  enableMotionBlur: boolean = true,
): Element[] => {
  const tweened: Element[] = [];
  const processed = new Set<string>();

  const isGhost = (el: Element) => {
    const nearZero = Math.abs(el.x) < 4 && Math.abs(el.y) < 4;
    const tiny = el.width <= 40 && el.height <= 40;
    return nearZero || tiny;
  };

  // Build quick lookup maps
  const nextById = new Map(nextFrameElements.map((e) => [e.id, e]));
  const nextByKey = new Map<string, Element[]>();
  for (const e of nextFrameElements) {
    const key = `${e.label}::${e.image}`;
    if (!nextByKey.has(key)) nextByKey.set(key, []);
    nextByKey.get(key)!.push(e);
  }

  // First pass: iterate current elements
  for (const cur of currentFrameElements) {
    // Exact id match
    const exact = nextById.get(cur.id);
    if (exact) {
      processed.add(exact.id);
      processed.add(cur.id);
      tweened.push(tweenElement(cur, exact, t, enableMotionBlur));
      continue;
    }

    // If current is ghost, try to find next candidate by key
    if (isGhost(cur)) {
      const key = `${cur.label}::${cur.image}`;
      const candidates = nextByKey.get(key) || [];
      const choice = candidates.find((c) => !processed.has(c.id));
      if (choice) {
        processed.add(choice.id);
        processed.add(cur.id);
        tweened.push(tweenElement(cur, choice, t, enableMotionBlur));
        continue;
      }
    }

    // Looser similarity
    const key = `${cur.label}::${cur.image}`;
    const sim = (nextByKey.get(key) || []).find((c) => !processed.has(c.id));
    if (sim) {
      processed.add(sim.id);
      processed.add(cur.id);
      tweened.push(tweenElement(cur, sim, t, enableMotionBlur));
      continue;
    }

    // No match: fade out current
    tweened.push({
      ...cur,
      opacity: lerp(cur.opacity, 0, t),
    });
  }

  // Second pass: handle next-only elements
  for (const nextEl of nextFrameElements) {
    if (processed.has(nextEl.id)) continue;

    // Try to find a leftover ghost in current
    const ghost = currentFrameElements.find(
      (e) => isGhost(e) && e.label === nextEl.label && e.image === nextEl.image && !processed.has(e.id),
    );
    if (ghost) {
      processed.add(ghost.id);
      processed.add(nextEl.id);
      tweened.push(tweenElement(ghost, nextEl, t, enableMotionBlur));
      continue;
    }

    // Treat as new: fade-in
    tweened.push({
      ...nextEl,
      opacity: nextEl.opacity * t,
    });
  }

  return tweened;
};
