import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { compressImage } from "../lib/poster.js";
import { t } from "../lib/i18n.js";

// crypto.randomUUID only exists in secure contexts (HTTPS/localhost), so fall back on plain HTTP.
const uid = () =>
  globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, categories, saveProduct, deleteProduct, notify } = useStore();
  const lang = data.language || "en";
  const existing = (data.products || []).find((p) => p.id === id);

  const [form, setForm] = useState(() =>
    existing
      ? {
          ...existing,
          price: existing.price || "",
          discountPrice: existing.discountPrice || "",
          description: existing.description || "",
          link: existing.link || "",
        }
      : {
          id: uid(),
          name: "",
          category: categories[0]?.id || "fashion",
          price: "",
          discountPrice: "",
          description: "",
          link: "",
          image: "",
          createdAt: Date.now(),
        },
  );
  const [errors, setErrors] = useState({});
  const [photoBusy, setPhotoBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setPhotoBusy(true);
    try {
      set("image", await compressImage(file));
    } catch {
      notify("Couldn't read that photo. Try a different image.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const price = Number(form.price) || 0;
  const discount = Number(form.discountPrice) || 0;
  const percentOff =
    price > 0 && discount > 0 && discount < price
      ? Math.round((1 - discount / price) * 100)
      : 0;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Enter a product name";
    if (price < 0) next.price = "Price can't be negative";
    if (discount < 0) next.discountPrice = "Price can't be negative";
    if (discount > 0 && price > 0 && discount >= price)
      next.discountPrice = "Discount price must be lower than the price";
    if (discount > 0 && !price) next.price = "Add the normal price too";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = (e) => {
    e.preventDefault();
    if (photoBusy) return;
    if (!validate()) {
      notify("Please fix the highlighted fields");
      return;
    }
    try {
      saveProduct({
        ...form,
        name: form.name.trim(),
        link: form.link.trim(),
        price,
        discountPrice: discount,
      });
      notify(existing ? "Product updated" : "Product added");
      nav("/products");
    } catch {
      notify(
        "Couldn't save. Storage may be full: try a smaller photo or delete old items.",
      );
    }
  };

  if (id && !existing) {
    return (
      <div className="page">
        <h1>Product not found</h1>
        <div className="empty">
          <p>It may have been deleted.</p>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => nav("/products", { replace: true })}
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}>
        ← Back
      </button>
      <h1 style={{ margin: "10px 0 16px" }}>
        {existing ? "Edit product" : t(lang, "addProduct")}
      </h1>
      <form onSubmit={save} noValidate>
        {form.image ? (
          <img
            className="thumb lg"
            src={form.image}
            alt="Product preview"
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <div className="row" style={{ marginBottom: 12, flexWrap: "nowrap" }}>
          <label
            className="file-btn btn ghost"
            style={{ flex: 1 }}
            aria-disabled={photoBusy}
          >
            {photoBusy
              ? "Processing…"
              : form.image
                ? "Change photo"
                : "Upload product photo"}
            <input
              type="file"
              accept="image/*"
              onChange={onFile}
              disabled={photoBusy}
            />
          </label>
          {form.image ? (
            <button
              className="btn ghost"
              type="button"
              onClick={() => set("image", "")}
            >
              Remove
            </button>
          ) : null}
        </div>

        <label className={`field ${errors.name ? "invalid" : ""}`}>
          <span>Product name</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <span className="error">{errors.name}</span> : null}
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-2">
          <label className={`field ${errors.price ? "invalid" : ""}`}>
            <span>Price (TSh)</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
            {errors.price ? (
              <span className="error">{errors.price}</span>
            ) : null}
          </label>
          <label className={`field ${errors.discountPrice ? "invalid" : ""}`}>
            <span>Discount price</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
            />
            {errors.discountPrice ? (
              <span className="error">{errors.discountPrice}</span>
            ) : null}
          </label>
        </div>
        {percentOff ? (
          <p className="discount-hint">
            {percentOff}% off: customers will see the sale price.
          </p>
        ) : null}

        <label className="field" style={{ marginTop: 12 }}>
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        <label className="field">
          <span>Link</span>
          <input
            type="url"
            inputMode="url"
            value={form.link}
            onChange={(e) => set("link", e.target.value)}
            placeholder="https://"
          />
        </label>

        <button className="btn primary full" type="submit" disabled={photoBusy}>
          {t(lang, "save")}
        </button>

        {existing ? (
          confirmDelete ? (
            <div className="row" style={{ marginTop: 10, flexWrap: "nowrap" }}>
              <button
                className="btn ghost"
                style={{ flex: 1 }}
                type="button"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                style={{ flex: 1 }}
                type="button"
                onClick={() => {
                  deleteProduct(existing.id);
                  notify("Product deleted");
                  nav("/products", { replace: true });
                }}
              >
                Yes, delete
              </button>
            </div>
          ) : (
            <button
              className="btn ghost full"
              type="button"
              style={{ marginTop: 10, color: "var(--danger)" }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete product
            </button>
          )
        ) : null}
      </form>
    </div>
  );
}
