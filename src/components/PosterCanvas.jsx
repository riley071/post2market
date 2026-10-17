import { useEffect, useRef } from "react";
import { drawPoster, SIZES } from "../lib/poster.js";

export default function PosterCanvas({ cfg, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !cfg) return;
    const size = SIZES[cfg.format] || SIZES.post;
    canvas.width = size.w;
    canvas.height = size.h;
    let cancelled = false;
    drawPoster(canvas, cfg).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [cfg]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "auto" }} />;
}
