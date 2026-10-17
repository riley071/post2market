import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

function download(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

export default function Share() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, notify, trackShare } = useStore();
  const lang = data.language || "en";
  const poster = (data.posters || []).find((p) => p.id === id);
  const product = (data.products || []).find((p) => p.id === poster?.productId);
  const caption = poster?.caption || "";
  const phone = (data.profile?.whatsapp || "").replace(/\D/g, "");

  const file = useMemo(() => {
    if (!poster?.image) return null;
    return fetch(poster.image)
      .then((r) => r.blob())
      .then((blob) => new File([blob], "post2market.png", { type: "image/png" }));
  }, [poster?.image]);

  if (!poster) {
    return (
      <div className="page">
        <p>Poster not found.</p>
        <Link to="/gallery">Gallery</Link>
      </div>
    );
  }

  const shareNative = async () => {
    try {
      const f = await file;
      if (navigator.share && f) {
        await navigator.share({ title: product?.name || "Post2Market", text: caption, files: [f] });
        trackShare({ via: "native", productId: product?.id });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    notify("Use download + WhatsApp if share is blocked");
  };

  const openWa = () => {
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(caption)}`
      : `https://wa.me/?text=${encodeURIComponent(caption)}`;
    window.open(url, "_blank");
    trackShare({ via: "whatsapp", productId: product?.id });
  };

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}>
        ← Back
      </button>
      <h1 style={{ margin: "10px 0 12px" }}>{t(lang, "share")}</h1>
      <img src={poster.image} alt="" style={{ width: "100%", borderRadius: 20 }} />
      <pre className="caption-box" style={{ marginTop: 12 }}>
        {caption}
      </pre>
      <div className="grid" style={{ marginTop: 12 }}>
        <button className="btn green" onClick={openWa}>
          WhatsApp
        </button>
        <button className="btn primary" onClick={shareNative}>
          Share poster
        </button>
        <button
          className="btn ghost"
          onClick={() => navigator.clipboard.writeText(caption).then(() => notify("Caption copied"))}
        >
          Copy caption
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            download(poster.image, `${product?.name || "poster"}.png`);
            trackShare({ via: "download", productId: product?.id });
          }}
        >
          Download poster
        </button>
        <Link className="btn ghost" to="/groups" style={{ textAlign: "center" }}>
          Group post helper
        </Link>
      </div>
    </div>
  );
}
