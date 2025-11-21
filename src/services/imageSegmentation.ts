import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

export interface SegmentedElement {
  id: string;
  label: string;
  image: string;
  score: number;
}

export interface SegmentationResult {
  elements: SegmentedElement[];
  maskedFrame: string; // Frame with all extracted elements removed (transparent)
}

export class ImageSegmentationService {
  private segmenter: ImageSegmenter | null = null;

  async initialize() {
    if (this.segmenter) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
        delegate: "GPU"
      },
      outputCategoryMask: true,
      outputConfidenceMasks: false
    });
  }

  async segmentImage(imageElement: HTMLImageElement): Promise<SegmentationResult> {
    await this.initialize();
    
    if (!this.segmenter) {
      throw new Error("Segmenter failed to initialize");
    }

    const result = this.segmenter.segment(imageElement);
    
    if (!result.categoryMask) {
      throw new Error("No segmentation mask generated");
    }

    return this.convertMaskToElements(result.categoryMask, imageElement);
  }

  private async convertMaskToElements(
    categoryMask: any,
    originalImage: HTMLImageElement
  ): Promise<SegmentationResult> {
    const width = categoryMask.width;
    const height = categoryMask.height;
    const maskData = categoryMask.getAsUint8Array();

    // Find unique categories (excluding background category 0)
    const categories = new Set<number>();
    for (let i = 0; i < maskData.length; i++) {
      if (maskData[i] > 0) {
        categories.add(maskData[i]);
      }
    }

    const elements: SegmentedElement[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return { elements: [], maskedFrame: originalImage.src };

    canvas.width = width;
    canvas.height = height;

    // Process each category ONCE to extract elements
    let elementIndex = 0;
    for (const category of categories) {
      if (elementIndex >= 10) break; // Limit to 10 elements

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw original image
      ctx.drawImage(originalImage, 0, 0, width, height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // Apply mask - make non-matching pixels transparent
      for (let i = 0; i < maskData.length; i++) {
        if (maskData[i] !== category) {
          pixels[i * 4 + 3] = 0; // Set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert to base64
      const base64 = canvas.toDataURL('image/png');

      // Create exactly ONE element per category
      elements.push({
        id: `segment_${category}_${Date.now()}_${elementIndex}`,
        label: `Element ${elementIndex + 1}`,
        image: base64,
        score: 0.9
      });

      elementIndex++;
    }

    // Create masked frame (original with all extracted elements removed)
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(originalImage, 0, 0, width, height);
    
    const maskedImageData = ctx.getImageData(0, 0, width, height);
    const maskedPixels = maskedImageData.data;
    
    // Make all segmented pixels transparent in the base frame
    for (let i = 0; i < maskData.length; i++) {
      if (maskData[i] > 0) {
        maskedPixels[i * 4 + 3] = 0; // Set alpha to 0 for all extracted elements
      }
    }
    
    ctx.putImageData(maskedImageData, 0, 0);
    const maskedFrame = canvas.toDataURL('image/png');

    return { elements, maskedFrame };
  }

  cleanup() {
    if (this.segmenter) {
      this.segmenter.close();
      this.segmenter = null;
    }
  }
}

// Helper function to load image from data URL
export const loadImageFromDataURL = (dataURL: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
};
