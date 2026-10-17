import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

export default function Home() {
  const { data, user, categories } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const posters = data.posters || [];
  const biz = data.profile?.businessName || user?.name || "Seller";

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="eyebrow">{t(lang, "app")}</div>
          <div className="brand">{biz}</div>
        </div>
        <span className="pill">{data.premium ? t(lang, "premium") : t(lang, "free")}</span>
      </div>

      <div className="hero">
        <div className="eyebrow">WORKFLOW</div>
        <h1 style={{ color: "#fff8f1", marginTop: 8 }}>{t(lang, "createPost")}</h1>
        <p>{t(lang, "twenty")}</p>
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn primary" to="/design">
            {t(lang, "design")}
          </Link>
          <Link className="btn ghost" to="/products/new" style={{ color: "#fff", borderColor: "#ffffff44" }}>
            {t(lang, "addProduct")}
          </Link>
        </div>
        <div className="hero-mark">P2M</div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card stat">
          <span className="muted">{t(lang, "products")}</span>
          <b>{products.length}</b>
        </div>
        <div className="card stat">
          <span className="muted">{t(lang, "gallery")}</span>
          <b>{posters.length}</b>
        </div>
      </div>

      <h2 className="section-title">Quick actions</h2>
      <div className="more-grid">
        <Link className="more-tile" to="/products">
          <b>{t(lang, "library")}</b>
          <span className="muted">Search, edit, restock</span>
        </Link>
        <Link className="more-tile" to="/groups">
          <b>{t(lang, "groups")}</b>
          <span className="muted">WhatsApp group messages</span>
        </Link>
        <Link className="more-tile" to="/bulk">
          <b>{t(lang, "bulk")}</b>
          <span className="muted">Many posters at once</span>
        </Link>
        <Link className="more-tile" to="/schedule">
          <b>{t(lang, "schedule")}</b>
          <span className="muted">Plan later posts</span>
        </Link>
        <Link className="more-tile" to="/analytics">
          <b>{t(lang, "analytics")}</b>
          <span className="muted">What you posted most</span>
        </Link>
        <Link className="more-tile" to="/profile">
          <b>{t(lang, "business")}</b>
          <span className="muted">Logo, WhatsApp, branding</span>
        </Link>
      </div>

      <h2 className="section-title">Recent products</h2>
      {products.slice(0, 4).map((p) => {
        const cat = categories.find((c) => c.id === p.category);
        return (
          <Link key={p.id} to={`/design?product=${p.id}`} className="card product-card" style={{ marginBottom: 10, textDecoration: "none" }}>
            <img className="thumb" src={p.image} alt="" />
            <div style={{ flex: 1 }}>
              <b>{p.name}</b>
              <div className="muted">{cat?.emoji} {cat?.name}</div>
              <div className="price">TSh {Number(p.discountPrice || p.price).toLocaleString()}</div>
            </div>
          </Link>
        );
      })}
      {!products.length ? <p className="empty">{t(lang, "emptyProducts")}</p> : null}
    </div>
  );
}
