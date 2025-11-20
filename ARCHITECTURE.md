# Painter Video Editor - Architecture Documentation

## Overview

Painter is a frame-by-frame video editor with a unified data model that ensures all edits persist throughout playback, interpolation, and rendering - similar to professional editors like CapCut.

## Core Architecture

### 1. Unified Data Model

Every frame has a persistent state stored in `framesStore`:

```typescript
interface Frame {
  id: string;
  thumbnail: string;        // Base frame image
  timestamp: number;
  elements: Element[];      // All layers/objects on this frame
  canvasState: {
    zoom: number;
    panX: number;
    panY: number;
  };
}
```

All edits update this central frame state, ensuring consistency across the entire application.

### 2. Data Flow

```
User Edit → ElementsCanvas → updateFrameElements() → framesStore
                                                          ↓
                                                    FrameCanvas ← SmartFrameCanvas
                                                          ↓
                                                      Preview
```

**Key principle**: All edits go through the store, all rendering reads from the store.

### 3. Component Responsibilities

#### ElementsCanvas
- Handles user interactions (drag, drop, select)
- Updates `framesStore` when elements are modified
- Visual editing layer on top of preview

#### FrameCanvas
- Low-level canvas renderer
- Composites frame thumbnail + elements
- Applies all transformations, filters, blend modes

#### SmartFrameCanvas
- Wrapper around FrameCanvas
- Adds smooth tweening during playback
- Automatically interpolates between frames

#### FramePlayback
- Controls playback state (play/pause/speed)
- Advances through frames using `selectFrame()`
- Coordinates with SmartFrameCanvas for smooth motion

### 4. Frame Composition Pipeline

```
Raw Frame Data → frameCompositor.ts → Composed Bitmap
                                           ↓
                            [Interpolation / Rendering / Export]
```

The `frameCompositor.ts` utility renders any frame to a bitmap with all edits applied:

- Draws base frame thumbnail
- Composites all elements with proper layering
- Applies transformations (position, rotation, scale)
- Applies visual effects (opacity, blur, brightness, blend modes)

This ensures interpolation and rendering use the **edited** frames, not raw data.

### 5. Smooth Playback with Tweening

During playback, `SmartFrameCanvas` uses `frameTweening.ts` to:

1. Match elements between consecutive frames (by ID or similarity)
2. Calculate intermediate states using easing functions
3. Render smooth transitions between keyframes

This creates fluid motion without requiring every frame to be manually edited.

### 6. Interpolation

The `interpolateFrames()` function in `framesStore`:

1. Takes start and end keyframes
2. Uses `tweenFrameElements()` to generate intermediate element states
3. Creates new frames with tweened elements
4. Composes each frame to get accurate thumbnails
5. Inserts frames into timeline

**Important**: Interpolation uses the **composed** frames with all user edits, not the original extracted frames.

### 7. Rendering/Export

The `renderStore` export pipeline:

1. Uses `composeFrames()` to render all frames to bitmaps
2. Sends composed frame data (base64) to `render-video` edge function
3. Edge function encodes frames into video at specified FPS
4. Returns downloadable video URL

**Critical**: The export always includes all user edits, elements, and transformations.

## Key Features

### Real-time Editing
- All canvas changes immediately update frame state
- Preview reflects changes instantly
- No "apply" or "commit" needed

### Persistent State
- Frame elements stored in central store
- Edits survive playback, scrubbing, and frame navigation
- Undo/redo support (via editorStore)

### Smooth Playback
- Automatic tweening between frames
- Configurable FPS and playback speed
- Onion skinning for animation reference

### Professional Timeline
- Frame-by-frame editing like CapCut
- Duplicate, delete, reorder frames
- Copy elements between frames
- Frame interpolation for smooth motion

### Flexible Element System
- Any element can be added to any frame
- Elements can be copied across frames
- Independent per-frame transformations
- Global elements visible across all frames

## File Structure

```
src/
├── components/
│   ├── ElementsCanvas.tsx        # Editing layer, handles user interaction
│   ├── FrameCanvas.tsx            # Low-level frame renderer
│   ├── SmartFrameCanvas.tsx       # Smart wrapper with tweening
│   ├── FramePlayback.tsx          # Playback controls
│   ├── TransportControls.tsx     # Timeline scrubbing, speed control
│   └── ...
├── store/
│   ├── framesStore.ts             # Central frame state management
│   ├── editorStore.ts             # Playback, history, edit mode
│   ├── elementsStore.ts           # Element definitions
│   └── renderStore.ts             # Export pipeline
├── utils/
│   ├── frameCompositor.ts         # Frame → bitmap rendering
│   └── frameTweening.ts           # Element interpolation
└── pages/
    └── Index.tsx                  # Main editor layout
```

## Technical Details

### Canvas Rendering

All rendering uses HTML Canvas 2D context with:
- `drawImage()` for base frames and elements
- `globalAlpha` for opacity
- `globalCompositeOperation` for blend modes
- `ctx.filter` for blur and brightness
- Transform matrix for rotation and scaling

### Performance Considerations

- Frame thumbnails cached in memory (base64 data URLs)
- Tweening calculations are lightweight (linear interpolation)
- Canvas operations are hardware-accelerated
- Element images loaded once and reused

### Future Enhancements

Potential improvements for production:

1. **WebGL Renderer**: For better performance with many elements
2. **Web Workers**: Offload frame composition to background threads
3. **Video Codec Integration**: Real FFmpeg integration for exports
4. **Cloud Storage**: Store large projects in database/object storage
5. **Collaborative Editing**: Real-time multi-user editing via WebSockets

## Debugging Tips

- Check `framesStore.frames` in Redux DevTools to see frame state
- Inspect `FrameCanvas` renders by adding `console.log()` in `composeFrame()`
- Verify element updates by logging `updateFrameElements()` calls
- Use browser Performance tab to profile rendering bottlenecks

## Getting Started

1. Generate a video from a prompt
2. Extract frames using "Convert to Frames"
3. Select a frame to edit
4. Add elements from Asset Library or separate video objects
5. Edit elements on canvas (drag, resize, rotate)
6. Press Play to see smooth playback
7. Use interpolation to generate in-between frames
8. Export final video with all edits applied

Everything just works - all edits persist throughout the entire workflow.
