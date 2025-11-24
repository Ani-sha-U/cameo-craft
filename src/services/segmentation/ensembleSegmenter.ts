import { ImageSegmenter, ImageSegmenterResult } from '@mediapipe/tasks-vision';
import * as ort from 'onnxruntime-web';

export interface SegmentedObject {
  id: string;
  label: string;
  mask: ImageData;
  bbox: { x: number; y: number; w: number; h: number };
  image: string; // base64 data URL
  score: number;
}

export interface EnsembleResult {
  objects: SegmentedObject[];
  maskedFrame: string;
}

export class EnsembleSegmenter {
  private mediaSegmenter: ImageSegmenter | null = null;
  private samSession: ort.InferenceSession | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize MediaPipe
      const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      this.mediaSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
          delegate: 'GPU'
        },
        outputCategoryMask: true,
        outputConfidenceMasks: false
      });

      // Try to use WebGPU for ONNX
      try {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
        // SAM model would be loaded here - for now we'll use MediaPipe only
        // In production, you'd load SAM ONNX model from a CDN
        console.log('ONNX Runtime initialized with WebAssembly backend');
      } catch (e) {
        console.warn('WebGPU not available, using WebAssembly:', e);
      }

      this.isInitialized = true;
      console.log('Ensemble segmenter initialized');
    } catch (error) {
      console.error('Failed to initialize ensemble segmenter:', error);
      throw error;
    }
  }

  async segment(imageElement: HTMLImageElement): Promise<EnsembleResult> {
    if (!this.isInitialized || !this.mediaSegmenter) {
      await this.initialize();
    }

    if (!this.mediaSegmenter) {
      throw new Error('MediaPipe segmenter not initialized');
    }

    // Step 1: Get MediaPipe segmentation
    const result = this.mediaSegmenter.segment(imageElement);
    
    // Step 2: Extract objects from category mask
    const objects = await this.extractObjects(imageElement, result);

    // Step 3: Create masked frame
    const maskedFrame = await this.createMaskedFrame(imageElement, result);

    return { objects, maskedFrame };
  }

  private async extractObjects(
    imageElement: HTMLImageElement,
    result: ImageSegmenterResult
  ): Promise<SegmentedObject[]> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const categoryMask = result.categoryMask;

    if (!categoryMask) {
      return [];
    }

    // Group pixels by category
    const categoryMap = new Map<number, { pixels: number[]; minX: number; minY: number; maxX: number; maxY: number }>();
    
    for (let i = 0; i < categoryMask.width * categoryMask.height; i++) {
      const category = categoryMask.getAsFloat32Array()[i];
      
      // Skip background (category 0)
      if (category === 0) continue;

      const x = i % categoryMask.width;
      const y = Math.floor(i / categoryMask.width);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          pixels: [],
          minX: x,
          minY: y,
          maxX: x,
          maxY: y
        });
      }

      const catData = categoryMap.get(category)!;
      catData.pixels.push(i);
      catData.minX = Math.min(catData.minX, x);
      catData.minY = Math.min(catData.minY, y);
      catData.maxX = Math.max(catData.maxX, x);
      catData.maxY = Math.max(catData.maxY, y);
    }

    const objects: SegmentedObject[] = [];
    let objectIndex = 0;

    // Extract each object
    for (const [category, data] of categoryMap.entries()) {
      const { pixels, minX, minY, maxX, maxY } = data;
      
      // Skip if too small
      if (pixels.length < 100) continue;

      const bbox = {
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1
      };

      // Create cropped canvas with transparency
      const objCanvas = document.createElement('canvas');
      objCanvas.width = bbox.w;
      objCanvas.height = bbox.h;
      const objCtx = objCanvas.getContext('2d');
      if (!objCtx) continue;

      const objImageData = objCtx.createImageData(bbox.w, bbox.h);

      // Copy pixels with mask applied
      for (const pixelIdx of pixels) {
        const x = pixelIdx % categoryMask.width;
        const y = Math.floor(pixelIdx / categoryMask.width);
        
        const srcIdx = (y * imageData.width + x) * 4;
        const dstX = x - minX;
        const dstY = y - minY;
        const dstIdx = (dstY * bbox.w + dstX) * 4;

        objImageData.data[dstIdx] = imageData.data[srcIdx];
        objImageData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
        objImageData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        objImageData.data[dstIdx + 3] = 255; // Full opacity for masked pixels
      }

      objCtx.putImageData(objImageData, 0, 0);

      // Create mask ImageData
      const maskData = objCtx.createImageData(bbox.w, bbox.h);
      for (const pixelIdx of pixels) {
        const x = pixelIdx % categoryMask.width;
        const y = Math.floor(pixelIdx / categoryMask.width);
        const dstX = x - minX;
        const dstY = y - minY;
        const dstIdx = (dstY * bbox.w + dstX) * 4;
        maskData.data[dstIdx + 3] = 255; // Alpha channel
      }

      objects.push({
        id: `obj_${objectIndex}_${category}`,
        label: this.getCategoryLabel(category),
        mask: maskData,
        bbox,
        image: objCanvas.toDataURL('image/png'),
        score: pixels.length / (bbox.w * bbox.h) // Coverage ratio
      });

      objectIndex++;
    }

    return objects;
  }

  private async createMaskedFrame(
    imageElement: HTMLImageElement,
    result: ImageSegmenterResult
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const categoryMask = result.categoryMask;

    if (categoryMask) {
      // Make all non-background pixels transparent
      for (let i = 0; i < categoryMask.width * categoryMask.height; i++) {
        const category = categoryMask.getAsFloat32Array()[i];
        if (category !== 0) {
          imageData.data[i * 4 + 3] = 0; // Make transparent
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL('image/png');
  }

  private getCategoryLabel(category: number): string {
    const labels: Record<number, string> = {
      1: 'Background',
      2: 'Aeroplane',
      3: 'Bicycle',
      4: 'Bird',
      5: 'Boat',
      6: 'Bottle',
      7: 'Bus',
      8: 'Car',
      9: 'Cat',
      10: 'Chair',
      11: 'Cow',
      12: 'Table',
      13: 'Dog',
      14: 'Horse',
      15: 'Motorbike',
      16: 'Person',
      17: 'Plant',
      18: 'Sheep',
      19: 'Sofa',
      20: 'Train',
      21: 'Monitor'
    };
    return labels[category] || `Object ${category}`;
  }

  cleanup() {
    if (this.mediaSegmenter) {
      this.mediaSegmenter.close();
      this.mediaSegmenter = null;
    }
    this.samSession = null;
    this.isInitialized = false;
  }
}

export async function loadImageFromDataURL(dataURL: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}
