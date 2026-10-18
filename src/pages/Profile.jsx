import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { compressImage } from "../lib/poster.js";
import { LANGS, t } from "../lib/i18n.js";

const EMPTY = {
  businessName: "",
  phone: "",
  whatsapp: "",
  location: "",
  logo: "",
};
const KEYS = Object.keys(EMPTY);
const STORAGE_BUDGET = 5 * 1024 * 1024; // browsers typically allow roughly 5 MB of localStorage

export default function Profile() {
  const { data, user, saveProfile, setLanguage, setPremium, logout, notify } =
    useStore();
  const lang = data.language || "en";
  const [form, setForm] = useState(() => ({ ...EMPTY, ...data.profile }));
  const [logoBusy, setLogoBusy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [nameError, setNameError] = useState("");

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "businessName") setNameError("");
  };

  const dirty = KEYS.some((k) => (form[k] ?? "") !== (data.profile?.[k] ?? ""));

  // Rough size of everything saved in this browser, so sellers can see when space is running low.
  const used = useMemo(() => new Blob([JSON.stringify(data)]).size, [data]);
  const pct = Math.min(100, Math.round((used / STORAGE_BUDGET) * 100));
  const usedLabel =
    used > 1024 * 1024
      ? `${(used / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(used / 1024))} KB`;

  const waLooksWrong = /^\s*(0|\+?\s*0)/.test(form.whatsapp || "");

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    try {
      set("logo", await compressImage(file, 400));
    } catch {
      notify("Couldn't read that image. Try a different file.");
    } finally {
      setLogoBusy(false);
    }
  };

  const save = () => {
    if (!form.businessName.trim()) {
      setNameError("Enter your business name: it appears on your posters");
      notify("Please add a business name");
      return;
    }
    try {
      saveProfile({
        ...form,
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        location: form.location.trim(),
      });
      notify("Profile saved");
    } catch {
      notify(
        "Couldn't save. Storage may be full: try a smaller logo or delete old posters.",
      );
    }
  };

  const downloadBackup = () => {
    const payload = {
      app: "post2market",
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `post2market-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Backup downloaded");
  };

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ overflowWrap: "anywhere" }}>
            {user?.email}
          </div>
          <h1>{t(lang, "profile")}</h1>
        </div>
        {confirmLogout ? (
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <button
              className="btn sm ghost"
              onClick={() => setConfirmLogout(false)}
            >
              Cancel
            </button>
            <button className="btn sm danger" onClick={logout}>
              {t(lang, "logout")}
            </button>
          </div>
        ) : (
          <button
            className="btn sm ghost"
            onClick={() => setConfirmLogout(true)}
          >
            {t(lang, "logout")}
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="switch">
          <div>
            <b>{data.premium ? t(lang, "premium") : t(lang, "free")}</b>
            <div className="muted">
              {data.premium
                ? "Unlimited templates, no watermark"
                : "Limited templates + watermark"}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              Demo toggle: no payment is taken.
            </div>
          </div>
          <button
            className="btn sm primary"
            onClick={() => setPremium(!data.premium)}
          >
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

      <div className="section-head">
        <h2 className="section-title">{t(lang, "business")}</h2>
        {dirty ? <span className="pill warn">Unsaved changes</span> : null}
      </div>

      {form.logo ? (
        <div className="logo-row">
          <img className="thumb" src={form.logo} alt="Your logo" />
          <button
            className="btn sm ghost"
            type="button"
            onClick={() => set("logo", "")}
          >
            Remove logo
          </button>
        </div>
      ) : null}
      <label
        className="file-btn btn ghost full"
        style={{ marginBottom: 12 }}
        aria-disabled={logoBusy}
      >
        {logoBusy ? "Processing…" : form.logo ? "Change logo" : "Upload logo"}
        <input
          type="file"
          accept="image/*"
          onChange={onLogo}
          disabled={logoBusy}
        />
      </label>

      <label className={`field ${nameError ? "invalid" : ""}`}>
        <span>Business name</span>
        <input
          value={form.businessName}
          onChange={(e) => set("businessName", e.target.value)}
          autoComplete="organization"
          aria-invalid={Boolean(nameError)}
        />
        {nameError ? <span className="error">{nameError}</span> : null}
      </label>
      <label className="field">
        <span>Phone</span>
        <input
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          autoComplete="tel"
        />
      </label>
      <label className="field">
        <span>WhatsApp</span>
        <input
          type="tel"
          inputMode="tel"
          value={form.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          placeholder="e.g. 255712345678"
        />
        {waLooksWrong ? (
          <span className="hint-warn">
            Use the international format without a leading 0 (country code
            first), or WhatsApp links may not open.
          </span>
        ) : null}
      </label>
      <label className="field">
        <span>Location</span>
        <input
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          autoComplete="street-address"
        />
      </label>

      <button
        className="btn primary full"
        onClick={save}
        disabled={logoBusy || !dirty}
      >
        {dirty ? t(lang, "save") : "Saved ✓"}
      </button>

      <h2 className="section-title">Your data</h2>
      <div className="card">
        <div className="list-item">
          <b>Storage on this device</b>
          <span className="muted">
            {usedLabel} · {pct}%
          </span>
        </div>
        <div
          className={`bar ${pct >= 80 ? "warn" : ""}`}
          style={{ marginTop: 10 }}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <p style={{ fontSize: 13 }}>
          Everything is saved only in this browser. Clearing site data erases
          it, so download a backup now and then.
          {pct >= 80
            ? " Space is running low: delete old posters or products."
            : ""}
        </p>
        <button
          className="btn ghost full"
          style={{ marginTop: 10 }}
          onClick={downloadBackup}
        >
          Download backup (.json)
        </button>
      </div>
    </div>
  );
}
