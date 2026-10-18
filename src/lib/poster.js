import { TEMPLATES, FONTS } from "./data.js";

export const SIZES = {
  status: { w: 1080, h: 1920, label: "9:16" },
  post: { w: 1080, h: 1080, label: "1:1" },
};

const PI2 = Math.PI * 2;
const DEFAULT_FAMILY = "Outfit, sans-serif";

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function cover(ctx, img, x, y, w, h) {
  if (!img) {
    ctx.fillStyle = "#222";
    ctx.fillRect(x, y, w, h);
    return;
  }
  const ir = img.width / img.height;
  const r = w / h;
  let dw = w;
  let dh = h;
  let dx = x;
  let dy = y;
  if (ir > r) {
    dw = h * ir;
    dx = x - (dw - w) / 2;
  } else {
    dh = w / ir;
    dy = y - (dh - h) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function money(n) {
  return `TSh ${Number(n || 0).toLocaleString()}`;
}

function fontFamily(id, template) {
  const pick = !id || id === "auto" ? template?.font || "sans" : id;
  return FONTS.find((f) => f.id === pick)?.family || DEFAULT_FAMILY;
}

function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return `rgba(255,255,255,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const hash = (s) => {
  let h = 7;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};

// Small seeded random generator so textures are identical on every redraw (no flicker).
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function breakLines(ctx, text, maxW) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// Shrinks the font until the text fits in `maxLines`; adds an ellipsis if even the minimum overflows.
function fitLines(ctx, text, family, weight, maxW, maxLines, start, min) {
  for (let size = start; size >= min; size -= 4) {
    const font = `${weight} ${size}px ${family}`;
    ctx.font = font;
    const lines = breakLines(ctx, text, maxW);
    if (lines.length <= maxLines) return { size, lines, font };
  }
  const font = `${weight} ${min}px ${family}`;
  ctx.font = font;
  const lines = breakLines(ctx, text, maxW).slice(0, maxLines);
  lines[lines.length - 1] += "…";
  return { size: min, lines, font };
}

// Draws fitted lines; returns the baseline of the last line.
function drawLines(ctx, fit, x, y, lineH, align = "left", painter) {
  ctx.font = fit.font;
  ctx.textAlign = align;
  let yy = y;
  fit.lines.forEach((ln, i) => {
    if (painter) painter(ln, x, yy, i);
    else ctx.fillText(ln, x, yy);
    yy += lineH;
  });
  return yy - lineH;
}

function starburst(ctx, cx, cy, r, spikes = 14, inner = 0.84) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI / spikes) * i;
    const rr = i % 2 ? r * inner : r;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function priceInfo(e) {
  const { product, cfg } = e;
  const price = product.discountPrice || product.price;
  const was =
    product.discountPrice && product.price > product.discountPrice
      ? product.price
      : 0;
  const off = was ? Math.round((1 - product.discountPrice / was) * 100) : 0;
  return { show: cfg.showPrice !== false && Boolean(price), price, was, off };
}

// Price with the old price struck through next to it.
function priceBlock(e, x, y, size, color, oldColor, align = "left") {
  const { ctx, ff, heavy } = e;
  const p = priceInfo(e);
  if (!p.show) return;
  ctx.font = `${heavy} ${size}px ${ff}`;
  const nw = ctx.measureText(money(p.price)).width;
  const oldSize = Math.round(size * 0.62);
  ctx.font = `${heavy === 400 ? 400 : 600} ${oldSize}px ${ff}`;
  const ow = p.was ? ctx.measureText(money(p.was)).width : 0;
  const gap = p.was ? size * 0.4 : 0;
  const total = nw + gap + ow;
  const sx =
    align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.font = `${heavy} ${size}px ${ff}`;
  ctx.fillText(money(p.price), sx, y);
  if (p.was) {
    const ox = sx + nw + gap;
    ctx.font = `${heavy === 400 ? 400 : 600} ${oldSize}px ${ff}`;
    ctx.fillStyle = oldColor;
    ctx.fillText(money(p.was), ox, y);
    ctx.fillRect(ox, y - oldSize * 0.32, ow, Math.max(3, oldSize * 0.07));
  }
}

function tagPill(e, cx, cy, text, fill, ink, size = 34) {
  const { ctx, ff, heavy } = e;
  ctx.font = `${heavy} ${size}px ${ff}`;
  const w = ctx.measureText(text).width + size * 1.4;
  const h = size * 1.9;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.fillText(text, cx, cy + size * 0.35);
}

// Starburst sticker carrying the price (street / pop templates).
function priceBurst(e, cx, cy, R, fill, ink, rot = 0.16) {
  const { ctx, ff } = e;
  const p = priceInfo(e);
  if (!p.show) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  starburst(ctx, 0, 0, R, 14, 0.84);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111";
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = `400 ${R * 0.22}px ${ff}`;
  ctx.fillText(p.was ? "NOW" : "ONLY", 0, -R * 0.42);
  const txt = Number(p.price).toLocaleString();
  let size = R * 0.62;
  ctx.font = `400 ${size}px ${ff}`;
  while (ctx.measureText(txt).width > R * 1.4 && size > 20) {
    size -= 2;
    ctx.font = `400 ${size}px ${ff}`;
  }
  ctx.fillText(txt, 0, R * 0.2);
  ctx.font = `400 ${R * 0.2}px ${ff}`;
  ctx.fillText("TSH", 0, R * 0.5);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Professional layouts                                                */
/* ------------------------------------------------------------------ */

function drawMinimal(e) {
  const { ctx, W, cfg, photo, accent, ff, story, heavy } = e;
  const pad = 64;
  const photoH = story ? 1040 : 540;
  roundRect(ctx, pad, pad, W - pad * 2, photoH, 28);
  ctx.save();
  ctx.clip();
  cover(ctx, photo, pad, pad, W - pad * 2, photoH);
  ctx.restore();

  let y = pad + photoH + (story ? 64 : 44);
  ctx.fillStyle = accent;
  roundRect(ctx, pad, y, 96, 8, 4);
  ctx.fill();

  const ink = cfg.textColor || "#1A1612";
  const fit = fitLines(
    ctx,
    e.cased(e.headline, "normal"),
    ff,
    heavy,
    W - pad * 2,
    2,
    story ? 84 : 64,
    38,
  );
  ctx.fillStyle = ink;
  y = drawLines(ctx, fit, pad, y + 8 + fit.size, fit.size * 1.1, "left");

  const priceY = y + (story ? 100 : 78);
  priceBlock(e, pad, priceY, story ? 66 : 54, accent, "#8a7d70");
  const p = priceInfo(e);
  if (p.show && p.off)
    tagPill(
      e,
      W - pad - 80,
      priceY - (story ? 22 : 18),
      `-${p.off}%`,
      accent,
      "#fff",
      story ? 40 : 34,
    );
  return "#3d342c";
}

function drawLuxe(e) {
  const { ctx, W, H, cfg, photo, accent, ff, story } = e;
  const cream = cfg.textColor || "#F5E9C8";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.globalAlpha = 1;

  const aw = story ? 700 : 460;
  const ah = story ? 1180 : 520;
  const ax = (W - aw) / 2;
  const ay = story ? 130 : 84;
  const arch = () => {
    ctx.beginPath();
    ctx.moveTo(ax, ay + ah);
    ctx.lineTo(ax, ay + aw / 2);
    ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0);
    ctx.lineTo(ax + aw, ay + ah);
    ctx.closePath();
  };
  arch();
  ctx.save();
  ctx.clip();
  cover(ctx, photo, ax, ay, aw, ah);
  ctx.restore();
  arch();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.stroke();

  let y = ay + ah + (story ? 70 : 50);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 170, y);
  ctx.lineTo(W / 2 - 26, y);
  ctx.moveTo(W / 2 + 26, y);
  ctx.lineTo(W / 2 + 170, y);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(W / 2, y - 10);
  ctx.lineTo(W / 2 + 10, y);
  ctx.lineTo(W / 2, y + 10);
  ctx.lineTo(W / 2 - 10, y);
  ctx.closePath();
  ctx.fill();

  const fit = fitLines(
    ctx,
    e.cased(e.headline, "normal"),
    ff,
    700,
    W - 200,
    2,
    story ? 80 : 58,
    36,
  );
  ctx.fillStyle = cream;
  y = drawLines(ctx, fit, W / 2, y + 20 + fit.size, fit.size * 1.14, "center");
  priceBlock(
    e,
    W / 2,
    y + (story ? 96 : 76),
    story ? 60 : 50,
    accent,
    "rgba(245,233,200,0.5)",
    "center",
  );
  return "rgba(245,233,200,0.88)";
}

function drawSplit(e) {
  const { ctx, W, cfg, photo, accent, ff, story, heavy } = e;
  const h1 = story ? 1040 : 480;
  const h2 = story ? 1240 : 600;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, h1);
  ctx.lineTo(0, h2);
  ctx.closePath();
  ctx.clip();
  cover(ctx, photo, 0, 0, W, h2);
  ctx.restore();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, h2);
  ctx.lineTo(W, h1);
  ctx.lineTo(W, h1 + 22);
  ctx.lineTo(0, h2 + 22);
  ctx.closePath();
  ctx.fill();

  const pad = 64;
  const fit = fitLines(
    ctx,
    e.cased(e.headline, "normal"),
    ff,
    heavy,
    W - pad * 2,
    2,
    story ? 88 : 66,
    38,
  );
  ctx.fillStyle = cfg.textColor || "#FFFFFF";
  const y = drawLines(
    ctx,
    fit,
    pad,
    h2 + 22 + (story ? 110 : 84),
    fit.size * 1.1,
    "left",
  );
  priceBlock(
    e,
    pad,
    y + (story ? 104 : 80),
    story ? 70 : 56,
    accent,
    "rgba(255,255,255,0.55)",
  );
  const p = priceInfo(e);
  if (p.show && p.off)
    tagPill(
      e,
      W - 130,
      story ? 130 : 100,
      `-${p.off}%`,
      accent,
      "#12263A",
      story ? 44 : 38,
    );
  return "rgba(255,255,255,0.88)";
}

/* ------------------------------------------------------------------ */
/* Street layouts                                                      */
/* ------------------------------------------------------------------ */

function drawStreet(e) {
  const { ctx, W, cfg, photo, accent, ff, story, profile } = e;
  const ink = cfg.textColor || "#111111";

  // Concrete grain
  const r = rng(hash(e.headline));
  ctx.save();
  for (let i = 0; i < (story ? 2800 : 1700); i++) {
    ctx.globalAlpha = 0.05 + r() * 0.06;
    ctx.fillStyle = r() > 0.5 ? "#000" : "#fff";
    const s = 1 + r() * 3;
    ctx.fillRect(r() * W, r() * (story ? 1920 : 1080), s, s);
  }
  ctx.restore();

  // Hazard-tape style strip with the business name
  const sy = story ? 96 : 70;
  ctx.save();
  ctx.translate(W / 2, sy);
  ctx.rotate(-0.03);
  ctx.fillStyle = "#111";
  ctx.fillRect(-W, -32, W * 2, 64);
  ctx.fillStyle = "#FFD60A";
  ctx.font = `400 30px ${ff}`;
  ctx.textAlign = "left";
  const tape = `${(profile.businessName || "NEW DROP").toUpperCase()}  ★  NEW DROP  ★  LIMITED STOCK  ★  `;
  const tw = ctx.measureText(tape).width || 300;
  for (let x = -W / 2 - 40; x < W; x += tw) ctx.fillText(tape, x, 11);
  ctx.restore();

  // Stacked headline: solid line, outlined line
  const fit = fitLines(
    ctx,
    e.cased(e.headline, "upper"),
    ff,
    e.heavy,
    W - 128,
    2,
    story ? 190 : 150,
    70,
  );
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.strokeStyle = ink;
  drawLines(
    ctx,
    fit,
    64,
    sy + 32 + fit.size * 0.95,
    fit.size * 0.96,
    "left",
    (ln, x, y, i) => {
      if (i % 2 === 1) {
        ctx.strokeText(ln, x, y);
      } else {
        ctx.fillStyle = ink;
        ctx.fillText(ln, x, y);
      }
    },
  );

  // Taped, tilted photo with hard shadow
  const pw = story ? 800 : 520;
  const ph = story ? 900 : 430;
  const cx = story ? W * 0.54 : W * 0.57;
  const cy = story ? 1050 : 670;
  const b = 14;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.07);
  ctx.fillStyle = "#111";
  ctx.fillRect(-pw / 2 - b + 18, -ph / 2 - b + 18, pw + 2 * b, ph + 2 * b);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-pw / 2 - b, -ph / 2 - b, pw + 2 * b, ph + 2 * b);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-pw / 2, -ph / 2, pw, ph);
  ctx.clip();
  cover(ctx, photo, -pw / 2, -ph / 2, pw, ph);
  ctx.restore();
  ctx.fillStyle = "rgba(235,224,180,0.88)";
  [
    [-pw / 2 + 30, -ph / 2 - 8, -0.6],
    [pw / 2 - 30, -ph / 2 - 8, 0.6],
  ].forEach(([tx, ty, rot]) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(rot);
    ctx.fillRect(-70, -20, 140, 40);
    ctx.restore();
  });
  ctx.restore();

  priceBurst(
    e,
    story ? 230 : 200,
    story ? 1500 : 780,
    story ? 180 : 135,
    accent,
    "#111",
  );
  return "#111111";
}

function drawNeon(e) {
  const { ctx, W, H, cfg, photo, accent, ff, story, heavy } = e;
  const pink = "#FF2E93";
  const g = ctx.createRadialGradient(W / 2, H * 0.35, 40, W / 2, H * 0.35, W);
  g.addColorStop(0, hexA(accent, 0.28));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const pad = 64;
  const py = story ? 150 : 112;
  const ph = story ? 1000 : 500;
  roundRect(ctx, pad, py, W - pad * 2, ph, 30);
  ctx.save();
  ctx.clip();
  cover(ctx, photo, pad, py, W - pad * 2, ph);
  ctx.restore();
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 36;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 7;
  roundRect(ctx, pad, py, W - pad * 2, ph, 30);
  ctx.stroke();
  ctx.stroke();
  ctx.restore();

  const fit = fitLines(
    ctx,
    e.cased(e.headline, "upper"),
    ff,
    heavy,
    W - pad * 2,
    2,
    story ? 88 : 66,
    38,
  );
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 26;
  ctx.fillStyle = cfg.textColor || "#FFFFFF";
  const y = drawLines(
    ctx,
    fit,
    pad,
    py + ph + (story ? 100 : 84),
    fit.size * 1.12,
    "left",
  );
  ctx.restore();

  ctx.save();
  ctx.shadowColor = pink;
  ctx.shadowBlur = 22;
  priceBlock(
    e,
    pad,
    y + (story ? 104 : 80),
    story ? 70 : 56,
    pink,
    "rgba(255,255,255,0.5)",
  );
  ctx.restore();

  const p = priceInfo(e);
  if (p.show && p.off) {
    ctx.save();
    roundRect(ctx, W - pad - 190, py + 28, 160, 68, 34);
    ctx.fillStyle = "rgba(7,7,13,0.88)";
    ctx.fill();
    ctx.shadowColor = pink;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = pink;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `${heavy} 38px ${ff}`;
    ctx.fillText(`-${p.off}%`, W - pad - 110, py + 76);
  }
  return "rgba(255,255,255,0.88)";
}

function drawPop(e) {
  const { ctx, W, H, cfg, photo, accent, ff, story, heavy } = e;
  const ink = cfg.textColor || "#111111";

  // Halftone dots
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  let row = 0;
  for (let y = 18; y < H; y += 38, row++) {
    for (let x = (row % 2 ? 0 : 19) + 18; x < W; x += 38) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, PI2);
      ctx.fill();
    }
  }

  // Framed photo
  const pw = story ? 860 : 740;
  const ph = story ? 760 : 420;
  const cy = story ? 560 : 370;
  const b = 16;
  ctx.save();
  ctx.translate(W / 2, cy);
  ctx.rotate(0.03);
  ctx.fillStyle = "#111";
  ctx.fillRect(-pw / 2 - b + 20, -ph / 2 - b + 20, pw + 2 * b, ph + 2 * b);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-pw / 2 - b, -ph / 2 - b, pw + 2 * b, ph + 2 * b);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 6;
  ctx.strokeRect(-pw / 2 - b, -ph / 2 - b, pw + 2 * b, ph + 2 * b);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-pw / 2, -ph / 2, pw, ph);
  ctx.clip();
  cover(ctx, photo, -pw / 2, -ph / 2, pw, ph);
  ctx.restore();
  ctx.restore();

  // Headline label
  const bw = W - 128;
  const fit = fitLines(
    ctx,
    e.cased(e.headline, "upper"),
    ff,
    heavy,
    bw - 60,
    2,
    story ? 120 : 100,
    50,
  );
  const lineH = fit.size * 1.02;
  const bh = fit.lines.length * lineH + 44;
  const by = story ? 1060 : 652;
  ctx.save();
  ctx.translate(W / 2, by + bh / 2);
  ctx.rotate(-0.03);
  ctx.fillStyle = "#111";
  ctx.fillRect(-bw / 2 + 14, -bh / 2 + 14, bw, bh);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#111";
  ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = ink;
  drawLines(ctx, fit, 0, -bh / 2 + 22 + fit.size * 0.88, lineH, "center");
  ctx.restore();

  const bx = W - (story ? 190 : 150);
  const byy = story ? 300 : 200;
  const R = story ? 170 : 125;
  priceBurst(e, bx, byy, R, accent, "#fff", 0.12);
  const p = priceInfo(e);
  if (p.show && p.off)
    tagPill(
      e,
      bx,
      byy + R + 36,
      `-${p.off}%`,
      "#111",
      "#FFD60A",
      story ? 40 : 34,
    );
  return "#111111";
}

const LAYOUTS = {
  minimal: drawMinimal,
  luxe: drawLuxe,
  split: drawSplit,
  street: drawStreet,
  neon: drawNeon,
  pop: drawPop,
};

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function drawBrandRow(e, footInk) {
  const { ctx, W, H, cfg, profile, logo, accent, ff, story } = e;
  const pad = story ? 64 : 56;

  if (cfg.sticker) {
    ctx.textAlign = "left";
    ctx.font = "120px serif";
    ctx.fillText(cfg.sticker, W - pad - 130, pad + 140);
  }

  if (cfg.showContact !== false) {
    ctx.textAlign = "left";
    ctx.fillStyle = footInk;
    ctx.font = `600 32px ${ff}`;
    const contact = [
      profile.businessName,
      profile.whatsapp || profile.phone,
      profile.location,
    ]
      .filter(Boolean)
      .join("  ·  ");
    wrapText(
      ctx,
      contact || "Add your business details",
      pad,
      H - 110,
      W - pad * 2 - (logo ? 140 : 0),
      40,
    );
  }

  if (cfg.showLogo !== false && logo) {
    const s = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W - pad - s / 2, H - pad - s / 2, s / 2, 0, PI2);
    ctx.clip();
    cover(ctx, logo, W - pad - s, H - pad - s, s, s);
    ctx.restore();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W - pad - s / 2, H - pad - s / 2, s / 2, 0, PI2);
    ctx.stroke();
  }
}

function drawFrame(e) {
  const { ctx, W, H, cfg, accent } = e;
  const f = cfg.frame;
  if (!f) return;
  ctx.save();
  ctx.strokeStyle = accent;
  if (f === "thin") {
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, W - 48, H - 48);
  } else if (f === "bold") {
    ctx.lineWidth = 28;
    ctx.strokeRect(14, 14, W - 28, H - 28);
  } else if (f === "corners") {
    ctx.lineWidth = 10;
    ctx.lineCap = "square";
    const L = 110;
    const m = 30;
    [
      [m, m, 1, 1],
      [W - m, m, -1, 1],
      [m, H - m, 1, -1],
      [W - m, H - m, -1, -1],
    ].forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * L, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * L);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawWatermark(e) {
  const { ctx, W, H, cfg, ff } = e;
  if (!cfg.watermark) return;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.4);
  ctx.font = `800 92px ${ff}`;
  ctx.textAlign = "center";
  // Light fill plus a faint dark outline so it stays visible on light and dark posters.
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.strokeText("Post2Market", 0, 0);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillText("Post2Market", 0, 0);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Original (classic) layouts                                          */
/* ------------------------------------------------------------------ */

function drawLegacy(e) {
  const { ctx, W, H, cfg, photo, product, accent, ff, kind } = e;
  const isStory = e.story;

  if (kind === "promo") {
    ctx.fillStyle = cfg.bgColor || "#F6EDE0";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 28);
    ctx.fillRect(0, H - 28, W, 28);
  }

  if (kind === "new") {
    ctx.fillStyle = "#C9A227";
    ctx.beginPath();
    ctx.arc(W - 80, 80, 220, 0, PI2);
    ctx.globalAlpha = 0.18;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const pad = isStory ? 64 : 56;
  const imgTop =
    kind === "sale" || kind === "discount" ? 220 : isStory ? 0 : 160;
  const imgH = isStory
    ? H * 0.72
    : kind === "promo"
      ? W - pad * 2
      : Math.min(W - pad * 2, H * 0.52);
  const imgX = isStory ? 0 : pad;
  const imgW = isStory ? W : W - pad * 2;
  const imgY = isStory ? 0 : imgTop;

  if (!isStory) {
    roundRect(ctx, imgX, imgY, imgW, imgH, 36);
    ctx.save();
    ctx.clip();
    cover(ctx, photo, imgX, imgY, imgW, imgH);
    ctx.restore();
  } else {
    cover(ctx, photo, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.45, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(10,8,6,0.94)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  if (kind === "sale") {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 168);
    ctx.fillStyle = "#fff";
    ctx.font = `800 92px ${ff}`;
    ctx.textAlign = "center";
    ctx.fillText("FLASH SALE", W / 2, 112);
  }

  if (kind === "new") {
    ctx.fillStyle = accent;
    roundRect(ctx, pad, 56, 360, 72, 36);
    ctx.fill();
    ctx.fillStyle = "#14261C";
    ctx.font = `800 36px ${ff}`;
    ctx.textAlign = "left";
    ctx.fillText("NEW ARRIVAL", pad + 36, 104);
  }

  const headline = e.headline;
  const price = product.discountPrice || product.price;
  const textY = isStory ? H - 420 : imgY + imgH + 90;

  ctx.textAlign = "left";
  ctx.fillStyle = isStory || kind !== "promo" ? "#fff" : "#1A1612";
  if (kind === "promo") ctx.fillStyle = "#1A1612";
  if (cfg.textColor) ctx.fillStyle = cfg.textColor;
  ctx.font = `800 ${isStory ? 78 : 64}px ${ff}`;
  wrapText(
    ctx,
    e.cased(headline, "normal"),
    pad,
    textY,
    W - pad * 2,
    isStory ? 86 : 72,
  );

  if (cfg.showPrice !== false) {
    const badgeY = isStory ? H - 280 : imgY + imgH - 92;
    const badgeX = isStory ? pad : imgX + 28;
    ctx.fillStyle = accent;
    roundRect(ctx, badgeX, badgeY, 430, 88, 22);
    ctx.fill();
    ctx.fillStyle = kind === "promo" ? "#fff" : "#1A1612";
    if (kind === "sale" || kind === "discount") ctx.fillStyle = "#fff";
    ctx.font = `800 40px ${ff}`;
    ctx.textAlign = "left";
    const label = product.discountPrice ? `NOW ${money(price)}` : money(price);
    ctx.fillText(label, badgeX + 28, badgeY + 58);

    if (product.discountPrice) {
      const off = Math.round((1 - product.discountPrice / product.price) * 100);
      ctx.beginPath();
      ctx.arc(W - pad - 70, isStory ? H - 236 : imgY + 70, 70, 0, PI2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = `800 36px ${ff}`;
      ctx.fillText(`-${off}%`, W - pad - 70, isStory ? H - 224 : imgY + 82);
    }
  }

  return isStory || kind !== "promo" ? "rgba(255,255,255,0.9)" : "#3d342c";
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(" ");
  let line = "";
  let yy = y;
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
      lines += 1;
      if (lines >= 2) break;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function drawPoster(canvas, cfg) {
  const size = SIZES[cfg.format] || SIZES.post;
  const template =
    TEMPLATES.find((t) => t.id === cfg.templateId) || TEMPLATES[0];
  const scale = canvas.width / size.w;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const W = size.w;
  const H = size.h;
  const product = cfg.product || {};
  const profile = cfg.profile || {};
  const ff = fontFamily(cfg.font, template);

  const [photo, logo] = await Promise.all([
    loadImage(product.image),
    loadImage(profile.logo),
    // Make sure the chosen web font is ready before drawing text with it.
    Promise.resolve(document.fonts?.load(`400 40px ${ff}`)).catch(() => null),
  ]);

  const kind = template.kind;
  const layout = LAYOUTS[kind];
  const accent = cfg.accentColor || template.accent;
  const legacyStory = cfg.format === "status" || kind === "status";

  const e = {
    ctx,
    W,
    H,
    cfg,
    template,
    product,
    profile,
    photo,
    logo,
    accent,
    ff,
    kind,
    story: layout ? H > W : legacyStory,
    headline: cfg.headline || product.name || "Product",
    // Impact/Anton have a single weight, so avoid faux-bold on them.
    heavy: /Impact|Anton/.test(ff) ? 400 : 800,
    cased: (s, def) => {
      const mode = cfg.caps || "";
      if (mode === "upper") return String(s).toUpperCase();
      if (mode === "normal") return String(s);
      return def === "upper" ? String(s).toUpperCase() : String(s);
    },
  };

  ctx.fillStyle = cfg.bgColor || template.bg;
  ctx.fillRect(0, 0, W, H);

  const footInk = layout ? layout(e) : drawLegacy(e);
  drawBrandRow(e, footInk);
  drawFrame(e);
  drawWatermark(e);
}

export async function exportPosterDataUrl(cfg, type = "image/png") {
  const size = SIZES[cfg.format] || SIZES.post;
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  await drawPoster(canvas, cfg);
  return canvas.toDataURL(type);
}

export async function exportPosterBlob(cfg) {
  const size = SIZES[cfg.format] || SIZES.post;
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  await drawPoster(canvas, cfg);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function compressImage(file, max = 1000) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);
  if (!img) return "";
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}
