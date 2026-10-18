import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { TEMPLATES } from "../lib/data.js";
import { exportPosterDataUrl } from "../lib/poster.js";
import { generateCaptions } from "../lib/captions.js";
import { t } from "../lib/i18n.js";

// crypto.randomUUID only exists in secure contexts (HTTPS/localhost), so fall back on plain HTTP.
const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function Bulk() {
  const { data, savePoster, notify } = useStore();
  const nav = useNavigate();
  const lang = data.language || "en";
  const products = data.products || [];
  const premium = data.premium;
  const [ids, setIds] = useState(() => new Set(products.map((p) => p.id)));
  const [templateId, setTemplateId] = useState("showcase");
  const [format, setFormat] = useState("post");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const template = TEMPLATES.find((x) => x.id === templateId);
  const selectedCount = products.filter((p) => ids.has(p.id)).length;
  const allSelected = products.length > 0 && selectedCount === products.length;

  const toggle = (id) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickTemplate = (tpl) => {
    if (tpl.premium && !premium)
      return notify("Unlock Premium for this template");
    setTemplateId(tpl.id);
    if (tpl.kind === "status") setFormat("status");
  };

  const run = async () => {
    if (busy) return;
    if (template?.premium && !premium)
      return notify("Unlock Premium for this template");
    const chosen = products.filter((p) => ids.has(p.id));
    if (!chosen.length) return;

    cancelRef.current = false;
    setBusy(true);
    setProgress({ done: 0, total: chosen.length });
    let done = 0;
    try {
      for (const product of chosen) {
        if (cancelRef.current) break;
        const image = await exportPosterDataUrl({
          format,
          templateId,
          headline: product.name,
          font: "auto",
          product,
          profile: data.profile,
          watermark: !premium,
          showPrice: true,
          showContact: true,
          showLogo: true,
        });
        savePoster({
          id: uid(),
          productId: product.id,
          category: product.category,
          format,
          templateId,
          headline: product.name,
          caption: generateCaptions(product, data.profile || {})[0]?.text || "",
          image,
          createdAt: Date.now(),
        });
        done += 1;
        setProgress({ done, total: chosen.length });
        await new Promise((r) => setTimeout(r, 0)); // let the progress bar repaint
      }
      if (done) {
        notify(
          cancelRef.current
            ? `Stopped after ${done} of ${chosen.length}`
            : `${done} posters ready`,
        );
        nav("/gallery");
      } else {
        notify("Cancelled");
      }
    } catch {
      notify(
        `Stopped after ${done} of ${chosen.length}. Storage may be full: delete old posters and try again.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>{t(lang, "bulk")}</h1>
      <p>Generate a daily set of posters from your library.</p>

      {!products.length ? (
        <div className="empty">
          <p>{t(lang, "emptyProducts")}</p>
          <Link
            className="btn primary"
            to="/products/new"
            style={{ marginTop: 12 }}
          >
            {t(lang, "addProduct")}
          </Link>
        </div>
      ) : (
        <>
          <span className="muted">Template</span>
          <div className="chip-row" style={{ margin: "6px 0 12px" }}>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`chip ${templateId === tpl.id ? "on" : ""}`}
                aria-pressed={templateId === tpl.id}
                disabled={busy}
                onClick={() => pickTemplate(tpl)}
              >
                {tpl.name}{" "}
                {tpl.premium && !premium ? (
                  <span className="lock">PREMIUM</span>
                ) : null}
              </button>
            ))}
          </div>

          <span className="muted">Format</span>
          <div className="chip-row" style={{ margin: "6px 0" }}>
            <button
              className={`chip ${format === "status" ? "on" : ""}`}
              disabled={busy}
              onClick={() => setFormat("status")}
            >
              Status 9:16
            </button>
            <button
              className={`chip ${format === "post" ? "on" : ""}`}
              disabled={busy}
              onClick={() => setFormat("post")}
            >
              Square 1:1
            </button>
          </div>

          <div className="section-head">
            <h2 className="section-title">
              Products ({selectedCount}/{products.length})
            </h2>
            <button
              className="link-more link-btn"
              disabled={busy}
              onClick={() =>
                setIds(
                  allSelected ? new Set() : new Set(products.map((p) => p.id)),
                )
              }
            >
              {allSelected ? "Select none" : "Select all"}
            </button>
          </div>

          {products.map((p) => (
            <label
              key={p.id}
              className="card check-row"
              style={{ marginBottom: 8, alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={ids.has(p.id)}
                disabled={busy}
                onChange={() => toggle(p.id)}
              />
              <img
                className="thumb"
                src={p.image}
                alt=""
                loading="lazy"
                onError={(e) => e.currentTarget.removeAttribute("src")}
              />
              <b>{p.name}</b>
            </label>
          ))}

          {busy ? (
            <div
              className="card"
              style={{ margin: "12px 0" }}
              role="status"
              aria-live="polite"
            >
              <div className="list-item">
                <b>Generating…</b>
                <span className="muted">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="bar" style={{ marginTop: 10 }}>
                <span
                  style={{
                    width: `${(progress.done / Math.max(1, progress.total)) * 100}%`,
                  }}
                />
              </div>
              <button
                className="btn sm ghost"
                style={{ marginTop: 10 }}
                onClick={() => (cancelRef.current = true)}
              >
                Stop after this poster
              </button>
            </div>
          ) : null}

          <button
            className="btn primary full"
            style={{ marginTop: 8 }}
            disabled={busy || !selectedCount}
            onClick={run}
          >
            {busy
              ? "Generating…"
              : `Generate ${selectedCount} poster${selectedCount === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}
