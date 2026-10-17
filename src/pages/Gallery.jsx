import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

export default function Gallery() {
  const { data, deletePoster } = useStore();
  const lang = data.language || "en";
  const posters = data.posters || [];

  return (
    <div className="page">
      <h1>{t(lang, "gallery")}</h1>
      <p>Reuse, download, and restock posts.</p>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {posters.map((p) => (
          <div key={p.id} className="card" style={{ padding: 8 }}>
            <img src={p.image} alt="" style={{ width: "100%", borderRadius: 12 }} />
            <div className="row" style={{ marginTop: 8 }}>
              <Link className="btn sm primary" to={`/share/${p.id}`}>
                Share
              </Link>
              <Link className="btn sm ghost" to={`/design?poster=${p.id}&product=${p.productId}`}>
                Edit
              </Link>
              <button className="btn sm ghost" onClick={() => deletePoster(p.id)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      {!posters.length ? <p className="empty">{t(lang, "emptyGallery")}</p> : null}
    </div>
  );
}
