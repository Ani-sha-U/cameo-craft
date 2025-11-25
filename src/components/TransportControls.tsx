// src/components/TransportControls.tsx

import React from "react";
import { useRenderStore } from "@/store/renderStore";
import { useTimelineStore } from "@/store/timelineStore";

const TransportControls: React.FC = () => {
  const { play, pause, playing } = useRenderStore();

  const { frames, currentFrameIndex, gotoFrameIndex, fps } = useTimelineStore();

  const handlePrev = () => {
    if (currentFrameIndex > 0) {
      gotoFrameIndex(currentFrameIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentFrameIndex < frames.length - 1) {
      gotoFrameIndex(currentFrameIndex + 1);
    }
  };

  const handleFirst = () => {
    if (frames.length > 0) {
      gotoFrameIndex(0);
    }
  };

  const handleLast = () => {
    if (frames.length > 0) {
      gotoFrameIndex(frames.length - 1);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "8px 10px",
        background: "#111",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderTop: "1px solid #333",
      }}
    >
      {/* Jump to first frame */}
      <button onClick={handleFirst} style={buttonStyle} disabled={frames.length === 0}>
        ⏮
      </button>

      {/* Previous frame */}
      <button onClick={handlePrev} style={buttonStyle} disabled={currentFrameIndex === 0}>
        ⏪
      </button>

      {/* Play / Pause */}
      {playing ? (
        <button onClick={pause} style={mainButtonStyle}>
          ⏸ Pause
        </button>
      ) : (
        <button onClick={play} style={mainButtonStyle} disabled={frames.length <= 1}>
          ▶ Play
        </button>
      )}

      {/* Next frame */}
      <button onClick={handleNext} style={buttonStyle} disabled={currentFrameIndex >= frames.length - 1}>
        ⏩
      </button>

      {/* Jump to last frame */}
      <button onClick={handleLast} style={buttonStyle} disabled={frames.length === 0}>
        ⏭
      </button>

      <div style={{ marginLeft: "auto", opacity: 0.8, fontSize: "14px" }}>
        Frame {currentFrameIndex + 1} / {frames.length}
        &nbsp; | &nbsp; {fps} FPS
      </div>
    </div>
  );
};

export default TransportControls;

// ---------------------
// STYLES
// ---------------------

const buttonStyle: React.CSSProperties = {
  background: "#222",
  border: "1px solid #444",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  color: "#fff",
};

const mainButtonStyle: React.CSSProperties = {
  background: "#0a84ff",
  border: "1px solid #0a60cc",
  padding: "6px 14px",
  borderRadius: "4px",
  cursor: "pointer",
  color: "#fff",
  fontWeight: 600,
};
