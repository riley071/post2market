import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

export default function Products() {
  const { data, categories, addCategory } = useStore();
  const lang = data.language || "en";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [newCat, setNewCat] = useState("");

  const list = useMemo(() => {
    return (data.products || []).filter((p) => {
      const hit = !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.description || "").toLowerCase().includes(q.toLowerCase());
      const ok = cat === "all" || p.category === cat;
      return hit && ok;
    });
  }, [data.products, q, cat]);

  return (
    <div className="page">
      <div className="topbar">
        <h1>{t(lang, "library")}</h1>
        <Link className="btn sm primary" to="/products/new">
          {t(lang, "addProduct")}
        </Link>
      </div>
      <label className="field">
        <span>{t(lang, "search")}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Earbuds, dress…" />
      </label>
      <div className="chip-row">
        <button className={`chip ${cat === "all" ? "on" : ""}`} onClick={() => setCat("all")}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <form
        className="row"
        style={{ margin: "10px 0 14px" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newCat.trim()) return;
          addCategory(newCat.trim());
          setNewCat("");
        }}
      >
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Custom category"
          style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 999, padding: "10px 12px" }}
        />
        <button className="btn sm ghost" type="submit">
          Add
        </button>
      </form>
      {list.map((p) => {
        const c = categories.find((x) => x.id === p.category);
        return (
          <div key={p.id} className="card product-card" style={{ marginBottom: 10 }}>
            <img className="thumb" src={p.image} alt="" />
            <div style={{ flex: 1 }}>
              <b>{p.name}</b>
              <div className="muted">
                {c?.name} · TSh {Number(p.discountPrice || p.price).toLocaleString()}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <Link className="btn sm primary" to={`/design?product=${p.id}`}>
                  Post
                </Link>
                <Link className="btn sm ghost" to={`/products/${p.id}`}>
                  Edit
                </Link>
              </div>
            </div>
          </div>
        );
      })}
      {!list.length ? <p className="empty">{t(lang, "emptyProducts")}</p> : null}
    </div>
  );
}
