import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { generateCaptions, groupMessage } from "../lib/captions.js";
import { t } from "../lib/i18n.js";

export default function Groups() {
  const { data, addGroup, deleteGroup, notify, trackShare } = useStore();
  const lang = data.language || "en";
  const products = data.products || [];
  const groups = data.groups || [];

  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  // Track who is *unticked*, so newly added groups are ticked by default.
  const [unpicked, setUnpicked] = useState(() => new Set());
  const [posted, setPosted] = useState(() => new Set()); // groups already pasted this session
  const [edits, setEdits] = useState({}); // message edits, keyed by product id
  const [confirmId, setConfirmId] = useState(null);

  const product = products.find((p) => p.id === productId) || products[0];

  const generated = useMemo(() => {
    if (!product) return "";
    const profile = data.profile || {};
    const base = generateCaptions(product, profile)[0]?.text || "";
    return groupMessage(product, profile, base);
  }, [product, data.profile]);

  const caption = (product && edits[product.id]) ?? generated;
  const edited =
    product &&
    edits[product.id] !== undefined &&
    edits[product.id] !== generated;

  const selected = groups.filter((g) => !unpicked.has(g.id));
  const pack = selected.map((g) => `— ${g.name} —\n${caption}`).join("\n\n");

  const toggle = (id) =>
    setUnpicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copyText = async (text, okMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(okMsg);
      return true;
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.");
      return false;
    }
  };

  const addNew = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (groups.some((g) => g.name.toLowerCase() === n.toLowerCase())) {
      notify("You already have a group with that name");
      return;
    }
    addGroup(n);
    setName("");
  };

  const copyForGroup = async (g) => {
    if (await copyText(caption, `Copied. Paste it into "${g.name}"`)) {
      setPosted((prev) => new Set(prev).add(g.id));
      trackShare({ via: "groups", count: 1, productId: product?.id });
    }
  };

  const copySelected = async () => {
    const n = selected.length || 1;
    if (await copyText(pack || caption, `Copied for ${n} group(s)`)) {
      trackShare({ via: "groups", count: n, productId: product?.id });
    }
  };

  const openWa = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
      "_blank",
      "noopener",
    );
    trackShare({ via: "whatsapp", productId: product?.id });
  };

  return (
    <div className="page">
      <h1>{t(lang, "groups")}</h1>
      <p>
        Prepare one message, then paste it into each WhatsApp group. Tick groups
        off as you go.
      </p>

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
      ) : (
        <>
          <label className="field" style={{ marginTop: 12 }}>
            <span>Product</span>
            <select
              value={product?.id || ""}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <form
            className="row"
            style={{ flexWrap: "nowrap" }}
            onSubmit={addNew}
          >
            <input
              className="pill-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              aria-label="New group name"
            />
            <button className="btn sm" type="submit" disabled={!name.trim()}>
              Add
            </button>
          </form>

          <div className="section-head">
            <h2 className="section-title">
              Groups ({selected.length}/{groups.length})
            </h2>
            {posted.size ? (
              <button
                className="link-more link-btn"
                onClick={() => setPosted(new Set())}
              >
                Reset ticks
              </button>
            ) : null}
          </div>

          {groups.map((g) => {
            const done = posted.has(g.id);
            return (
              <div
                key={g.id}
                className={`card check-row ${done ? "is-done" : ""}`}
                style={{ marginBottom: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={!unpicked.has(g.id)}
                  onChange={() => toggle(g.id)}
                  aria-label={`Include ${g.name}`}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{g.name}</b>
                  <div className="muted">
                    {done ? "✓ Copied: paste done?" : "Reusable message ready"}
                  </div>
                </div>
                {confirmId === g.id ? (
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <button
                      className="btn sm ghost"
                      onClick={() => setConfirmId(null)}
                    >
                      Keep
                    </button>
                    <button
                      className="btn sm danger"
                      onClick={() => {
                        deleteGroup(g.id);
                        setConfirmId(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <button
                      className="btn sm primary"
                      onClick={() => copyForGroup(g)}
                    >
                      Copy
                    </button>
                    <button
                      className="btn sm ghost"
                      onClick={() => setConfirmId(g.id)}
                      aria-label={`Delete ${g.name}`}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {!groups.length ? (
            <p className="empty">
              Add your WhatsApp groups above to keep track of where you've
              posted.
            </p>
          ) : null}

          <h2 className="section-title">Message</h2>
          <textarea
            className="caption-box caption-edit"
            rows={7}
            value={caption}
            onChange={(e) =>
              product &&
              setEdits((d) => ({ ...d, [product.id]: e.target.value }))
            }
            aria-label="Group message (editable)"
          />
          {edited ? (
            <button
              className="btn sm ghost"
              style={{ marginTop: 8 }}
              onClick={() =>
                setEdits((d) => {
                  const next = { ...d };
                  delete next[product.id];
                  return next;
                })
              }
            >
              Undo edits
            </button>
          ) : null}

          <button
            className="btn primary full"
            style={{ marginTop: 12 }}
            onClick={copySelected}
          >
            Copy for selected groups
          </button>
          <button
            className="btn green full"
            style={{ marginTop: 8 }}
            onClick={openWa}
          >
            Open WhatsApp
          </button>
        </>
      )}
    </div>
  );
}
