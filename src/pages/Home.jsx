import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, CalendarDays, Check, ChevronRight, Images, Layers, MessagesSquare, Package, Plus, Sparkles, Store } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

const ACTIONS = [
  { to: "/products", icon: <Package aria-hidden="true" />, key: "library", hint: "All your items, in one place" },
  { to: "/groups", icon: <MessagesSquare aria-hidden="true" />, key: "groups", hint: "Prepare WhatsApp messages" },
  { to: "/bulk", icon: <Layers aria-hidden="true" />, key: "bulk", hint: "Create more in one go" },
  { to: "/schedule", icon: <CalendarDays aria-hidden="true" />, key: "schedule", hint: "Plan your next posts" },
  { to: "/analytics", icon: <BarChart3 aria-hidden="true" />, key: "analytics", hint: "See your posting activity" },
  { to: "/profile", icon: <Store aria-hidden="true" />, key: "business", hint: "Your logo & contact details" },
];

function greeting(lang) {
  const hour = new Date().getHours();
  if (lang === "sw") return hour < 12 ? "Habari za asubuhi" : hour < 17 ? "Habari za mchana" : "Habari za jioni";
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const kwacha = new Intl.NumberFormat("en-MW", { maximumFractionDigits: 2 });

export default function Home() {
  const { data, user, categories } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const posters = data.posters || [];
  const biz = data.profile?.businessName || user?.name || "Seller";
  const steps = [
    { label: "Add your business name", to: "/profile", done: Boolean(data.profile?.businessName) },
    { label: "Add your first product", to: "/products/new", done: products.length > 0 },
    { label: "Design your first poster", to: "/design", done: posters.length > 0 },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <div className="page dashboard">
      <header className="topbar dashboard-header">
        <div className="dashboard-heading">
          <div className="dashboard-greeting">{greeting(lang)}</div>
          <div className="brand">{biz}</div>
        </div>
        <span className={`dashboard-plan ${data.premium ? "is-premium" : ""}`}>
          <span aria-hidden="true" />{data.premium ? t(lang, "premium") : "Free plan"}
        </span>
      </header>

      <section className="dashboard-hero" aria-labelledby="create-heading">
        <div className="hero-kicker"><Sparkles aria-hidden="true" /> MADE FOR YOUR BUSINESS</div>
        <h1 id="create-heading">{t(lang, "createPost")}<span>Make it stand out.</span></h1>
        <p>Turn your products into beautiful posts.<br />Ready for WhatsApp, Facebook & more.</p>
        <div className="dashboard-hero-actions">
          <Link className="btn primary" to="/design"><Sparkles aria-hidden="true" />{t(lang, "design")}</Link>
          <Link className="btn hero-secondary" to="/products/new"><Plus aria-hidden="true" />{t(lang, "addProduct")}</Link>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Your library at a glance">
        {[{ to: "/products", icon: <Package aria-hidden="true" />, label: t(lang, "products"), count: products.length, hint: "In your library" },
          { to: "/gallery", icon: <Images aria-hidden="true" />, label: t(lang, "gallery"), count: posters.length, hint: "Saved posters" }].map(({ to, icon, label, count, hint }) => (
          <Link to={to} className="dashboard-stat" key={to}>
            <div className="stat-heading">{icon}<span>{label}</span><ArrowUpRight aria-hidden="true" /></div>
            <strong>{count}</strong><span className="stat-caption">{hint}</span>
          </Link>
        ))}
      </section>

      {doneCount < steps.length && (
        <section className="card dashboard-onboarding" aria-label="Getting started">
          <div className="list-item"><b>A little setup. A great first post.</b><span className="muted">{doneCount}/3</span></div>
          <div className="steps">{steps.map((step) => (
            <Link key={step.to} to={step.to} className={`step ${step.done ? "done" : ""}`}>
              <span className="step-dot" aria-hidden="true">{step.done && <Check size={14} />}</span>{step.label}
            </Link>
          ))}</div>
        </section>
      )}

      <section aria-labelledby="actions-heading" className="dashboard-section">
        <div className="dashboard-section-head"><h2 id="actions-heading">Quick actions</h2><span>Less work. More selling.</span></div>
        <div className="dashboard-actions">
          {ACTIONS.map(({ to, icon, key, hint }) => (
            <Link className="dashboard-action" to={to} key={to}>
              <span className="action-icon">{icon}</span>
              <b>{t(lang, key)}</b><span>{hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="dashboard-section">
        <div className="dashboard-section-head"><h2 id="recent-heading">Recent products</h2>
          {products.length > 0 && <Link className="link-more" to="/products">View all <ArrowUpRight size={16} aria-hidden="true" /></Link>}
        </div>
        <div className="dashboard-products">
          {products.slice(0, 4).map((product) => {
            const category = categories.find((item) => item.id === product.category);
            const price = Number(product.discountPrice || product.price) || 0;
            return (
              <Link key={product.id} to={`/design?product=${encodeURIComponent(product.id)}`} className="dashboard-product">
                <div className="dashboard-product-image"><Package aria-hidden="true" />{product.image && <img src={product.image} alt="" loading="lazy" width="64" height="72" onError={(event) => { event.currentTarget.hidden = true; }} />}</div>
                <div className="dashboard-product-copy"><b>{product.name}</b>{category && <span className="dashboard-category">{category.name}</span>}<span className="dashboard-price">MK {kwacha.format(price)}</span></div>
                <ChevronRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
        {!products.length && <div className="card dashboard-empty"><Package aria-hidden="true" /><b>Your next sale starts here</b><p>{t(lang, "emptyProducts")}</p><Link className="btn primary" to="/products/new"><Plus aria-hidden="true" />{t(lang, "addProduct")}</Link></div>}
      </section>
      <p className="dashboard-footer">Made for your everyday hustle.</p>
    </div>
  );
}
