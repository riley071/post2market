import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { generateCaptions, groupMessage } from "../lib/captions.js";
import { t } from "../lib/i18n.js";

export default function Groups() {
  const { data, addGroup, deleteGroup, notify, trackShare } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState(() => new Set((data.groups || []).map((g) => g.id)));
  const product = products.find((p) => p.id === productId) || products[0];
  const caption = useMemo(() => {
    if (!product) return "";
    const profile = data.profile || {};
    return groupMessage(product, profile, generateCaptions(product, profile)[0].text);
  }, [product, data.profile]);

  const toggle = (id) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = (data.groups || []).filter((g) => picked.has(g.id));
  const pack = selected.map((g) => `— ${g.name} —\n${caption}`).join("\n\n");

  return (
    <div className="page">
      <h1>{t(lang, "groups")}</h1>
      <p>Prepare one message, then paste it into each WhatsApp group.</p>

      <label className="field" style={{ marginTop: 12 }}>
        <span>Product</span>
        <select value={product?.id || ""} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addGroup(name.trim());
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 999, padding: "10px 12px" }}
        />
        <button className="btn sm" type="submit">
          Add
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        {(data.groups || []).map((g) => (
          <label key={g.id} className="card check-row" style={{ marginBottom: 8 }}>
            <input type="checkbox" checked={picked.has(g.id)} onChange={() => toggle(g.id)} />
            <div style={{ flex: 1 }}>
              <b>{g.name}</b>
              <div className="muted">Reusable message ready</div>
            </div>
            <button className="btn sm ghost" type="button" onClick={() => deleteGroup(g.id)}>
              ✕
            </button>
          </label>
        ))}
      </div>

      <pre className="caption-box">{caption}</pre>
      <button
        className="btn primary full"
        onClick={() => {
          navigator.clipboard.writeText(pack || caption).then(() => {
            notify(`Copied for ${selected.length || 1} group(s)`);
            trackShare({ via: "groups", count: selected.length || 1, productId: product?.id });
          });
        }}
      >
        Copy for selected groups
      </button>
      <button
        className="btn green full"
        style={{ marginTop: 8 }}
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank")}
      >
        Open WhatsApp
      </button>
    </div>
  );
}
