import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import { t } from "../lib/i18n.js";

export default function Auth() {
  const { register, login, loginDemo } = useStore();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const lang = "en";

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (mode === "register") {
      if (!form.name || !form.email || !form.password) return;
      register(form);
      return;
    }
    login(form.email, form.password);
  };

  return (
    <div className="app-frame">
      <div className="app-shell">
        <div className="auth">
          <p className="eyebrow" style={{ color: "#f0c9a6" }}>
            SOCIAL COMMERCE
          </p>
          <h1>{t(lang, "app")}</h1>
          <p className="tag">{t(lang, "tagline")}</p>
          <form className="auth-card" onSubmit={submit}>
            <div className="row" style={{ marginBottom: 12 }}>
              <button type="button" className={`chip ${mode === "login" ? "on" : ""}`} onClick={() => setMode("login")}>
                {t(lang, "login")}
              </button>
              <button type="button" className={`chip ${mode === "register" ? "on" : ""}`} onClick={() => setMode("register")}>
                {t(lang, "register")}
              </button>
            </div>
            {mode === "register" ? (
              <label className="field">
                <span>{t(lang, "name")}</span>
                <input name="name" value={form.name} onChange={onChange} autoComplete="name" />
              </label>
            ) : null}
            <label className="field">
              <span>{t(lang, "email")}</span>
              <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
            </label>
            <label className="field">
              <span>{t(lang, "password")}</span>
              <input name="password" type="password" value={form.password} onChange={onChange} autoComplete="current-password" />
            </label>
            <button className="btn primary full" type="submit">
              {mode === "register" ? t(lang, "register") : t(lang, "login")}
            </button>
            <button className="btn ghost full" type="button" style={{ marginTop: 10 }} onClick={loginDemo}>
              {t(lang, "demo")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
