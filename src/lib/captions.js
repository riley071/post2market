const HOOKS = {
  electronics: ["Gadget check", "New stock alert", "Upgrade today"],
  fashion: ["Fresh drip", "Weekend look", "Limited pieces"],
  beauty: ["Glow up", "Skin first", "Self-care restock"],
  home: ["Home upgrade", "Kitchen must-have", "Make it cozy"],
  auto: ["Car care restock", "Drive ready", "Shop for your ride"],
  food: ["Fresh stock", "Family size", "Cook-out ready"],
};

// Street tone: English mixed with everyday Swahili.
const STREET_HOOKS = {
  electronics: ["Mzigo mpya 🔥", "Tech imeingia ⚡", "Gadget za moto 🔌"],
  fashion: ["Drip imetua 👟", "Mzigo mpya 🔥", "Vaa uonekane 😎"],
  beauty: ["Glow up ✨", "Ngozi first 💆", "Mzigo wa urembo 💄"],
  home: ["Nyumba iwe poa 🏠", "Jikoni imekamilika 🍳", "Mzigo wa nyumbani 🛋️"],
  auto: ["Gari lako linastahili 🚗", "Mzigo wa gari 🔧", "Drive ready 🏁"],
  food: ["Mzigo fresh 🛒", "Chakula cha familia 🍽️", "Tumewasili 🔥"],
};

function money(n) {
  if (!n && n !== 0) return "";
  return `TSh ${Number(n).toLocaleString()}`;
}

// Picks the same hook for the same product every time, so the caption doesn't
// change whenever the page re-renders.
function pick(list, seed) {
  let h = 7;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function generateCaptions(product, profile) {
  profile = profile || {};
  const cat = product.category || "fashion";
  const seed = product.id || product.name || cat;
  const hook = pick(HOOKS[cat] || HOOKS.fashion, seed);
  const streetHook = pick(STREET_HOOKS[cat] || STREET_HOOKS.fashion, seed);
  const price = product.discountPrice || product.price;
  const was = product.discountPrice ? money(product.price) : null;
  const now = money(price);
  const biz = profile.businessName || "Us";
  const loc = profile.location ? ` · ${profile.location}` : "";
  const phone = profile.whatsapp || profile.phone || "";
  const wa = phone ? `\nWhatsApp: ${phone}` : "";

  const promo = `${hook} 🔥\n${product.name}\n${was ? `Was ${was} → Now ${now}` : now}\n${product.description || ""}\n\nOrder from ${biz}${loc}${wa}\n#${cat} #Post2Market`;

  const short = `${product.name} — ${now}${was ? ` (was ${was})` : ""}\nDM to order${wa}`;

  const marketing = `Selling fast: ${product.name}.\n${product.description || "Quality piece, ready to pick."}\nPrice: ${now}\nPickup: ${profile.location || "inbox for location"}\nCall/WhatsApp ${phone || "us"}\n\nTag a friend who needs this.`;

  const street = `${streetHook}\n${product.name}\nBei poa: ${now}${was ? ` (ilikuwa ${was})` : ""}\n${product.description || ""}\n\nAgiza sasa 👉 ${phone || "DM"}${profile.location ? `\n📍 ${profile.location}` : ""}\n#${cat} #MzigoMpya #Post2Market`;

  const pro = `${product.name}\n${product.description || ""}\n\nPrice: ${now}${was ? ` (previously ${was})` : ""}\nAvailable from ${biz}${loc}.\nTo order, contact ${phone || "us by direct message"}.`;

  // New styles are appended so the positions of the original three stay the same.
  return [
    { id: "promo", label: "Promotional", text: promo.trim() },
    { id: "short", label: "Short", text: short.trim() },
    { id: "marketing", label: "Marketing", text: marketing.trim() },
    {
      id: "street",
      label: "Street",
      text: street.replace(/\n{3,}/g, "\n\n").trim(),
    },
    {
      id: "pro",
      label: "Professional",
      text: pro.replace(/\n{3,}/g, "\n\n").trim(),
    },
  ];
}

export function groupMessage(product, profile, caption) {
  return caption || generateCaptions(product, profile)[1]?.text || "";
}
