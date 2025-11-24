/**
 * Simple Object Tracker using IoU-based tracking
 * Implements a lightweight SORT-like algorithm
 */

export interface Detection {
  bbox: { x: number; y: number; w: number; h: number };
  score: number;
  label: string;
}

export interface TrackedObject {
  id: string;
  bbox: { x: number; y: number; w: number; h: number };
  label: string;
  frameIndex: number;
  age: number;
  hits: number;
}

export interface TrackingResult {
  elementId: string;
  positions: Map<number, { x: number; y: number; width: number; height: number }>;
}

export class ObjectTracker {
  private tracks: Map<string, TrackedObject> = new Map();
  private nextId = 0;
  private maxAge = 3; // Max frames to keep track without detection
  private minHits = 1; // Min detections before track is confirmed
  private iouThreshold = 0.3; // IoU threshold for matching

  /**
   * Track objects across frames
   */
  track(detections: Detection[], frameIndex: number): TrackedObject[] {
    // Predict next positions (in a more advanced tracker, use Kalman filter)
    const predictedTracks = Array.from(this.tracks.values());

    // Match detections to existing tracks using IoU
    const matches = this.matchDetectionsToTracks(detections, predictedTracks);

    // Update matched tracks
    for (const [detIdx, trackId] of matches.entries()) {
      const track = this.tracks.get(trackId);
      if (track) {
        track.bbox = detections[detIdx].bbox;
        track.label = detections[detIdx].label;
        track.frameIndex = frameIndex;
        track.hits += 1;
        track.age = 0;
      }
    }

    // Create new tracks for unmatched detections
    const matchedDetectionIndices = new Set(matches.keys());
    for (let i = 0; i < detections.length; i++) {
      if (!matchedDetectionIndices.has(i)) {
        const trackId = `track_${this.nextId++}`;
        this.tracks.set(trackId, {
          id: trackId,
          bbox: detections[i].bbox,
          label: detections[i].label,
          frameIndex,
          age: 0,
          hits: 1
        });
      }
    }

    // Age unmatched tracks
    const matchedTrackIds = new Set(matches.values());
    for (const [trackId, track] of this.tracks.entries()) {
      if (!matchedTrackIds.has(trackId)) {
        track.age += 1;
        if (track.age > this.maxAge) {
          this.tracks.delete(trackId);
        }
      }
    }

    // Return confirmed tracks
    return Array.from(this.tracks.values()).filter(
      track => track.hits >= this.minHits
    );
  }

  /**
   * Match detections to tracks using IoU
   */
  private matchDetectionsToTracks(
    detections: Detection[],
    tracks: TrackedObject[]
  ): Map<number, string> {
    const matches = new Map<number, string>();

    if (detections.length === 0 || tracks.length === 0) {
      return matches;
    }

    // Compute IoU matrix
    const iouMatrix: number[][] = [];
    for (let i = 0; i < detections.length; i++) {
      iouMatrix[i] = [];
      for (let j = 0; j < tracks.length; j++) {
        iouMatrix[i][j] = this.computeIoU(detections[i].bbox, tracks[j].bbox);
      }
    }

    // Greedy matching: find best matches above threshold
    const usedDetections = new Set<number>();
    const usedTracks = new Set<number>();

    while (true) {
      let maxIoU = this.iouThreshold;
      let bestDetIdx = -1;
      let bestTrackIdx = -1;

      // Find best unmatched pair
      for (let i = 0; i < detections.length; i++) {
        if (usedDetections.has(i)) continue;
        for (let j = 0; j < tracks.length; j++) {
          if (usedTracks.has(j)) continue;
          if (iouMatrix[i][j] > maxIoU) {
            maxIoU = iouMatrix[i][j];
            bestDetIdx = i;
            bestTrackIdx = j;
          }
        }
      }

      if (bestDetIdx === -1) break;

      matches.set(bestDetIdx, tracks[bestTrackIdx].id);
      usedDetections.add(bestDetIdx);
      usedTracks.add(bestTrackIdx);
    }

    return matches;
  }

  /**
   * Compute Intersection over Union (IoU) between two bounding boxes
   */
  private computeIoU(
    bbox1: { x: number; y: number; w: number; h: number },
    bbox2: { x: number; y: number; w: number; h: number }
  ): number {
    const x1 = Math.max(bbox1.x, bbox2.x);
    const y1 = Math.max(bbox1.y, bbox2.y);
    const x2 = Math.min(bbox1.x + bbox1.w, bbox2.x + bbox2.w);
    const y2 = Math.min(bbox1.y + bbox1.h, bbox2.y + bbox2.h);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const bbox1Area = bbox1.w * bbox1.h;
    const bbox2Area = bbox2.w * bbox2.h;
    const unionArea = bbox1Area + bbox2Area - intersectionArea;

    return unionArea > 0 ? intersectionArea / unionArea : 0;
  }

  /**
   * Track a single element across all frames
   */
  async trackAcrossFrames(
    elementBbox: { x: number; y: number; w: number; h: number },
    elementLabel: string,
    frames: { image: string }[],
    startFrameIndex: number
  ): Promise<Map<number, { x: number; y: number; width: number; height: number }>> {
    const positions = new Map<number, { x: number; y: number; width: number; height: number }>();
    
    // Set initial position
    positions.set(startFrameIndex, {
      x: elementBbox.x,
      y: elementBbox.y,
      width: elementBbox.w,
      height: elementBbox.h
    });

    let currentBbox = { ...elementBbox };

    // Simple tracking: assume small motion between frames
    for (let i = startFrameIndex + 1; i < frames.length; i++) {
      // In a real implementation, you'd detect the object in each frame
      // For now, we'll use a simple motion model (no movement)
      // In production, integrate with MediaPipe Object Detection or optical flow
      
      positions.set(i, {
        x: currentBbox.x,
        y: currentBbox.y,
        width: currentBbox.w,
        height: currentBbox.h
      });
    }

    return positions;
  }

  reset() {
    this.tracks.clear();
    this.nextId = 0;
  }
}
