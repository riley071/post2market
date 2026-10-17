const HOOKS = {
  electronics: ["Gadget check", "New stock alert", "Upgrade today"],
  fashion: ["Fresh drip", "Weekend look", "Limited pieces"],
  beauty: ["Glow up", "Skin first", "Self-care restock"],
  home: ["Home upgrade", "Kitchen must-have", "Make it cozy"],
  auto: ["Car care restock", "Drive ready", "Shop for your ride"],
  food: ["Fresh stock", "Family size", "Cook-out ready"],
};

function money(n) {
  if (!n && n !== 0) return "";
  return `TSh ${Number(n).toLocaleString()}`;
}

export function generateCaptions(product, profile) {
  const cat = product.category || "fashion";
  const hooks = HOOKS[cat] || HOOKS.fashion;
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
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

  return [
    { id: "promo", label: "Promotional", text: promo.trim() },
    { id: "short", label: "Short", text: short.trim() },
    { id: "marketing", label: "Marketing", text: marketing.trim() },
  ];
}

export function groupMessage(product, profile, caption) {
  return caption || generateCaptions(product, profile)[1].text;
}
