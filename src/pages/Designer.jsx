import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { TEMPLATES, FONTS, STICKERS } from "../lib/data.js";
import { exportPosterDataUrl } from "../lib/poster.js";
import { generateCaptions } from "../lib/captions.js";
import PosterCanvas from "../components/PosterCanvas.jsx";
import { t } from "../lib/i18n.js";

const COLORS = ["#E85D04", "#D62828", "#C9A227", "#0F6B4C", "#F4A261", "#1A1612", "#6B2D5B"];

export default function Designer() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { data, notify, savePoster } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const productId = params.get("product") || products[0]?.id || "";
  const reuse = (data.posters || []).find((p) => p.id === params.get("poster"));
  const product = products.find((p) => p.id === (reuse?.productId || productId)) || products[0];
  const premium = data.premium;

  const [cfg, setCfg] = useState(() => ({
    format: reuse?.format || "post",
    templateId: reuse?.templateId || "showcase",
    headline: reuse?.headline || product?.name || "",
    font: reuse?.font || "sans",
    accentColor: reuse?.accentColor || "",
    bgColor: reuse?.bgColor || "",
    sticker: reuse?.sticker || "",
    showPrice: reuse?.showPrice ?? true,
    showContact: reuse?.showContact ?? true,
    showLogo: reuse?.showLogo ?? true,
  }));
  const [captionKind, setCaptionKind] = useState("promo");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (product?.name && !reuse) setCfg((c) => ({ ...c, headline: product.name }));
  }, [product?.id, product?.name, reuse]);

  const template = TEMPLATES.find((x) => x.id === cfg.templateId) || TEMPLATES[0];
  const locked = template.premium && !premium;

  const drawCfg = useMemo(
    () => ({
      ...cfg,
      product,
      profile: data.profile,
      watermark: !premium,
    }),
    [cfg, product, data.profile, premium],
  );

  const captions = useMemo(
    () => (product ? generateCaptions(product, data.profile || {}) : []),
    [product, data.profile],
  );
  const caption = captions.find((c) => c.id === captionKind)?.text || "";

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const pickTemplate = (tpl) => {
    if (tpl.premium && !premium) {
      notify("Unlock Premium for this template");
      return;
    }
    set("templateId", tpl.id);
    if (tpl.kind === "status") set("format", "status");
  };

  const finish = async (goShare) => {
    if (!product) return notify("Add a product first");
    if (locked) return notify("Unlock Premium for this template");
    setBusy(true);
    try {
      const image = await exportPosterDataUrl(drawCfg);
      const poster = {
        id: crypto.randomUUID(),
        productId: product.id,
        category: product.category,
        ...cfg,
        caption,
        image,
        createdAt: Date.now(),
      };
      savePoster(poster);
      if (goShare) nav(`/share/${poster.id}`);
    } finally {
      setBusy(false);
    }
  };

  if (!product) {
    return (
      <div className="page">
        <h1>{t(lang, "design")}</h1>
        <p className="empty">{t(lang, "emptyProducts")}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1>{t(lang, "design")}</h1>
        <span className="pill">{premium ? t(lang, "noWatermark") : t(lang, "watermark")}</span>
      </div>

      <div className="chip-row" style={{ marginBottom: 10 }}>
        {products.map((p) => (
          <button
            key={p.id}
            className={`chip ${p.id === product.id ? "on" : ""}`}
            onClick={() => nav(`/design?product=${p.id}`)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="poster-wrap" style={{ aspectRatio: cfg.format === "status" ? "9/16" : "1/1", maxHeight: 420 }}>
        <PosterCanvas cfg={drawCfg} />
      </div>

      <h2 className="section-title">{t(lang, "templates")}</h2>
      <div className="chip-row">
        {TEMPLATES.map((tpl) => (
          <button key={tpl.id} className={`chip ${cfg.templateId === tpl.id ? "on" : ""}`} onClick={() => pickTemplate(tpl)}>
            {tpl.name} {tpl.premium && !premium ? <span className="lock">PRO</span> : null}
          </button>
        ))}
      </div>

      <div className="chip-row" style={{ marginTop: 10 }}>
        <button className={`chip ${cfg.format === "status" ? "on" : ""}`} onClick={() => set("format", "status")}>
          {t(lang, "status")} 9:16
        </button>
        <button className={`chip ${cfg.format === "post" ? "on" : ""}`} onClick={() => set("format", "post")}>
          {t(lang, "square")} 1:1
        </button>
      </div>

      <label className="field" style={{ marginTop: 12 }}>
        <span>Headline</span>
        <input value={cfg.headline} onChange={(e) => set("headline", e.target.value)} />
      </label>

      <span className="muted">Font</span>
      <div className="chip-row" style={{ margin: "6px 0 12px" }}>
        {FONTS.map((f) => (
          <button key={f.id} className={`chip ${cfg.font === f.id ? "on" : ""}`} onClick={() => set("font", f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <span className="muted">Accent</span>
      <div className="row" style={{ margin: "8px 0 12px" }}>
        {COLORS.map((c) => (
          <button
            key={c}
            className={`color-dot ${cfg.accentColor === c ? "on" : ""}`}
            style={{ background: c }}
            onClick={() => set("accentColor", c)}
            aria-label={c}
          />
        ))}
      </div>

      <span className="muted">Stickers</span>
      <div className="chip-row" style={{ margin: "6px 0 12px" }}>
        <button className={`chip ${!cfg.sticker ? "on" : ""}`} onClick={() => set("sticker", "")}>
          None
        </button>
        {STICKERS.map((s) => (
          <button key={s} className={`chip ${cfg.sticker === s ? "on" : ""}`} onClick={() => set("sticker", s)}>
            {s}
          </button>
        ))}
      </div>

      <label className="switch card" style={{ marginBottom: 8 }}>
        <span>Show price</span>
        <input type="checkbox" checked={cfg.showPrice} onChange={(e) => set("showPrice", e.target.checked)} />
      </label>
      <label className="switch card" style={{ marginBottom: 8 }}>
        <span>Show contact / branding</span>
        <input type="checkbox" checked={cfg.showContact} onChange={(e) => set("showContact", e.target.checked)} />
      </label>
      <label className="switch card" style={{ marginBottom: 12 }}>
        <span>Show logo</span>
        <input type="checkbox" checked={cfg.showLogo} onChange={(e) => set("showLogo", e.target.checked)} />
      </label>

      <h2 className="section-title">{t(lang, "caption")}</h2>
      <div className="chip-row">
        {captions.map((c) => (
          <button key={c.id} className={`chip ${captionKind === c.id ? "on" : ""}`} onClick={() => setCaptionKind(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <pre className="caption-box">{caption}</pre>
      <button
        className="btn ghost full"
        type="button"
        onClick={() => navigator.clipboard.writeText(caption).then(() => notify("Caption copied"))}
      >
        {t(lang, "copy")}
      </button>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <button className="btn ghost" disabled={busy} onClick={() => finish(false)}>
          Save
        </button>
        <button className="btn primary" disabled={busy} onClick={() => finish(true)}>
          {t(lang, "share")}
        </button>
      </div>
    </div>
  );
}
