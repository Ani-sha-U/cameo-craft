// src/components/VideoPreview.tsx

import React, { useEffect, useRef } from "react";
import { useRenderStore } from "@/store/renderStore";
import { useTimelineStore } from "@/store/timelineStore";

const VideoPreview: React.FC = () => {
  const { currentFrameDataUrl, renderCurrentFrame, renderCanvasWidth, renderCanvasHeight } = useRenderStore();

  const { currentFrameIndex, frames } = useTimelineStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Whenever the current frame index changes,
   * force-render the new frame.
   */
  useEffect(() => {
    if (frames.length === 0) return;
    renderCurrentFrame();
  }, [currentFrameIndex, frames.length]);

  /**
   * Draws the rendered frame (data URL) on the canvas.
   */
  useEffect(() => {
    if (!currentFrameDataUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = currentFrameDataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [currentFrameDataUrl]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: "8px",
      }}
    >
      <canvas
        ref={canvasRef}
        width={renderCanvasWidth}
        height={renderCanvasHeight}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
};

export default VideoPreview;
