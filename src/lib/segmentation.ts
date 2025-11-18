import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return { width, height };
}

export interface SegmentationResult {
  person: Blob;
  background: Blob;
  objects: Blob;
  originalWidth: number;
  originalHeight: number;
}

export const segmentImage = async (
  imageElement: HTMLImageElement,
  featherAmount: number = 0
): Promise<SegmentationResult> => {
  console.log('Starting segmentation process...');
  
  const segmenter = await pipeline(
    'image-segmentation',
    'Xenova/segformer-b0-finetuned-ade-512-512',
    { device: 'webgpu' }
  );
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  const { width, height } = resizeImageIfNeeded(canvas, ctx, imageElement);
  console.log(`Image dimensions: ${width}x${height}`);
  
  const imageData = canvas.toDataURL('image/jpeg', 0.8);
  console.log('Processing with segmentation model...');
  
  const result = await segmenter(imageData);
  console.log('Segmentation result:', result);
  
  if (!result || !Array.isArray(result) || result.length === 0) {
    throw new Error('Invalid segmentation result');
  }

  // Apply feathering to mask
  const applyFeather = (maskData: Uint8Array | Uint8ClampedArray): Float32Array => {
    const normalized = new Float32Array(maskData.length);
    for (let i = 0; i < maskData.length; i++) {
      normalized[i] = maskData[i] / 255;
    }
    
    if (featherAmount === 0) return normalized;
    
    const feathered = new Float32Array(normalized.length);
    const radius = Math.max(1, Math.floor(featherAmount * 10));
    
    for (let i = 0; i < normalized.length; i++) {
      let sum = 0;
      let count = 0;
      
      const y = Math.floor(i / width);
      const x = i % width;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const idx = ny * width + nx;
            sum += normalized[idx];
            count++;
          }
        }
      }
      
      feathered[i] = sum / count;
    }
    
    return feathered;
  };

  // Create separated layers
  const createLayer = (maskData: Uint8Array | Uint8ClampedArray, invert: boolean = false) => {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, width, height);
    const data = outputImageData.data;
    
    const featheredMask = applyFeather(maskData);
    
    for (let i = 0; i < featheredMask.length; i++) {
      const alpha = invert ? featheredMask[i] : (1 - featheredMask[i]);
      data[i * 4 + 3] = Math.round(alpha * 255);
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    return new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });
  };

  // Find person and background masks
  const personMask = result.find(r => 
    r.label.toLowerCase().includes('person') || 
    r.label.toLowerCase().includes('human')
  );
  
  const maskData = personMask ? personMask.mask.data : result[0].mask.data;

  const [person, background, objects] = await Promise.all([
    createLayer(maskData, false), // person (inverted mask)
    createLayer(maskData, true),  // background (normal mask)
    createLayer(maskData, false)  // objects (same as person for now)
  ]);

  return {
    person,
    background,
    objects,
    originalWidth: width,
    originalHeight: height,
  };
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const exportLayer = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
