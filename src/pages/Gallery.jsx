import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

const slug = (s) =>
  (s || "poster")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "poster";

const extOf = (dataUrl = "") => {
  const m = /^data:image\/(\w+)/.exec(dataUrl);
  return m ? (m[1] === "jpeg" ? "jpg" : m[1]) : "png";
};

export default function Gallery() {
  const { data, deletePoster, notify } = useStore();
  const lang = data.language || "en";
  const posters = data.posters || [];
  const products = data.products || [];
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);

  const nameOf = (p) =>
    products.find((x) => x.id === p.productId)?.name || p.headline || "Poster";

  // Only offer filters for products that actually have posters.
  const filters = useMemo(() => {
    const ids = [...new Set(posters.map((p) => p.productId))];
    return ids.map((id) => ({
      id,
      name: products.find((x) => x.id === id)?.name || "Removed product",
    }));
  }, [posters, products]);

  const list = useMemo(
    () =>
      posters
        .filter((p) => filter === "all" || p.productId === filter)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [posters, filter],
  );

  const remove = (id) => {
    deletePoster(id);
    setConfirmId(null);
    notify("Poster deleted");
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>{t(lang, "gallery")}</h1>
          <div className="muted">
            {posters.length} {posters.length === 1 ? "poster" : "posters"}
          </div>
        </div>
        <Link className="btn sm primary" to="/design">
          + New
        </Link>
      </div>
      <p>Reuse, download, and restock posts.</p>

      {filters.length > 1 ? (
        <div
          className="chip-row"
          style={{ marginTop: 10 }}
          role="group"
          aria-label="Filter by product"
        >
          <button
            className={`chip ${filter === "all" ? "on" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {filters.map((f) => (
            <button
              key={f.id}
              className={`chip ${filter === f.id ? "on" : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {list.map((p) => (
          <div key={p.id} className="card" style={{ padding: 8 }}>
            <img
              className="gallery-img"
              src={p.image}
              alt={`${nameOf(p)} poster`}
              loading="lazy"
            />
            <div className="poster-meta">
              <b>{nameOf(p)}</b>
              {p.createdAt ? (
                <span className="muted">
                  {new Date(p.createdAt).toLocaleDateString([], {
                    day: "numeric",
                    month: "short",
                  })}
                  {p.format === "status" ? " · Status" : " · Square"}
                </span>
              ) : null}
            </div>

            {confirmId === p.id ? (
              <div className="row" style={{ marginTop: 8, flexWrap: "nowrap" }}>
                <button
                  className="btn sm ghost"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmId(null)}
                >
                  Keep
                </button>
                <button
                  className="btn sm danger"
                  style={{ flex: 1 }}
                  onClick={() => remove(p.id)}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="row" style={{ marginTop: 8 }}>
                <Link className="btn sm primary" to={`/share/${p.id}`}>
                  Share
                </Link>
                <Link
                  className="btn sm ghost"
                  to={`/design?poster=${p.id}&product=${p.productId}`}
                >
                  Edit
                </Link>
                <a
                  className="btn sm ghost"
                  href={p.image}
                  download={`${slug(nameOf(p))}.${extOf(p.image)}`}
                  aria-label={`Download ${nameOf(p)} poster`}
                >
                  ⬇
                </a>
                <button
                  className="btn sm ghost"
                  onClick={() => setConfirmId(p.id)}
                  aria-label={`Delete ${nameOf(p)} poster`}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!list.length ? (
        <div className="empty">
          <p>{t(lang, "emptyGallery")}</p>
          <Link className="btn primary" style={{ marginTop: 12 }} to="/design">
            {t(lang, "design")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
