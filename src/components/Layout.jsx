import { NavLink, Outlet } from "react-router-dom";
import { t } from "../lib/i18n.js";
import { useStore } from "../lib/store.jsx";
import { useEffect, useState } from "react";

export default function Layout() {
  const { data } = useStore();
  const lang = data?.language || "en";
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="app-frame">
      <div className="app-shell">
        {!online ? <div className="offline-bar">Offline · posters save on this device</div> : null}
        <Outlet />
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")}>
            <span>⌂</span>
            {t(lang, "home")}
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "on" : "")}>
            <span>▣</span>
            {t(lang, "products")}
          </NavLink>
          <NavLink to="/design" className={({ isActive }) => (isActive ? "on" : "")}>
            <span>✦</span>
            {t(lang, "design")}
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => (isActive ? "on" : "")}>
            <span>▭</span>
            {t(lang, "gallery")}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "on" : "")}>
            <span>●</span>
            {t(lang, "profile")}
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
