import { TEMPLATES, FONTS } from "./data.js";

export const SIZES = {
  status: { w: 1080, h: 1920, label: "9:16" },
  post: { w: 1080, h: 1080, label: "1:1" },
};

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

function fontFamily(id) {
  return FONTS.find((f) => f.id === id)?.family || "Outfit, sans-serif";
}

export async function drawPoster(canvas, cfg) {
  const size = SIZES[cfg.format] || SIZES.post;
  const template = TEMPLATES.find((t) => t.id === cfg.templateId) || TEMPLATES[0];
  const scale = canvas.width / size.w;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const W = size.w;
  const H = size.h;
  const product = cfg.product || {};
  const profile = cfg.profile || {};
  const [photo, logo] = await Promise.all([
    loadImage(product.image),
    loadImage(profile.logo),
  ]);

  ctx.fillStyle = cfg.bgColor || template.bg;
  ctx.fillRect(0, 0, W, H);

  const accent = cfg.accentColor || template.accent;
  const ff = fontFamily(cfg.font);
  const kind = template.kind;
  const isStory = cfg.format === "status" || kind === "status";

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
    ctx.arc(W - 80, 80, 220, 0, Math.PI * 2);
    ctx.globalAlpha = 0.18;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const pad = isStory ? 64 : 56;
  const imgTop = kind === "sale" || kind === "discount" ? 220 : isStory ? 0 : 160;
  const imgH = isStory ? H * 0.72 : kind === "promo" ? W - pad * 2 : Math.min(W - pad * 2, H * 0.52);
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

  const headline = cfg.headline || product.name || "Product";
  const price = product.discountPrice || product.price;
  const textY = isStory ? H - 420 : imgY + imgH + 90;

  ctx.textAlign = "left";
  ctx.fillStyle = isStory || kind !== "promo" ? "#fff" : "#1A1612";
  if (kind === "promo") ctx.fillStyle = "#1A1612";
  ctx.font = `800 ${isStory ? 78 : 64}px ${ff}`;
  wrapText(ctx, headline, pad, textY, W - pad * 2, isStory ? 86 : 72);

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
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(W - pad - 70, isStory ? H - 236 : imgY + 70, 70, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = `800 36px ${ff}`;
      ctx.fillText(`-${off}%`, W - pad - 70, isStory ? H - 224 : imgY + 82);
    }
  }

  if (cfg.sticker) {
    ctx.textAlign = "left";
    ctx.font = "120px serif";
    ctx.fillText(cfg.sticker, W - pad - 130, pad + 140);
  }

  if (cfg.showContact !== false) {
    ctx.textAlign = "left";
    ctx.fillStyle = isStory || kind !== "promo" ? "rgba(255,255,255,0.9)" : "#3d342c";
    ctx.font = `600 32px ${ff}`;
    const contact = [profile.businessName, profile.whatsapp || profile.phone, profile.location]
      .filter(Boolean)
      .join("  ·  ");
    wrapText(ctx, contact || "Add your business details", pad, H - 110, W - pad * 2 - (logo ? 140 : 0), 40);
  }

  if (cfg.showLogo !== false && logo) {
    const s = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W - pad - s / 2, H - pad - s / 2, s / 2, 0, Math.PI * 2);
    ctx.clip();
    cover(ctx, logo, W - pad - s, H - pad - s, s, s);
    ctx.restore();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W - pad - s / 2, H - pad - s / 2, s / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (cfg.watermark) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.4);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = `800 92px ${ff}`;
    ctx.textAlign = "center";
    ctx.fillText("Post2Market", 0, 0);
    ctx.restore();
  }
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
