import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { compressImage } from "../lib/poster.js";
import { LANGS, t } from "../lib/i18n.js";

export default function Profile() {
  const { data, user, saveProfile, setLanguage, setPremium, logout } = useStore();
  const lang = data.language || "en";
  const [form, setForm] = useState({ ...data.profile });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="eyebrow">{user?.email}</div>
          <h1>{t(lang, "profile")}</h1>
        </div>
        <button className="btn sm ghost" onClick={logout}>
          {t(lang, "logout")}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="switch">
          <div>
            <b>{data.premium ? t(lang, "premium") : t(lang, "free")}</b>
            <div className="muted">{data.premium ? "Unlimited templates, no watermark" : "Limited templates + watermark"}</div>
          </div>
          <button className="btn sm primary" onClick={() => setPremium(!data.premium)}>
            {data.premium ? "Use free" : t(lang, "unlock")}
          </button>
        </div>
      </div>

      <label className="field">
        <span>{t(lang, "language")}</span>
        <select value={lang} onChange={(e) => setLanguage(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <h2 className="section-title">{t(lang, "business")}</h2>
      <label className="file-btn btn ghost full" style={{ marginBottom: 12, display: "block", textAlign: "center" }}>
        {form.logo ? "Change logo" : "Upload logo"}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            set("logo", await compressImage(file, 400));
          }}
        />
      </label>
      {form.logo ? <img className="thumb" src={form.logo} alt="" style={{ marginBottom: 12 }} /> : null}
      <label className="field">
        <span>Business name</span>
        <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
      </label>
      <label className="field">
        <span>Phone</span>
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </label>
      <label className="field">
        <span>WhatsApp</span>
        <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
      </label>
      <label className="field">
        <span>Location</span>
        <input value={form.location} onChange={(e) => set("location", e.target.value)} />
      </label>
      <button className="btn primary full" onClick={() => saveProfile(form)}>
        {t(lang, "save")}
      </button>
    </div>
  );
}
