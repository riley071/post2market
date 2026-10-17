import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { compressImage } from "../lib/poster.js";
import { t } from "../lib/i18n.js";

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, categories, saveProduct, deleteProduct } = useStore();
  const lang = data.language || "en";
  const existing = (data.products || []).find((p) => p.id === id);
  const [form, setForm] = useState(
    existing || {
      id: crypto.randomUUID(),
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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await compressImage(file);
    set("image", url);
  };

  const save = (e) => {
    e.preventDefault();
    saveProduct({
      ...form,
      price: Number(form.price || 0),
      discountPrice: Number(form.discountPrice || 0),
    });
    nav("/products");
  };

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}>
        ← Back
      </button>
      <h1 style={{ margin: "10px 0 16px" }}>{existing ? "Edit product" : t(lang, "addProduct")}</h1>
      <form onSubmit={save}>
        <label className="file-btn btn ghost full" style={{ marginBottom: 12, display: "block", textAlign: "center" }}>
          {form.image ? "Change photo" : "Upload product photo"}
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        {form.image ? <img className="thumb lg" src={form.image} alt="" style={{ marginBottom: 12 }} /> : null}
        <label className="field">
          <span>Product name</span>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-2">
          <label className="field">
            <span>Price</span>
            <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </label>
          <label className="field">
            <span>Discount price</span>
            <input type="number" value={form.discountPrice} onChange={(e) => set("discountPrice", e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="field">
          <span>Link</span>
          <input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" />
        </label>
        <button className="btn primary full" type="submit">
          {t(lang, "save")}
        </button>
        {existing ? (
          <button
            className="btn ghost full"
            type="button"
            style={{ marginTop: 10, color: "var(--danger)" }}
            onClick={() => {
              deleteProduct(existing.id);
              nav("/products");
            }}
          >
            Delete product
          </button>
        ) : null}
      </form>
    </div>
  );
}
