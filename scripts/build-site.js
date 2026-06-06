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
const changelog = readJson("data/changelog.json");
const sitemapPages = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "app-store/", priority: "0.8", changefreq: "weekly" },
  { path: "cards/stoik-lens/", priority: "0.7", changefreq: "monthly" },
  { path: "cards/astro-ton/", priority: "0.7", changefreq: "monthly" },
  { path: "cards/kariyer/", priority: "0.7", changefreq: "monthly" },
  { path: "cards/sosyallesme/", priority: "0.7", changefreq: "monthly" },
  { path: "cards/planim/", priority: "0.7", changefreq: "monthly" },
  { path: "cards/destek/", priority: "0.7", changefreq: "monthly" },
  { path: "changelog/", priority: "0.8", changefreq: "weekly" },
  { path: "faq/", priority: "0.7", changefreq: "monthly" },
  { path: "privacy/", priority: "0.5", changefreq: "monthly" },
  { path: "kvkk/", priority: "0.5", changefreq: "monthly" },
  { path: "terms/", priority: "0.5", changefreq: "monthly" }
];

writeWindowData("data/site.js", "PUSULA_SITE", site);
writeWindowData("data/gallery.js", "PUSULA_GALLERY", gallery);
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
  "cards",
  "changelog",
  "content",
  "data",
  "faq",
  "kvkk",
  "privacy",
  "terms"
].forEach((relativePath) => {
  copyRecursive(path.join(root, relativePath), path.join(dist, relativePath));
});

console.log("Pusula website content generated in dist/.");
