import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { generateCaptions } from "../lib/captions.js";
import { t } from "../lib/i18n.js";

export default function Schedule() {
  const { data, schedulePost, deleteScheduled, updateScheduled, notify } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [when, setWhen] = useState("");
  const product = products.find((p) => p.id === productId);

  const add = (e) => {
    e.preventDefault();
    if (!product || !when) return;
    schedulePost({
      id: crypto.randomUUID(),
      productId: product.id,
      when: new Date(when).toISOString(),
      caption: generateCaptions(product, data.profile || {})[1].text,
      status: "planned",
    });
  };

  const due = (item) => new Date(item.when).getTime() <= Date.now();

  return (
    <div className="page">
      <h1>{t(lang, "schedule")}</h1>
      <p>Plan campaign posts. When due, copy and share from here.</p>
      <form onSubmit={add} style={{ marginTop: 12 }}>
        <label className="field">
          <span>Product</span>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>When</span>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </label>
        <button className="btn primary full" type="submit">
          Schedule
        </button>
      </form>
      <h2 className="section-title">Upcoming</h2>
      {(data.scheduled || []).map((s) => {
        const p = products.find((x) => x.id === s.productId);
        return (
          <div key={s.id} className="card" style={{ marginBottom: 10 }}>
            <div className="list-item">
              <div>
                <b>{p?.name || "Product"}</b>
                <div className="muted">{new Date(s.when).toLocaleString()}</div>
              </div>
              <span className="pill">{due(s) ? "Due" : s.status}</span>
            </div>
            <pre className="caption-box" style={{ marginTop: 8 }}>
              {s.caption}
            </pre>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn sm primary"
                onClick={() => {
                  navigator.clipboard.writeText(s.caption).then(() => notify("Caption copied"));
                  updateScheduled(s.id, { status: "shared" });
                }}
              >
                Copy & mark shared
              </button>
              <button className="btn sm ghost" onClick={() => deleteScheduled(s.id)}>
                Remove
              </button>
            </div>
          </div>
        );
      })}
      {!(data.scheduled || []).length ? <p className="empty">No scheduled posts yet.</p> : null}
    </div>
  );
}
