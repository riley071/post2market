import { useMemo } from "react";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

const VIA_LABELS = {
  whatsapp: "WhatsApp",
  native: "Share sheet",
  download: "Download",
  groups: "Group helper",
};

// Event timestamps may be stored under different names; use whichever is a valid date.
const eventDate = (e) => {
  const v = e.at ?? e.createdAt ?? e.time ?? e.ts ?? e.date;
  if (v == null) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

function BarRow({ label, value, max }) {
  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div className="list-item">
        <b>{label}</b>
        <span>{value}</span>
      </div>
      <div className="bar" style={{ marginTop: 8 }}>
        <span style={{ width: `${(value / Math.max(1, max)) * 100}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data, categories } = useStore();
  const lang = data.language || "en";
  const events = data.events || [];
  const posters = data.posters || [];
  const products = data.products || [];
  const scheduled = data.scheduled || [];

  const stats = useMemo(() => {
    const count = (type) => events.filter((e) => e.type === type).length;

    const byCat = {};
    events
      .filter((e) => e.type === "poster" && e.meta?.category)
      .forEach((e) => {
        byCat[e.meta.category] = (byCat[e.meta.category] || 0) + 1;
      });

    const byVia = {};
    events
      .filter((e) => e.type === "share")
      .forEach((e) => {
        const via = e.meta?.via || e.via;
        if (via) byVia[via] = (byVia[via] || 0) + 1;
      });

    const byProduct = {};
    posters.forEach((p) => {
      byProduct[p.productId] = (byProduct[p.productId] || 0) + 1;
    });
    const topProducts = Object.entries(byProduct)
      .map(([id, n]) => ({
        id,
        n,
        name: products.find((p) => p.id === id)?.name || "Removed product",
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);

    // Activity over the last 7 days, when events carry a usable date.
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return {
        key: d.toDateString(),
        label: d.toLocaleDateString([], { weekday: "short" }),
        n: 0,
      };
    });
    let dated = 0;
    events.forEach((e) => {
      const d = eventDate(e);
      if (!d) return;
      const day = days.find((x) => x.key === d.toDateString());
      if (day) {
        day.n += 1;
        dated += 1;
      }
    });

    const cats = categories
      .map((c) => ({ ...c, n: byCat[c.id] || 0 }))
      .sort((a, b) => b.n - a.n);

    return {
      posters: count("poster"),
      shares: count("share"),
      products: count("product"),
      cats,
      catMax: Math.max(1, ...cats.map((c) => c.n)),
      vias: Object.entries(byVia).sort((a, b) => b[1] - a[1]),
      topProducts,
      days,
      dated,
      dayMax: Math.max(1, ...days.map((d) => d.n)),
    };
  }, [events, posters, products, categories]);

  const duePending = scheduled.filter(
    (s) => s.status !== "shared" && new Date(s.when).getTime() <= Date.now(),
  ).length;

  return (
    <div className="page">
      <h1>{t(lang, "analytics")}</h1>
      <p>
        Activity recorded in this app on this device. It does not include likes
        or views on social platforms.
      </p>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card stat">
          <span className="muted">Posters made</span>
          <b>{stats.posters}</b>
        </div>
        <div className="card stat">
          <span className="muted">Shares</span>
          <b>{stats.shares}</b>
        </div>
        <div className="card stat">
          <span className="muted">Products added</span>
          <b>{stats.products}</b>
        </div>
        <div className="card stat">
          <span className="muted">Scheduled</span>
          <b>{scheduled.length}</b>
          {duePending ? (
            <span className="pill due">{duePending} due</span>
          ) : null}
        </div>
      </div>

      {!events.length ? (
        <p className="empty">
          Nothing recorded yet. Make and share a poster and your activity will
          show up here.
        </p>
      ) : null}

      {stats.dated ? (
        <>
          <h2 className="section-title">Last 7 days</h2>
          <div className="card">
            <div
              className="spark"
              role="img"
              aria-label="Activity over the last 7 days"
            >
              {stats.days.map((d) => (
                <div key={d.key} className="spark-col">
                  <div
                    className="spark-bar"
                    style={{
                      height: `${Math.max(4, (d.n / stats.dayMax) * 100)}%`,
                    }}
                    title={`${d.n}`}
                  />
                  <span className="muted">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {stats.topProducts.length ? (
        <>
          <h2 className="section-title">Most-posted products</h2>
          {stats.topProducts.map((p) => (
            <BarRow
              key={p.id}
              label={p.name}
              value={p.n}
              max={stats.topProducts[0].n}
            />
          ))}
        </>
      ) : null}

      {stats.vias.length ? (
        <>
          <h2 className="section-title">How you share</h2>
          {stats.vias.map(([via, n]) => (
            <BarRow
              key={via}
              label={VIA_LABELS[via] || via}
              value={n}
              max={stats.vias[0][1]}
            />
          ))}
        </>
      ) : null}

      <h2 className="section-title">Popular categories</h2>
      {stats.cats.map((c) => (
        <BarRow
          key={c.id}
          label={`${c.emoji} ${c.name}`}
          value={c.n}
          max={stats.catMax}
        />
      ))}
    </div>
  );
}
