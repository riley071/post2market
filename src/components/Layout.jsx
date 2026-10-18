import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { t } from "../lib/i18n.js";
import { useStore } from "../lib/store.jsx";

const ITEMS = [
  { to: "/", end: true, icon: "⌂", key: "home" },
  { to: "/products", icon: "▣", key: "products" },
  { to: "/design", icon: "✦", key: "design" },
  { to: "/gallery", icon: "▭", key: "gallery" },
  { to: "/profile", icon: "●", key: "profile" },
];

export default function Layout() {
  const { data } = useStore();
  const lang = data?.language || "en";
  const { pathname } = useLocation();
  const [online, setOnline] = useState(navigator.onLine);
  const [backOnline, setBackOnline] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const on = () => {
      setOnline(true);
      setBackOnline(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBackOnline(false), 2500);
    };
    const off = () => {
      clearTimeout(timer.current);
      setBackOnline(false);
      setOnline(false);
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      clearTimeout(timer.current);
    };
  }, []);

  // Start each screen at the top when navigating.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-frame">
      <div className="app-shell">
        <div role="status" aria-live="polite">
          {!online ? (
            <div className="offline-bar">
              Offline · posters save on this device
            </div>
          ) : null}
          {online && backOnline ? (
            <div className="offline-bar online">Back online</div>
          ) : null}
        </div>
        <Outlet />
        <nav className="nav" aria-label="Main">
          {ITEMS.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) => (isActive ? "on" : "")}
            >
              <span className="nav-ic" aria-hidden="true">
                {i.icon}
              </span>
              {t(lang, i.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
