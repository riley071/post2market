import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

function greeting(lang) {
  const h = new Date().getHours();
  if (lang === "sw") {
    if (h < 12) return "Habari za asubuhi";
    if (h < 17) return "Habari za mchana";
    return "Habari za jioni";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  {
    to: "/products",
    icon: "📦",
    key: "library",
    hint: "Search, edit, restock",
  },
  { to: "/groups", icon: "💬", key: "groups", hint: "WhatsApp group messages" },
  { to: "/bulk", icon: "🗂️", key: "bulk", hint: "Many posters at once" },
  { to: "/schedule", icon: "🗓️", key: "schedule", hint: "Plan later posts" },
  {
    to: "/analytics",
    icon: "📈",
    key: "analytics",
    hint: "What you posted most",
  },
  {
    to: "/profile",
    icon: "🏪",
    key: "business",
    hint: "Logo, WhatsApp, branding",
  },
];

export default function Home() {
  const { data, user, categories } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const posters = data.posters || [];
  const biz = data.profile?.businessName || user?.name || "Seller";

  // Getting-started checklist, derived from data we already have.
  const steps = useMemo(
    () => [
      {
        label: "Add your business name",
        to: "/profile",
        done: Boolean(data.profile?.businessName),
      },
      {
        label: "Add your first product",
        to: "/products/new",
        done: products.length > 0,
      },
      {
        label: "Design your first poster",
        to: "/design",
        done: posters.length > 0,
      },
    ],
    [data.profile?.businessName, products.length, posters.length],
  );
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  const recent = products.slice(0, 4);

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="eyebrow">{greeting(lang)}</div>
          <div className="brand">{biz}</div>
        </div>
        <span className={`pill ${data.premium ? "premium" : ""}`}>
          {data.premium ? t(lang, "premium") : t(lang, "free")}
        </span>
      </div>

      <div className="hero">
        <div className="eyebrow">WORKFLOW</div>
        <h1>{t(lang, "createPost")}</h1>
        <p>{t(lang, "twenty")}</p>
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn primary" to="/design">
            {t(lang, "design")}
          </Link>
          <Link className="btn ghost" to="/products/new">
            {t(lang, "addProduct")}
          </Link>
        </div>
        <div className="hero-mark" aria-hidden="true">
          P2M
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <Link
          to="/products"
          className="card stat"
          style={{ textDecoration: "none" }}
        >
          <span className="muted">{t(lang, "products")}</span>
          <b>{products.length}</b>
        </Link>
        <Link
          to="/gallery"
          className="card stat"
          style={{ textDecoration: "none" }}
        >
          <span className="muted">{t(lang, "gallery")}</span>
          <b>{posters.length}</b>
        </Link>
      </div>

      {!allDone ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="list-item">
            <b>Get started</b>
            <span className="muted">
              {doneCount}/{steps.length}
            </span>
          </div>
          <div
            className="bar"
            style={{ marginTop: 10 }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={doneCount}
          >
            <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <div className="steps">
            {steps.map((s) => (
              <Link
                key={s.label}
                to={s.to}
                className={`step ${s.done ? "done" : ""}`}
              >
                <span className="step-dot" aria-hidden="true">
                  {s.done ? "✓" : ""}
                </span>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="section-title">Quick actions</h2>
      <div className="more-grid">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.to} className="more-tile" to={a.to}>
            <span className="tile-icon" aria-hidden="true">
              {a.icon}
            </span>
            <b>{t(lang, a.key)}</b>
            <span className="muted">{a.hint}</span>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2 className="section-title">Recent products</h2>
        {products.length > 4 ? (
          <Link className="link-more" to="/products">
            See all
          </Link>
        ) : null}
      </div>

      {recent.map((p) => {
        const cat = categories.find((c) => c.id === p.category);
        const price = Number(p.discountPrice || p.price) || 0;
        return (
          <Link
            key={p.id}
            to={`/design?product=${p.id}`}
            className="card product-card"
            style={{ marginBottom: 10 }}
          >
            <img
              className="thumb"
              src={p.image}
              alt={p.name || ""}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.removeAttribute("src");
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{p.name}</b>
              <div className="muted">
                {cat?.emoji} {cat?.name}
              </div>
              <div className="price">TSh {price.toLocaleString()}</div>
            </div>
            <span className="muted" aria-hidden="true">
              ›
            </span>
          </Link>
        );
      })}
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
      ) : null}
    </div>
  );
}
