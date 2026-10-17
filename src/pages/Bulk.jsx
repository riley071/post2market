import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { TEMPLATES } from "../lib/data.js";
import { exportPosterDataUrl } from "../lib/poster.js";
import { generateCaptions } from "../lib/captions.js";
import { t } from "../lib/i18n.js";

export default function Bulk() {
  const { data, savePoster, notify } = useStore();
  const nav = useNavigate();
  const lang = data.language || "en";
  const products = data.products || [];
  const [ids, setIds] = useState(() => new Set(products.map((p) => p.id)));
  const [templateId, setTemplateId] = useState("showcase");
  const [format, setFormat] = useState("post");
  const [busy, setBusy] = useState(false);
  const template = TEMPLATES.find((t) => t.id === templateId);

  const toggle = (id) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = async () => {
    if (template?.premium && !data.premium) return notify("Unlock Premium for this template");
    setBusy(true);
    try {
      const chosen = products.filter((p) => ids.has(p.id));
      for (const product of chosen) {
        const cfg = {
          format,
          templateId,
          headline: product.name,
          font: "sans",
          product,
          profile: data.profile,
          watermark: !data.premium,
          showPrice: true,
          showContact: true,
          showLogo: true,
        };
        const image = await exportPosterDataUrl(cfg);
        savePoster({
          id: crypto.randomUUID(),
          productId: product.id,
          category: product.category,
          format,
          templateId,
          headline: product.name,
          caption: generateCaptions(product, data.profile || {})[0].text,
          image,
          createdAt: Date.now(),
        });
      }
      notify(`${ids.size} posters ready`);
      nav("/gallery");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>{t(lang, "bulk")}</h1>
      <p>Generate a daily set of posters from your library.</p>
      <div className="chip-row" style={{ margin: "12px 0" }}>
        {TEMPLATES.map((tpl) => (
          <button key={tpl.id} className={`chip ${templateId === tpl.id ? "on" : ""}`} onClick={() => setTemplateId(tpl.id)}>
            {tpl.name}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className={`chip ${format === "status" ? "on" : ""}`} onClick={() => setFormat("status")}>
          Status
        </button>
        <button className={`chip ${format === "post" ? "on" : ""}`} onClick={() => setFormat("post")}>
          Square
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        {products.map((p) => (
          <label key={p.id} className="card check-row" style={{ marginBottom: 8 }}>
            <input type="checkbox" checked={ids.has(p.id)} onChange={() => toggle(p.id)} />
            <img className="thumb" src={p.image} alt="" />
            <b>{p.name}</b>
          </label>
        ))}
      </div>
      <button className="btn primary full" disabled={busy || !ids.size} onClick={run}>
        {busy ? "Generating…" : `Generate ${ids.size} posters`}
      </button>
    </div>
  );
}
