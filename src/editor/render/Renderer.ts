/**
 * Unified Rendering Manager
 * 
 * This is the single source of truth for rendering frames.
 * All canvas drawing operations flow through this renderer.
 */

import { Frame } from '@/store/framesStore';
import { Element } from '@/store/elementsStore';

export interface CameraTransform {
  zoom: number;
  panX: number;
  panY: number;
  rotate: number;
  dolly: number;
}

export interface RenderConfig {
  width: number;
  height: number;
  enableMotionBlur: boolean;
  enableFilters: boolean;
}

export class UnifiedRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.config = config;
    
    canvas.width = config.width;
    canvas.height = config.height;
  }

  /**
   * Main render function - single entry point for all rendering
   */
  async renderFrame(
    frameImage: HTMLImageElement,
    elements: Element[],
    cameraTransform: CameraTransform
  ): Promise<void> {
    const { ctx, canvas } = this;

    // STEP 1: Clear canvas (once)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // STEP 2: Save context and apply camera transforms
    ctx.save();
    this.applyCameraTransform(cameraTransform);

    // STEP 3: Draw base frame first (background)
    await this.drawBaseFrame(frameImage);

    // STEP 4: Draw all elements on top
    await this.drawElements(elements);

    // STEP 5: Restore context
    ctx.restore();
  }

  /**
   * Apply camera transforms in the correct order
   */
  private applyCameraTransform(transform: CameraTransform): void {
    const { ctx, canvas } = this;
    const { zoom, panX, panY, rotate, dolly } = transform;

    // Transform order: translate -> rotate -> scale
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.rotate((rotate * Math.PI) / 180);
    const totalZoom = zoom + dolly * 0.1;
    ctx.scale(totalZoom, totalZoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  /**
   * Draw base frame (background with optional masking)
   */
  private async drawBaseFrame(frameImage: HTMLImageElement): Promise<void> {
    const { ctx, canvas } = this;
    
    // Wait for image to be ready
    if (!frameImage.complete) {
      await frameImage.decode();
    }

    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }

  /**
   * Draw all elements with transforms and effects
   */
  private async drawElements(elements: Element[]): Promise<void> {
    for (const element of elements) {
      await this.drawElement(element);
    }
  }

  /**
   * Draw single element with all transforms and effects
   */
  private async drawElement(element: Element): Promise<void> {
    const { ctx } = this;
    
    // Load element image
    const img = await this.loadImage(element.image);
    if (!img) return;

    ctx.save();

    // Apply opacity
    ctx.globalAlpha = element.opacity / 100;

    // Apply blend mode
    ctx.globalCompositeOperation = this.getBlendMode(element.blendMode);

    // Translate to element center for rotation
    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.rotation * Math.PI) / 180);

    // Apply filters
    if (this.config.enableFilters) {
      const filters = [];
      if (element.blur > 0) filters.push(`blur(${element.blur}px)`);
      if (element.brightness !== 100) filters.push(`brightness(${element.brightness}%)`);
      if (element.glow > 0) filters.push(`drop-shadow(0 0 ${element.glow}px rgba(255,255,255,0.8))`);
      ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
    }

    // Apply motion blur if enabled
    if (this.config.enableMotionBlur && element.motionBlur && element.motionBlur.amount > 0) {
      this.drawMotionBlur(img, element);
    }

    // Draw main image
    ctx.drawImage(
      img,
      -element.width / 2,
      -element.height / 2,
      element.width,
      element.height
    );

    ctx.restore();
  }

  /**
   * Draw motion blur effect
   */
  private drawMotionBlur(img: HTMLImageElement, element: Element): void {
    const { ctx } = this;
    if (!element.motionBlur) return;

    const steps = Math.ceil(element.motionBlur.amount / 2);
    const angleRad = (element.motionBlur.angle * Math.PI) / 180;
    const stepDistance = element.motionBlur.amount * 3;

    for (let i = steps; i > 0; i--) {
      ctx.save();
      const offsetX = Math.cos(angleRad) * stepDistance * (i / steps);
      const offsetY = Math.sin(angleRad) * stepDistance * (i / steps);
      ctx.globalAlpha = (element.opacity / 100) * (0.3 / steps);
      ctx.translate(-offsetX, -offsetY);
      ctx.drawImage(
        img,
        -element.width / 2,
        -element.height / 2,
        element.width,
        element.height
      );
      ctx.restore();
    }
  }

  /**
   * Load image with promise
   */
  private loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Failed to load image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  /**
   * Map blend mode to canvas composite operation
   */
  private getBlendMode(mode: Element['blendMode']): GlobalCompositeOperation {
    const blendModeMap: Record<Element['blendMode'], GlobalCompositeOperation> = {
      normal: 'source-over',
      multiply: 'multiply',
      screen: 'screen',
      overlay: 'overlay',
      darken: 'darken',
      lighten: 'lighten',
    };
    return blendModeMap[mode] || 'source-over';
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
