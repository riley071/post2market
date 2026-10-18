import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { generateCaptions } from "../lib/captions.js";
import { t } from "../lib/i18n.js";

// crypto.randomUUID only exists in secure contexts (HTTPS/localhost), so fall back on plain HTTP.
const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const pad = (n) => String(n).padStart(2, "0");
// Value format required by <input type="datetime-local">, in the user's local time.
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const nextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toLocalInput(d);
};

function relative(ms, now) {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  let text;
  if (mins < 1) text = "now";
  else if (mins < 60) text = `${mins} min`;
  else if (mins < 60 * 24) text = `${Math.round(mins / 60)} h`;
  else text = `${Math.round(mins / 1440)} d`;
  if (text === "now") return "now";
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

export default function Schedule() {
  const { data, schedulePost, deleteScheduled, updateScheduled, notify } =
    useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const scheduled = data.scheduled || [];

  const [productId, setProductId] = useState("");
  const [when, setWhen] = useState(nextHour);
  const [captionKind, setCaptionKind] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Keep "Due" labels fresh while the page is open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const product = products.find((p) => p.id === productId) || products[0];
  const captions = useMemo(
    () => (product ? generateCaptions(product, data.profile || {}) : []),
    [product, data.profile],
  );
  const activeCaption =
    captions.find((c) => c.id === captionKind) || captions[1] || captions[0];

  const groups = useMemo(() => {
    const ts = (s) => new Date(s.when).getTime();
    const open = scheduled.filter((s) => s.status !== "shared");
    return {
      due: open.filter((s) => ts(s) <= now).sort((a, b) => ts(a) - ts(b)),
      upcoming: open.filter((s) => ts(s) > now).sort((a, b) => ts(a) - ts(b)),
      shared: scheduled
        .filter((s) => s.status === "shared")
        .sort((a, b) => ts(b) - ts(a)),
    };
  }, [scheduled, now]);

  const add = (e) => {
    e.preventDefault();
    if (!product || !activeCaption) return;
    const date = new Date(when);
    if (!when || Number.isNaN(date.getTime()))
      return notify("Choose a date and time");
    if (date.getTime() < Date.now() - 60000)
      return notify("Choose a time in the future");
    schedulePost({
      id: uid(),
      productId: product.id,
      when: date.toISOString(),
      caption: activeCaption.text,
      status: "planned",
    });
    notify(`Scheduled for ${date.toLocaleString()}`);
    setWhen(nextHour());
  };

  const copy = async (s) => {
    try {
      await navigator.clipboard.writeText(s.caption);
      updateScheduled(s.id, { status: "shared" });
      notify("Caption copied and marked as shared");
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.");
    }
  };

  const openWhatsApp = (s) => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(s.caption)}`,
      "_blank",
      "noopener",
    );
    updateScheduled(s.id, { status: "shared" });
  };

  const renderItem = (s) => {
    const p = products.find((x) => x.id === s.productId);
    const ms = new Date(s.when).getTime();
    const isShared = s.status === "shared";
    const isDue = !isShared && ms <= now;
    return (
      <div key={s.id} className="card" style={{ marginBottom: 10 }}>
        <div className="list-item">
          <div style={{ minWidth: 0 }}>
            <b>{p?.name || "Product removed"}</b>
            <div className="muted">
              {new Date(s.when).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {isShared ? "" : ` · ${relative(ms, now)}`}
            </div>
          </div>
          <span className={`pill ${isDue ? "due" : isShared ? "done" : ""}`}>
            {isDue ? "Due" : isShared ? "Shared" : "Planned"}
          </span>
        </div>
        <pre className="caption-box" style={{ marginTop: 8 }}>
          {s.caption}
        </pre>
        <div className="row" style={{ marginTop: 8 }}>
          {!isShared ? (
            <>
              <button className="btn sm primary" onClick={() => copy(s)}>
                Copy & mark shared
              </button>
              <button className="btn sm green" onClick={() => openWhatsApp(s)}>
                WhatsApp
              </button>
              {p ? (
                <Link className="btn sm ghost" to={`/design?product=${p.id}`}>
                  Design poster
                </Link>
              ) : null}
            </>
          ) : (
            <button
              className="btn sm ghost"
              onClick={() => updateScheduled(s.id, { status: "planned" })}
            >
              Move back to planned
            </button>
          )}
          <button
            className="btn sm ghost"
            style={{ color: "var(--danger)" }}
            onClick={() => {
              deleteScheduled(s.id);
              notify("Removed from schedule");
            }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <h1>{t(lang, "schedule")}</h1>
      <p>
        Plan campaign posts. When one is due, copy it or open WhatsApp from
        here. Posts are not sent automatically.
      </p>

      {!products.length ? (
        <div className="empty">
          <p>Add a product first, then you can schedule posts for it.</p>
          <Link
            className="btn primary"
            to="/products/new"
            style={{ marginTop: 12 }}
          >
            {t(lang, "addProduct")}
          </Link>
        </div>
      ) : (
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <label className="field">
            <span>Product</span>
            <select
              value={product?.id || ""}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>When</span>
            <input
              type="datetime-local"
              value={when}
              min={toLocalInput(new Date())}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </label>

          <span className="muted">Caption style</span>
          <div className="chip-row" style={{ margin: "6px 0 8px" }}>
            {captions.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${activeCaption?.id === c.id ? "on" : ""}`}
                aria-pressed={activeCaption?.id === c.id}
                onClick={() => setCaptionKind(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {activeCaption ? (
            <pre className="caption-box" style={{ marginBottom: 12 }}>
              {activeCaption.text}
            </pre>
          ) : null}

          <button className="btn primary full" type="submit">
            Schedule
          </button>
        </form>
      )}

      {groups.due.length ? (
        <>
          <h2 className="section-title">Due now ({groups.due.length})</h2>
          {groups.due.map(renderItem)}
        </>
      ) : null}

      <h2 className="section-title">Upcoming</h2>
      {groups.upcoming.map(renderItem)}
      {!groups.upcoming.length ? (
        <p className="empty">No upcoming posts.</p>
      ) : null}

      {groups.shared.length ? (
        <>
          <h2 className="section-title">Shared</h2>
          {groups.shared.map(renderItem)}
        </>
      ) : null}
    </div>
  );
}
