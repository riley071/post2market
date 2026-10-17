import { useMemo } from "react";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

export default function Analytics() {
  const { data, categories } = useStore();
  const lang = data.language || "en";
  const events = data.events || [];

  const stats = useMemo(() => {
    const posters = events.filter((e) => e.type === "poster").length;
    const shares = events.filter((e) => e.type === "share").length;
    const products = events.filter((e) => e.type === "product").length;
    const byCat = {};
    events
      .filter((e) => e.type === "poster" && e.meta?.category)
      .forEach((e) => {
        byCat[e.meta.category] = (byCat[e.meta.category] || 0) + 1;
      });
    const max = Math.max(1, ...Object.values(byCat), 1);
    return { posters, shares, products, byCat, max };
  }, [events]);

  return (
    <div className="page">
      <h1>{t(lang, "analytics")}</h1>
      <p>Local activity on this device.</p>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card stat">
          <span className="muted">Posters</span>
          <b>{stats.posters}</b>
        </div>
        <div className="card stat">
          <span className="muted">Shares</span>
          <b>{stats.shares}</b>
        </div>
        <div className="card stat">
          <span className="muted">Products</span>
          <b>{stats.products}</b>
        </div>
        <div className="card stat">
          <span className="muted">Scheduled</span>
          <b>{(data.scheduled || []).length}</b>
        </div>
      </div>
      <h2 className="section-title">Popular categories</h2>
      {categories.map((c) => {
        const n = stats.byCat[c.id] || 0;
        return (
          <div key={c.id} className="card" style={{ marginBottom: 8 }}>
            <div className="list-item">
              <b>
                {c.emoji} {c.name}
              </b>
              <span>{n}</span>
            </div>
            <div className="bar" style={{ marginTop: 8 }}>
              <span style={{ width: `${(n / stats.max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
