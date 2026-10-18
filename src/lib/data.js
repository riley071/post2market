export const DEFAULT_CATEGORIES = [
  { id: "electronics", name: "Electronics", emoji: "📱" },
  { id: "fashion", name: "Fashion", emoji: "👗" },
  { id: "beauty", name: "Beauty", emoji: "✨" },
  { id: "home", name: "Home & Kitchen", emoji: "🏠" },
  { id: "auto", name: "Automotive", emoji: "🚗" },
  { id: "food", name: "Food & Groceries", emoji: "🛒" },
];

// style: "classic" (original set) | "pro" (clean, professional) | "street" (loud, urban)
// font: default font id used when the poster's font is "auto"
// light: true when the template background is light (used for the picker preview)
export const TEMPLATES = [
  {
    id: "showcase",
    name: "Product Showcase",
    kind: "showcase",
    style: "classic",
    premium: false,
    accent: "#E85D04",
    bg: "#1A1612",
  },
  {
    id: "sale",
    name: "Flash Sale",
    kind: "sale",
    style: "classic",
    premium: false,
    accent: "#D62828",
    bg: "#111111",
  },
  {
    id: "new",
    name: "New Arrival",
    kind: "new",
    style: "classic",
    premium: true,
    accent: "#C9A227",
    bg: "#14261C",
  },
  {
    id: "discount",
    name: "Discount Offer",
    kind: "discount",
    style: "classic",
    premium: true,
    accent: "#F4A261",
    bg: "#2B1608",
  },
  {
    id: "promo",
    name: "Promo Burst",
    kind: "promo",
    style: "classic",
    premium: true,
    accent: "#0F6B4C",
    bg: "#F6EDE0",
    light: true,
  },
  {
    id: "status",
    name: "Status Story",
    kind: "status",
    style: "classic",
    premium: false,
    accent: "#E85D04",
    bg: "#0B0B0B",
  },

  // Professional
  {
    id: "minimal",
    name: "Clean Minimal",
    kind: "minimal",
    style: "pro",
    premium: false,
    accent: "#C2410C",
    bg: "#F7F4EF",
    light: true,
  },
  {
    id: "luxe",
    name: "Luxe Gold",
    kind: "luxe",
    style: "pro",
    premium: true,
    accent: "#C9A227",
    bg: "#0E0E0E",
    font: "serif",
  },
  {
    id: "split",
    name: "Split Panel",
    kind: "split",
    style: "pro",
    premium: true,
    accent: "#F2B134",
    bg: "#12263A",
  },

  // Street
  {
    id: "street",
    name: "Street Drop",
    kind: "street",
    style: "street",
    premium: false,
    accent: "#FFD60A",
    bg: "#D9D5CE",
    font: "street",
    light: true,
  },
  {
    id: "neon",
    name: "Neon Night",
    kind: "neon",
    style: "street",
    premium: true,
    accent: "#00F5D4",
    bg: "#07070D",
    font: "display",
  },
  {
    id: "pop",
    name: "Pop Sticker",
    kind: "pop",
    style: "street",
    premium: false,
    accent: "#E63946",
    bg: "#FFD60A",
    font: "street",
    light: true,
  },
];

export const TEMPLATE_STYLES = [
  { id: "all", label: "All" },
  { id: "pro", label: "Professional" },
  { id: "street", label: "Street" },
  { id: "classic", label: "Classic" },
];

export const FRAMES = [
  { id: "", label: "None" },
  { id: "thin", label: "Thin" },
  { id: "bold", label: "Bold" },
  { id: "corners", label: "Corners" },
];

export const CASES = [
  { id: "", label: "Auto" },
  { id: "upper", label: "UPPER" },
  { id: "normal", label: "Normal" },
];

export const STICKERS = ["🔥", "💥", "✨", "🆕", "💯", "⚡", "🎯", "📦"];

// "auto" uses each template's own default font. The Street font works best with Anton loaded
// (see README note); it falls back to Impact, then a bold sans-serif.
export const FONTS = [
  { id: "auto", label: "Template", family: "" },
  { id: "sans", label: "Clean", family: "Outfit, sans-serif" },
  { id: "display", label: "Bold", family: "Syne, sans-serif" },
  { id: "serif", label: "Classic", family: "Georgia, serif" },
  {
    id: "street",
    label: "Street",
    family: 'Anton, Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  },
  { id: "mono", label: "Stamp", family: '"Courier New", Courier, monospace' },
];

export function placeholderImage(label, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="900" height="900" fill="url(#g)"/>
    <text x="450" y="470" text-anchor="middle" fill="white" font-size="42" font-family="Arial,sans-serif" font-weight="700">${escapeXml(label)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function demoSeed() {
  const now = Date.now();
  return {
    profile: {
      businessName: "Amina Market",
      phone: "+255 712 445 210",
      whatsapp: "255712445210",
      location: "Kariakoo, Dar es Salaam",
      logo: "",
    },
    premium: false,
    language: "en",
    categories: [],
    products: [
      {
        id: "p1",
        name: "Wireless Earbuds Pro",
        category: "electronics",
        price: 45000,
        discountPrice: 35000,
        description: "Clear bass, 24h battery, comes with charging case.",
        link: "",
        image: placeholderImage("EARBUDS", "#1A1612", "#E85D04"),
        createdAt: now - 86400000 * 3,
      },
      {
        id: "p2",
        name: "Ankara Midi Dress",
        category: "fashion",
        price: 28000,
        discountPrice: 0,
        description: "Size S–XL. Soft cotton print. Perfect for weekends.",
        link: "",
        image: placeholderImage("DRESS", "#6B2D5B", "#E9C46A"),
        createdAt: now - 86400000 * 2,
      },
      {
        id: "p3",
        name: "Glow Vitamin C Cream",
        category: "beauty",
        price: 18000,
        discountPrice: 15000,
        description: "Brightens skin in 7 days. 50ml jar.",
        link: "",
        image: placeholderImage("GLOW", "#0F6B4C", "#F4A261"),
        createdAt: now - 86400000,
      },
      {
        id: "p4",
        name: "Sunflower Cooking Oil 2L",
        category: "food",
        price: 12000,
        discountPrice: 0,
        description: "Fresh stock. Free delivery in town for 3+ bottles.",
        link: "",
        image: placeholderImage("OIL 2L", "#9A3412", "#F6EDE0"),
        createdAt: now - 3600000,
      },
    ],
    posters: [],
    groups: [
      { id: "g1", name: "Kariakoo Deals" },
      { id: "g2", name: "Ladies Fashion TZ" },
      { id: "g3", name: "Phone Accessories Hub" },
    ],
    scheduled: [],
    events: [{ type: "signup", at: now, meta: { demo: true } }],
  };
}
