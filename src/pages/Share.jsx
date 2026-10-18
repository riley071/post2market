import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

const slug = (s) =>
  (s || "poster")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "poster";

const mimeOf = (url = "") =>
  /^data:(image\/[\w+.-]+)/.exec(url)?.[1] || "image/png";
const extOf = (mime) =>
  mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");

function download(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function Share() {
  const { id } = useParams();
  // Re-mount when the poster changes so the editable caption resets.
  return <ShareBody key={id} id={id} />;
}

function ShareBody({ id }) {
  const nav = useNavigate();
  const { data, notify, trackShare } = useStore();
  const lang = data.language || "en";
  const poster = (data.posters || []).find((p) => p.id === id);
  const product = (data.products || []).find((p) => p.id === poster?.productId);
  const [caption, setCaption] = useState(poster?.caption || "");

  const mime = mimeOf(poster?.image);
  const fileName = `${slug(product?.name || poster?.headline)}.${extOf(mime)}`;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Prepared once so the share sheet opens instantly (browsers need share() to run right after a tap).
  const file = useMemo(() => {
    if (!poster?.image) return Promise.resolve(null);
    return fetch(poster.image)
      .then((r) => r.blob())
      .then((blob) => new File([blob], fileName, { type: mime }))
      .catch(() => null);
  }, [poster?.image, fileName, mime]);

  if (!poster) {
    return (
      <div className="page">
        <h1>Poster not found</h1>
        <div className="empty">
          <p>It may have been deleted.</p>
          <Link className="btn primary" to="/gallery" style={{ marginTop: 12 }}>
            {t(lang, "gallery")}
          </Link>
        </div>
      </div>
    );
  }

  const track = (via) => trackShare({ via, productId: product?.id });

  const shareNative = async () => {
    try {
      const f = await file;
      const payload = { title: product?.name || "Post2Market", text: caption };
      if (f && navigator.canShare?.({ files: [f] })) payload.files = [f];
      await navigator.share(payload);
      track("native");
    } catch (err) {
      if (err?.name === "AbortError") return; // person closed the share sheet
      notify(
        "Sharing isn't available here. Download the poster, then open WhatsApp.",
      );
    }
  };

  const openWa = () => {
    // No number: WhatsApp lets the seller choose which contact or group to send to.
    window.open(
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
      "_blank",
      "noopener",
    );
    track("whatsapp");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      notify("Caption copied");
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.");
    }
  };

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}>
        ← Back
      </button>
      <h1 style={{ margin: "10px 0 12px" }}>{t(lang, "share")}</h1>
      <img
        className="gallery-img"
        src={poster.image}
        alt={`${product?.name || "Poster"} preview`}
        style={{ borderRadius: 20 }}
      />

      <label className="field" style={{ marginTop: 12 }}>
        <span>Caption (edit before sharing)</span>
        <textarea
          className="caption-edit-plain"
          rows={6}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </label>

      <p className="hint">
        WhatsApp links can only carry text. To send the picture, download the
        poster first, then attach it in the chat.
      </p>

      <div className="grid" style={{ marginTop: 12 }}>
        {canNativeShare ? (
          <button className="btn primary" onClick={shareNative}>
            Share poster
          </button>
        ) : null}
        <button
          className="btn ghost"
          onClick={() => {
            download(poster.image, fileName);
            track("download");
            notify("Poster downloaded");
          }}
        >
          1 · Download poster
        </button>
        <button className="btn green" onClick={openWa}>
          2 · Open WhatsApp with caption
        </button>
        <button className="btn ghost" onClick={copy}>
          Copy caption
        </button>
        <Link className="btn ghost" to="/groups">
          Group post helper
        </Link>
      </div>
    </div>
  );
}
