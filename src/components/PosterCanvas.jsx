import { useEffect, useRef, useState } from "react";
import { drawPoster, SIZES } from "../lib/poster.js";

export default function PosterCanvas({ cfg, className }) {
  const ref = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const size = SIZES[cfg?.format] || SIZES.post;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !cfg) return;
    let cancelled = false;

    // Debounce so typing or dragging sliders in the designer doesn't redraw on every keystroke.
    const timer = setTimeout(() => {
      setStatus("loading");
      canvas.width = size.w;
      canvas.height = size.h;
      Promise.resolve(drawPoster(canvas, cfg))
        .then(() => {
          if (!cancelled) setStatus("ready");
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cfg, size.w, size.h]);

  return (
    <div
      className="poster-canvas"
      style={{ aspectRatio: `${size.w} / ${size.h}` }}
    >
      <canvas
        ref={ref}
        className={className}
        role="img"
        aria-label="Poster preview"
        style={{
          width: "100%",
          height: "auto",
          opacity: status === "ready" ? 1 : 0.4,
          transition: "opacity 0.2s",
        }}
      />
      {status !== "ready" ? (
        <div className="poster-status" aria-live="polite">
          {status === "error"
            ? "Couldn't draw the poster. Check the image and try again."
            : "Drawing…"}
        </div>
      ) : null}
    </div>
  );
}
