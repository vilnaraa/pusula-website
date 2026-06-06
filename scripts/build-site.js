#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const readJson = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
};

const writeWindowData = (relativePath, globalName, value) => {
  const fullPath = path.join(root, relativePath);
  const js = `window.${globalName} = ${JSON.stringify(value, null, 2)};\n`;
  fs.writeFileSync(fullPath, js);
};

const escapeAttr = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const replaceOrFail = (source, pattern, replacement, label) => {
  if (!pattern.test(source)) {
    throw new Error(`Could not update ${label}`);
  }
  return source.replace(pattern, replacement);
};

const buildStructuredData = (seo) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${seo.canonicalUrl || "https://pusulamobil.com.tr/"}#website`,
      url: seo.canonicalUrl || "https://pusulamobil.com.tr/",
      name: seo.ogTitle || "Pusula",
      inLanguage: "tr-TR",
      description: seo.description || ""
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${seo.canonicalUrl || "https://pusulamobil.com.tr/"}#app`,
      name: seo.ogTitle || "Pusula",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "iOS",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TRY"
      },
      description:
        seo.ogDescription ||
        "Günün ruh hali ve ihtiyacına göre kişisel Pusula kartı, günlük ritim ve destek araçları sunan mobil uygulama.",
      url: seo.canonicalUrl || "https://pusulamobil.com.tr/"
    }
  ]
});

const cardNavItems = (cards) =>
  cards
    .map((card) => `<a role="menuitem" href="/kartlar/${escapeAttr(card.slug)}/">${escapeHtml(card.navLabel || card.title)}</a>`)
    .join("");

const buildNav = (cards) => `
    <header class="site-header">
      <nav class="nav-shell" aria-label="Ana navigasyon">
        <a class="brand" href="/" aria-label="Pusula ana sayfa">
          <img src="/assets/app-icon.png" width="40" height="40" alt="">
          <span>Pusula</span>
        </a>
        <div class="nav-links">
          <a href="/#product">Ürün</a>
          <div class="nav-dropdown">
            <button type="button" class="nav-dropdown-trigger" aria-haspopup="true" aria-expanded="false">
              Kartlar
            </button>
            <div class="nav-dropdown-menu" role="menu" aria-label="Pusula kartları">
              ${cardNavItems(cards)}
            </div>
          </div>
          <a href="/app-store/">App Store</a>
          <a href="/faq/">FAQ</a>
          <a href="/changelog/">Changelog</a>
        </div>
      </nav>
    </header>`;

const buildFooter = () => `
    <footer class="site-footer">
      <div class="footer-shell">
        <section class="footer-brand">
          <a class="footer-logo" href="/" aria-label="Pusula ana sayfa">
            <img src="/assets/app-icon.png" width="44" height="44" alt="">
            <span>Pusula</span>
          </a>
          <p>Günün tonuna göre küçük, kişisel bir yön.</p>
          <span class="footer-status">Yakında App Store'da</span>
        </section>
        <nav class="footer-column" aria-label="Ürün bağlantıları">
          <strong>Ürün</strong>
          <a href="/#product">Ürün</a>
          <a href="/#cards">Kartlar</a>
          <a href="/app-store/">App Store</a>
          <a href="/changelog/">Changelog</a>
          <a href="/faq/">FAQ</a>
        </nav>
        <nav class="footer-column" aria-label="Yasal bağlantılar">
          <strong>Yasal</strong>
          <a href="/privacy/">Gizlilik</a>
          <a href="/kvkk/">KVKK</a>
          <a href="/terms/">Kullanım</a>
        </nav>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Pusula. Tüm hakları saklıdır.</span>
        <a href="#main">Yukarı dön</a>
      </div>
    </footer>`;

const listItems = (items) => (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const cardVisuals = (card, cards) => {
  const ordered = [card, ...cards.filter((item) => item.slug !== card.slug)];
  return ordered.slice(0, 4).map((item, index) => ({
    slug: item.slug || "",
    image: item.image || "/assets/card-calm.png",
    alt: item.alt || `${item.title || "Pusula"} kart görseli`,
    label: index === 0 ? item.tag || "Pusula kartı" : item.navLabel || item.title || "Kart",
    title: index === 0 ? item.headline || item.title || "Pusula kartı" : item.title || "Kart"
  }));
};

const cardFeatureTiles = (card, visuals) => {
  const supportingText = [...(card.useCases || []), ...(card.signals || []), ...(card.productNotes || [])];
  return (card.benefits || []).slice(0, 4).map((benefit, index) => ({
    title: benefit.replace(/\.$/, ""),
    text: supportingText[index] || card.subtitle || card.description || "",
    image: visuals[index % visuals.length]?.image || "/assets/card-calm.png",
    alt: visuals[index % visuals.length]?.alt || "Pusula kart görseli"
  }));
};

const renderCardPage = (card, cards) => {
  const canonical = `https://pusulamobil.com.tr/kartlar/${card.slug}/`;
  const visuals = cardVisuals(card, cards);
  const primaryVisual = visuals[0];
  const secondaryVisuals = visuals.slice(1);
  const featureTiles = cardFeatureTiles(card, visuals);
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeAttr(card.metaDescription || card.description || "")}">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="${escapeAttr(`${card.title} | Pusula kartı`)}">
    <meta property="og:description" content="${escapeAttr(card.subtitle || card.description || "")}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${escapeAttr(canonical)}">
    <meta property="og:image" content="${escapeAttr(`https://pusulamobil.com.tr${card.image || "/assets/card-calm.png"}`)}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="${escapeAttr(canonical)}">
    <link rel="icon" href="/assets/app-icon.png">
    <link rel="stylesheet" href="/styles.css">
    <title>${escapeHtml(card.title)} Kartı | Pusula</title>
  </head>
  <body>
    <a class="skip-link" href="#main">İçeriğe geç</a>
${buildNav(cards)}
    <main id="main" class="subpage-main">
      <section class="card-compact-hero" data-card-detail data-active-card="${escapeAttr(card.slug)}">
        <div class="card-detail-copy card-compact-copy">
          <p class="eyebrow dark" data-card-tag>${escapeHtml(card.tag || "Pusula kartı")}</p>
          <h1 data-card-title>${escapeHtml(card.title)}</h1>
          <p class="card-product-subtitle" data-card-subtitle>${escapeHtml(card.subtitle || "")}</p>
          <p data-card-description>${escapeHtml(card.description || "")}</p>
          <div class="card-quick-facts" data-card-facts aria-label="${escapeAttr(card.title)} kartı kısa özellikleri">
            ${(card.benefits || [])
              .slice(0, 3)
              .map((benefit, index) => `<span><strong>${String(index + 1).padStart(2, "0")}</strong>${escapeHtml(benefit)}</span>`)
              .join("")}
          </div>
          <div class="card-hero-actions">
            <a class="button primary dark-button" href="/#cards">Tüm kartlara dön</a>
            <a class="text-link" href="#nasil-calisir">Nasıl çalışır?</a>
          </div>
        </div>
        <div class="card-mosaic" data-card-mosaic aria-label="${escapeAttr(card.title)} görsel anlatımı">
          <a class="mosaic-tile primary active" href="/kartlar/${escapeAttr(primaryVisual.slug)}/" data-card-switch="${escapeAttr(primaryVisual.slug)}" aria-current="page">
            <img src="${escapeAttr(primaryVisual.image)}" width="1024" height="1024" alt="${escapeAttr(primaryVisual.alt)}">
            <div>
              <span>${escapeHtml(primaryVisual.label)}</span>
              <strong>${escapeHtml(primaryVisual.title)}</strong>
            </div>
          </a>
          <div class="mosaic-options">
          ${secondaryVisuals
            .map(
              (visual) => `<a class="mosaic-tile" href="/kartlar/${escapeAttr(visual.slug)}/" data-card-switch="${escapeAttr(visual.slug)}">
            <img src="${escapeAttr(visual.image)}" width="1024" height="1024" alt="${escapeAttr(visual.alt)}">
            <div>
              <span>${escapeHtml(visual.label)}</span>
              <strong>${escapeHtml(visual.title)}</strong>
            </div>
          </a>`
            )
            .join("")}
          </div>
        </div>
      </section>

      <section class="section card-product-story">
        <article class="product-story-card">
          <p class="eyebrow dark">Kartın özü</p>
          <h2 data-card-what-title>${escapeHtml(card.whatTitle || `${card.title} nedir?`)}</h2>
          <p data-card-what-text>${escapeHtml(card.whatText || "")}</p>
        </article>
        <article class="product-story-card accent">
          <p class="eyebrow dark">Neden kullanılır?</p>
          <h2 data-card-why-title>${escapeHtml(card.whyTitle || "Neden önemli?")}</h2>
          <p data-card-why-text>${escapeHtml(card.whyText || "")}</p>
        </article>
      </section>

      <section id="nasil-calisir" class="section card-benefit-section">
        <div class="section-heading compact">
          <p class="eyebrow dark">Ürün değeri</p>
          <h2 data-card-feature-title>${escapeHtml(card.headline || card.title)}</h2>
        </div>
        <div class="card-feature-grid" data-card-features>
          ${featureTiles
            .map(
              (tile, index) => `<article class="card-feature-tile">
            <img src="${escapeAttr(tile.image)}" width="1024" height="1024" alt="${escapeAttr(tile.alt)}">
            <div>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(tile.title)}</h3>
              <p>${escapeHtml(tile.text)}</p>
            </div>
          </article>`
            )
            .join("")}
        </div>
      </section>

      <section class="section card-product-columns">
        <article class="content-card card-product-list">
          <h3>Ne zaman iyi gelir?</h3>
          <ul data-card-usecases>${listItems(card.useCases)}</ul>
        </article>
        <article class="content-card card-product-list">
          <h3>Hangi sinyallerle çalışır?</h3>
          <ul data-card-signals>${listItems(card.signals)}</ul>
        </article>
        <article class="content-card card-product-list">
          <h3>Uygulamada nasıl davranır?</h3>
          <ul data-card-notes>${listItems(card.productNotes)}</ul>
        </article>
      </section>
    </main>
${buildFooter()}
    <script src="/data/cards.js"></script>
    <script src="/main.js"></script>
  </body>
</html>
`;
};

const copyRecursive = (source, destination) => {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
};

const site = readJson("content/site.json");
const gallery = readJson("content/gallery.json");
const cardsData = readJson("content/cards.json");
const cards = cardsData.cards || [];
const changelog = readJson("data/changelog.json");
const sitemapPages = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "app-store/", priority: "0.8", changefreq: "weekly" },
  ...cards.map((card) => ({ path: `kartlar/${card.slug}/`, priority: "0.7", changefreq: "monthly" })),
  { path: "changelog/", priority: "0.8", changefreq: "weekly" },
  { path: "faq/", priority: "0.7", changefreq: "monthly" },
  { path: "privacy/", priority: "0.5", changefreq: "monthly" },
  { path: "kvkk/", priority: "0.5", changefreq: "monthly" },
  { path: "terms/", priority: "0.5", changefreq: "monthly" }
];

writeWindowData("data/site.js", "PUSULA_SITE", site);
writeWindowData("data/gallery.js", "PUSULA_GALLERY", gallery);
writeWindowData("data/cards.js", "PUSULA_CARDS", cardsData);
writeWindowData("data/changelog.js", "PUSULA_CHANGELOG", changelog);

const seo = site.seo || {};
const indexPath = path.join(root, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");

indexHtml = replaceOrFail(
  indexHtml,
  /<title>.*?<\/title>/,
  `<title>${escapeAttr(seo.title || "Pusula")}</title>`,
  "title"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+name="description"\s+content="[^"]*"\s*>/,
  `<meta name="description" content="${escapeAttr(seo.description || "")}">`,
  "meta description"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+name="theme-color"\s+content="[^"]*"\s*>/,
  `<meta name="theme-color" content="${escapeAttr(seo.themeColor || "#101622")}">`,
  "theme color"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+property="og:title"\s+content="[^"]*"\s*>/,
  `<meta property="og:title" content="${escapeAttr(seo.ogTitle || seo.title || "Pusula")}">`,
  "og title"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+property="og:description"\s+content="[^"]*"\s*>/,
  `<meta property="og:description" content="${escapeAttr(seo.ogDescription || seo.description || "")}">`,
  "og description"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+property="og:url"\s+content="[^"]*"\s*>/,
  `<meta property="og:url" content="${escapeAttr(seo.canonicalUrl || "https://pusulamobil.com.tr/")}">`,
  "og url"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+property="og:image"\s+content="[^"]*"\s*>/,
  `<meta property="og:image" content="${escapeAttr(seo.ogImage || "")}">`,
  "og image"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+name="twitter:title"\s+content="[^"]*"\s*>/,
  `<meta name="twitter:title" content="${escapeAttr(seo.ogTitle || seo.title || "Pusula")}">`,
  "twitter title"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+name="twitter:description"\s+content="[^"]*"\s*>/,
  `<meta name="twitter:description" content="${escapeAttr(seo.ogDescription || seo.description || "")}">`,
  "twitter description"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<meta\s+name="twitter:image"\s+content="[^"]*"\s*>/,
  `<meta name="twitter:image" content="${escapeAttr(seo.ogImage || "")}">`,
  "twitter image"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<link\s+rel="canonical"\s+href="[^"]*"\s*>/,
  `<link rel="canonical" href="${escapeAttr(seo.canonicalUrl || "https://pusulamobil.com.tr/")}">`,
  "canonical"
);

indexHtml = replaceOrFail(
  indexHtml,
  /<script id="structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
  `<script id="structured-data" type="application/ld+json">\n${JSON.stringify(buildStructuredData(seo), null, 2)}\n    </script>`,
  "structured data"
);

fs.writeFileSync(indexPath, indexHtml);

cards.forEach((card) => {
  const cardPath = path.join(root, "kartlar", card.slug, "index.html");
  fs.mkdirSync(path.dirname(cardPath), { recursive: true });
  fs.writeFileSync(cardPath, renderCardPage(card, cards));
});

const sitemapPath = path.join(root, "sitemap.xml");
if (fs.existsSync(sitemapPath) && seo.canonicalUrl) {
  const baseUrl = seo.canonicalUrl || "https://pusulamobil.com.tr/";
  const today = new Date().toISOString().slice(0, 10);
  const sitemapUrls = sitemapPages
    .map((page) => {
      const loc = new URL(page.path, baseUrl).toString();
      return `  <url>\n    <loc>${escapeAttr(loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`;
    })
    .join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`;
  fs.writeFileSync(sitemapPath, sitemap);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

[
  "index.html",
  "styles.css",
  "main.js",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "admin",
  "app-store",
  "assets",
  "changelog",
  "content",
  "data",
  "faq",
  "kartlar",
  "kvkk",
  "privacy",
  "terms"
].forEach((relativePath) => {
  copyRecursive(path.join(root, relativePath), path.join(dist, relativePath));
});

console.log("Pusula website content generated in dist/.");
