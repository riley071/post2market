import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CATEGORIES, demoSeed } from "./data.js";

const KEY = "p2m-v1";
const StoreContext = createContext(null);

function emptyUser(extra = {}) {
  return {
    profile: {
      businessName: "",
      phone: "",
      whatsapp: "",
      location: "",
      logo: "",
    },
    premium: false,
    language: "en",
    categories: [],
    products: [],
    posters: [],
    groups: [],
    scheduled: [],
    events: [],
    ...extra,
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw?.users) return raw;
  } catch {
    /* ignore */
  }
  return { users: {}, sessionId: null };
}

function persist(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(load);
  const [toast, setToast] = useState("");

  useEffect(() => persist(db), [db]);

  const notify = (msg) => {
    setToast(msg);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(""), 2200);
  };

  const patchUser = (fn) => {
    setDb((prev) => {
      const id = prev.sessionId;
      if (!id || !prev.users[id]) return prev;
      const nextUser = fn(prev.users[id]);
      return {
        ...prev,
        users: { ...prev.users, [id]: nextUser },
      };
    });
  };

  const track = (type, meta = {}) => {
    patchUser((u) => ({
      ...u,
      events: [...(u.events || []), { type, at: Date.now(), meta }].slice(-400),
    }));
  };

  const api = useMemo(() => {
    const session = db.sessionId ? db.users[db.sessionId] : null;
    return {
      toast,
      notify,
      session,
      user: session?.account,
      data: session,
      categories: [...DEFAULT_CATEGORIES, ...(session?.categories || [])],
      register(account) {
        const id = crypto.randomUUID();
        setDb((prev) => ({
          sessionId: id,
          users: {
            ...prev.users,
            [id]: emptyUser({
              account: { id, name: account.name, email: account.email, password: account.password },
              events: [{ type: "signup", at: Date.now() }],
            }),
          },
        }));
        notify("Welcome to Post2Market");
      },
      login(email, password) {
        const found = Object.values(db.users).find(
          (u) => u.account?.email === email && u.account?.password === password,
        );
        if (!found) {
          notify("Wrong email or password");
          return false;
        }
        setDb((prev) => ({ ...prev, sessionId: found.account.id }));
        notify("Welcome back");
        return true;
      },
      loginDemo() {
        const existing = Object.values(db.users).find((u) => u.account?.email === "seller@post2market.app");
        if (existing) {
          setDb((prev) => ({ ...prev, sessionId: existing.account.id }));
          notify("Demo seller ready");
          return;
        }
        const id = "demo-user";
        setDb((prev) => ({
          sessionId: id,
          users: {
            ...prev.users,
            [id]: {
              ...demoSeed(),
              account: {
                id,
                name: "Amina",
                email: "seller@post2market.app",
                password: "demo123",
              },
            },
          },
        }));
        notify("Demo seller ready");
      },
      logout() {
        setDb((prev) => ({ ...prev, sessionId: null }));
      },
      setLanguage(language) {
        patchUser((u) => ({ ...u, language }));
      },
      setPremium(premium) {
        patchUser((u) => ({ ...u, premium }));
        track("premium", { premium });
        notify(premium ? "Premium unlocked" : "Back to free plan");
      },
      saveProfile(profile) {
        patchUser((u) => ({ ...u, profile: { ...u.profile, ...profile } }));
        notify("Business profile saved");
      },
      saveProduct(product) {
        patchUser((u) => {
          const list = u.products || [];
          const idx = list.findIndex((p) => p.id === product.id);
          const next = idx >= 0 ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list];
          return { ...u, products: next };
        });
        track("product", { id: product.id });
        notify("Product saved");
      },
      deleteProduct(id) {
        patchUser((u) => ({ ...u, products: u.products.filter((p) => p.id !== id) }));
        notify("Product deleted");
      },
      addCategory(name) {
        const cat = { id: `c-${crypto.randomUUID().slice(0, 8)}`, name, emoji: "🏷️", custom: true };
        patchUser((u) => ({ ...u, categories: [...(u.categories || []), cat] }));
        notify("Category added");
        return cat;
      },
      savePoster(poster) {
        patchUser((u) => ({ ...u, posters: [poster, ...(u.posters || [])] }));
        track("poster", { productId: poster.productId, category: poster.category });
        notify("Poster saved to gallery");
      },
      deletePoster(id) {
        patchUser((u) => ({ ...u, posters: u.posters.filter((p) => p.id !== id) }));
      },
      addGroup(name) {
        patchUser((u) => ({
          ...u,
          groups: [...(u.groups || []), { id: crypto.randomUUID(), name }],
        }));
      },
      deleteGroup(id) {
        patchUser((u) => ({ ...u, groups: u.groups.filter((g) => g.id !== id) }));
      },
      schedulePost(item) {
        patchUser((u) => ({ ...u, scheduled: [item, ...(u.scheduled || [])] }));
        track("schedule", { when: item.when });
        notify("Post scheduled");
      },
      updateScheduled(id, patch) {
        patchUser((u) => ({
          ...u,
          scheduled: u.scheduled.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
      },
      deleteScheduled(id) {
        patchUser((u) => ({ ...u, scheduled: u.scheduled.filter((s) => s.id !== id) }));
      },
      trackShare(meta) {
        track("share", meta);
      },
    };
  }, [db, toast]);

  return (
    <StoreContext.Provider value={api}>
      {children}
      {toast ? <div className="toast">{toast}</div> : null}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}
