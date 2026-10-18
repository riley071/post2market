import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

const SORTS = [
  { id: "saved", label: "As saved" },
  { id: "name", label: "Name A–Z" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
];

const priceOf = (p) => Number(p.discountPrice || p.price) || 0;

export default function Products() {
  const { data, categories, addCategory } = useStore();
  const lang = data.language || "en";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("saved");
  const [newCat, setNewCat] = useState("");

  const all = data.products || [];

  const counts = useMemo(() => {
    const m = {};
    all.forEach((p) => {
      m[p.category] = (m[p.category] || 0) + 1;
    });
    return m;
  }, [all]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = all.filter((p) => {
      const hit =
        !term ||
        (p.name || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term);
      const ok = cat === "all" || p.category === cat;
      return hit && ok;
    });
    if (sort === "name")
      out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "low") out.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "high") out.sort((a, b) => priceOf(b) - priceOf(a));
    return out;
  }, [all, q, cat, sort]);

  const filtered = q.trim() !== "" || cat !== "all";
  const clearFilters = () => {
    setQ("");
    setCat("all");
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>{t(lang, "library")}</h1>
          <div className="muted">
            {filtered ? `${list.length} of ${all.length}` : all.length}{" "}
            {all.length === 1 ? "product" : "products"}
          </div>
        </div>
        <Link className="btn sm primary" to="/products/new">
          {t(lang, "addProduct")}
        </Link>
      </div>

      <label className="field search-field">
        <span>{t(lang, "search")}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Earbuds, dress…"
        />
        {q ? (
          <button
            type="button"
            className="clear-btn"
            onClick={() => setQ("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </label>

      <div className="chip-row" role="group" aria-label="Filter by category">
        <button
          className={`chip ${cat === "all" ? "on" : ""}`}
          onClick={() => setCat("all")}
          aria-pressed={cat === "all"}
        >
          All ({all.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? "on" : ""}`}
            onClick={() => setCat(c.id)}
            aria-pressed={cat === c.id}
          >
            {c.emoji} {c.name}
            {counts[c.id] ? ` (${counts[c.id]})` : ""}
          </button>
        ))}
      </div>

      <div
        className="row"
        style={{
          margin: "12px 0",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <label className="sort-label">
          <span className="muted">Sort</span>
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {filtered ? (
          <button className="btn sm ghost" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <details className="card details-card" style={{ marginBottom: 14 }}>
        <summary>+ New category</summary>
        <form
          className="row"
          style={{ marginTop: 10, flexWrap: "nowrap" }}
          onSubmit={(e) => {
            e.preventDefault();
            const name = newCat.trim();
            if (!name) return;
            const exists = categories.some(
              (c) => c.name.toLowerCase() === name.toLowerCase(),
            );
            if (!exists) addCategory(name);
            setNewCat("");
          }}
        >
          <input
            className="pill-input"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Custom category"
            aria-label="Custom category name"
          />
          <button
            className="btn sm primary"
            type="submit"
            disabled={!newCat.trim()}
          >
            Add
          </button>
        </form>
      </details>

      {list.map((p) => {
        const c = categories.find((x) => x.id === p.category);
        const onSale =
          p.discountPrice && Number(p.discountPrice) < Number(p.price);
        return (
          <div
            key={p.id}
            className="card product-card"
            style={{ marginBottom: 10 }}
          >
            <img
              className="thumb"
              src={p.image}
              alt={p.name || ""}
              loading="lazy"
              onError={(e) => e.currentTarget.removeAttribute("src")}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{p.name}</b>
              {onSale ? (
                <span className="badge" style={{ marginLeft: 6 }}>
                  Sale
                </span>
              ) : null}
              <div className="muted">{c?.name}</div>
              <div className="price">
                TSh {priceOf(p).toLocaleString()}
                {onSale ? (
                  <span className="old-price">
                    {Number(p.price).toLocaleString()}
                  </span>
                ) : null}
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

      {!list.length ? (
        <div className="empty">
          <p>
            {filtered
              ? "No products match your search."
              : t(lang, "emptyProducts")}
          </p>
          {filtered ? (
            <button
              className="btn ghost"
              style={{ marginTop: 12 }}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : (
            <Link
              className="btn primary"
              style={{ marginTop: 12 }}
              to="/products/new"
            >
              {t(lang, "addProduct")}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
