import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import {
  TEMPLATES,
  TEMPLATE_STYLES,
  FONTS,
  STICKERS,
  FRAMES,
  CASES,
} from "../lib/data.js";
import { exportPosterDataUrl } from "../lib/poster.js";
import { generateCaptions } from "../lib/captions.js";
import PosterCanvas from "../components/PosterCanvas.jsx";
import { t } from "../lib/i18n.js";

const COLORS = [
  "#E85D04",
  "#D62828",
  "#C9A227",
  "#0F6B4C",
  "#F4A261",
  "#1A1612",
  "#6B2D5B",
  "#FFD60A",
  "#00F5D4",
  "#FF2E93",
];
const BG_COLORS = [
  "#FFF8F1",
  "#1A1612",
  "#0F6B4C",
  "#F4A261",
  "#FDE68A",
  "#DBEAFE",
  "#6B2D5B",
  "#D9D5CE",
  "#07070D",
];
const TEXT_COLORS = [
  "#FFFFFF",
  "#111111",
  "#F5E9C8",
  "#FFD60A",
  "#00F5D4",
  "#FF2E93",
  "#E85D04",
];
const MAX_HEADLINE = 60;

// crypto.randomUUID only exists in secure contexts (HTTPS/localhost), so fall back on plain HTTP.
const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const defaults = (product) => ({
  format: "post",
  templateId: "showcase",
  headline: product?.name || "",
  font: "auto",
  accentColor: "",
  bgColor: "",
  textColor: "",
  frame: "",
  caps: "",
  sticker: "",
  showPrice: true,
  showContact: true,
  showLogo: true,
});

function ColorPicker({ label, value, colors, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span className="muted">{label}</span>
      <div className="row color-row">
        <button
          type="button"
          className={`chip ${!value ? "on" : ""}`}
          onClick={() => onChange("")}
        >
          Auto
        </button>
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-dot ${value?.toLowerCase() === c.toLowerCase() ? "on" : ""}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            aria-label={`${label} ${c}`}
          />
        ))}
        <input
          type="color"
          className="color-input"
          value={value || colors[0]}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Custom ${label.toLowerCase()} colour`}
        />
      </div>
    </div>
  );
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <>
      <span className="muted">{label}</span>
      <div className="chip-row" style={{ margin: "6px 0 12px" }}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`chip ${value === o.id ? "on" : ""}`}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default function Designer() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { data, notify, savePoster } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const productId = params.get("product") || products[0]?.id || "";
  const reuse = (data.posters || []).find((p) => p.id === params.get("poster"));
  const product =
    products.find((p) => p.id === (reuse?.productId || productId)) ||
    products[0];
  const premium = data.premium;

  const [cfg, setCfg] = useState(() => ({
    ...defaults(product),
    format: reuse?.format || "post",
    templateId: reuse?.templateId || "showcase",
    headline: reuse?.headline || product?.name || "",
    font: reuse?.font || "auto",
    accentColor: reuse?.accentColor || "",
    bgColor: reuse?.bgColor || "",
    textColor: reuse?.textColor || "",
    frame: reuse?.frame || "",
    caps: reuse?.caps || "",
    sticker: reuse?.sticker || "",
    showPrice: reuse?.showPrice ?? true,
    showContact: reuse?.showContact ?? true,
    showLogo: reuse?.showLogo ?? true,
  }));
  const [captionKind, setCaptionKind] = useState("promo");
  const [edits, setEdits] = useState({}); // caption edits, keyed by product + kind
  const [busy, setBusy] = useState(false);
  const [styleFilter, setStyleFilter] = useState("all");

  useEffect(() => {
    if (product?.name && !reuse)
      setCfg((c) => ({ ...c, headline: product.name }));
  }, [product?.id, product?.name, reuse]);

  const template =
    TEMPLATES.find((x) => x.id === cfg.templateId) || TEMPLATES[0];
  const locked = template.premium && !premium;
  const shownTemplates = TEMPLATES.filter(
    (tpl) => styleFilter === "all" || tpl.style === styleFilter,
  );

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
  const captionKey = `${product?.id}:${captionKind}`;
  const generated = captions.find((c) => c.id === captionKind)?.text || "";
  const caption = edits[captionKey] ?? generated;
  const captionEdited =
    edits[captionKey] !== undefined && edits[captionKey] !== generated;

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const pickTemplate = (tpl) => {
    if (tpl.premium && !premium) {
      notify("Unlock Premium for this template");
      return;
    }
    set("templateId", tpl.id);
    if (tpl.kind === "status") set("format", "status");
  };

  const resetDesign = () => {
    setCfg(defaults(product));
    setEdits({});
    notify("Design reset");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      notify("Caption copied");
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.");
    }
  };

  const finish = async (goShare) => {
    if (busy) return;
    if (!product) return notify("Add a product first");
    if (locked) return notify("Unlock Premium for this template");
    setBusy(true);
    try {
      const image = await exportPosterDataUrl(drawCfg);
      const poster = {
        id: uid(),
        productId: product.id,
        category: product.category,
        ...cfg,
        caption,
        image,
        createdAt: Date.now(),
      };
      savePoster(poster);
      if (goShare) nav(`/share/${poster.id}`);
      else notify("Poster saved to gallery");
    } catch {
      notify(
        "Couldn't save the poster. Storage may be full: delete old posters and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!product) {
    return (
      <div className="page">
        <h1>{t(lang, "design")}</h1>
        <div className="empty">
          <p>{t(lang, "emptyProducts")}</p>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => nav("/products/new")}
          >
            {t(lang, "addProduct")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1>{t(lang, "design")}</h1>
        <span className={`pill ${premium ? "premium" : ""}`}>
          {premium ? t(lang, "noWatermark") : t(lang, "watermark")}
        </span>
      </div>

      <div
        className="chip-row"
        style={{ marginBottom: 10 }}
        role="group"
        aria-label="Choose product"
      >
        {products.map((p) => (
          <button
            key={p.id}
            className={`chip ${p.id === product.id ? "on" : ""}`}
            aria-pressed={p.id === product.id}
            onClick={() => nav(`/design?product=${p.id}`, { replace: true })}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div
        className="poster-wrap"
        style={{
          aspectRatio: cfg.format === "status" ? "9/16" : "1/1",
          maxHeight: 420,
        }}
      >
        <PosterCanvas cfg={drawCfg} />
      </div>

      <h2 className="section-title">{t(lang, "templates")}</h2>
      <div
        className="chip-row"
        role="group"
        aria-label="Template style"
        style={{ marginBottom: 8 }}
      >
        {TEMPLATE_STYLES.map((s) => (
          <button
            key={s.id}
            className={`chip ${styleFilter === s.id ? "on" : ""}`}
            aria-pressed={styleFilter === s.id}
            onClick={() => setStyleFilter(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="tpl-row">
        {shownTemplates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className={`tpl-card ${cfg.templateId === tpl.id ? "on" : ""}`}
            aria-pressed={cfg.templateId === tpl.id}
            onClick={() => pickTemplate(tpl)}
          >
            <span
              className="tpl-swatch"
              data-kind={tpl.kind}
              style={{
                "--bg": tpl.bg,
                "--ac": tpl.accent,
                "--tx": tpl.light ? "#1a1612" : "#ffffff",
              }}
            >
              <i className="b1" />
              <i className="b2" />
              <i className="b3" />
            </span>
            <b>{tpl.name}</b>
            <small>
              {tpl.style === "pro"
                ? "Professional"
                : tpl.style === "street"
                  ? "Street"
                  : "Classic"}
              {tpl.premium && !premium ? (
                <span className="lock"> · PREMIUM</span>
              ) : null}
            </small>
          </button>
        ))}
      </div>

      <div className="chip-row" style={{ marginTop: 6 }}>
        <button
          className={`chip ${cfg.format === "status" ? "on" : ""}`}
          onClick={() => set("format", "status")}
        >
          {t(lang, "status")} 9:16
        </button>
        <button
          className={`chip ${cfg.format === "post" ? "on" : ""}`}
          onClick={() => set("format", "post")}
        >
          {t(lang, "square")} 1:1
        </button>
      </div>

      <label className="field" style={{ marginTop: 12 }}>
        <span>
          Headline{" "}
          <span className="counter">
            {cfg.headline.length}/{MAX_HEADLINE}
          </span>
        </span>
        <input
          value={cfg.headline}
          maxLength={MAX_HEADLINE}
          onChange={(e) => set("headline", e.target.value)}
        />
      </label>

      <ChipGroup
        label="Font"
        options={FONTS}
        value={cfg.font}
        onChange={(v) => set("font", v)}
      />
      <ChipGroup
        label="Headline case"
        options={CASES}
        value={cfg.caps}
        onChange={(v) => set("caps", v)}
      />
      <ChipGroup
        label="Frame"
        options={FRAMES}
        value={cfg.frame}
        onChange={(v) => set("frame", v)}
      />

      <ColorPicker
        label="Accent"
        value={cfg.accentColor}
        colors={COLORS}
        onChange={(v) => set("accentColor", v)}
      />
      <ColorPicker
        label="Background"
        value={cfg.bgColor}
        colors={BG_COLORS}
        onChange={(v) => set("bgColor", v)}
      />
      <ColorPicker
        label="Text"
        value={cfg.textColor}
        colors={TEXT_COLORS}
        onChange={(v) => set("textColor", v)}
      />

      <span className="muted">Stickers</span>
      <div className="chip-row" style={{ margin: "6px 0 12px" }}>
        <button
          className={`chip ${!cfg.sticker ? "on" : ""}`}
          onClick={() => set("sticker", "")}
        >
          None
        </button>
        {STICKERS.map((s) => (
          <button
            key={s}
            className={`chip ${cfg.sticker === s ? "on" : ""}`}
            onClick={() => set("sticker", s)}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="switch card" style={{ marginBottom: 8 }}>
        <span>Show price</span>
        <input
          type="checkbox"
          checked={cfg.showPrice}
          onChange={(e) => set("showPrice", e.target.checked)}
        />
      </label>
      <label className="switch card" style={{ marginBottom: 8 }}>
        <span>Show contact / branding</span>
        <input
          type="checkbox"
          checked={cfg.showContact}
          onChange={(e) => set("showContact", e.target.checked)}
        />
      </label>
      <label className="switch card" style={{ marginBottom: 12 }}>
        <span>Show logo</span>
        <input
          type="checkbox"
          checked={cfg.showLogo}
          onChange={(e) => set("showLogo", e.target.checked)}
        />
      </label>

      <button className="btn ghost sm" type="button" onClick={resetDesign}>
        Reset design
      </button>

      <h2 className="section-title">{t(lang, "caption")}</h2>
      <div className="chip-row">
        {captions.map((c) => (
          <button
            key={c.id}
            className={`chip ${captionKind === c.id ? "on" : ""}`}
            onClick={() => setCaptionKind(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <textarea
        className="caption-box caption-edit"
        value={caption}
        onChange={(e) =>
          setEdits((d) => ({ ...d, [captionKey]: e.target.value }))
        }
        aria-label="Caption (editable)"
        rows={6}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button
          className="btn ghost"
          style={{ flex: 1 }}
          type="button"
          onClick={copy}
        >
          {t(lang, "copy")}
        </button>
        {captionEdited ? (
          <button
            className="btn ghost"
            type="button"
            onClick={() =>
              setEdits((d) => {
                const next = { ...d };
                delete next[captionKey];
                return next;
              })
            }
          >
            Undo edits
          </button>
        ) : null}
      </div>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <button
          className="btn ghost"
          disabled={busy}
          onClick={() => finish(false)}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => finish(true)}
        >
          {t(lang, "share")}
        </button>
      </div>
    </div>
  );
}
