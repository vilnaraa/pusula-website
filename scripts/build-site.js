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
  /<link\s+rel="canonical"\s+href="[^"]*"\s*>/,
  `<link rel="canonical" href="${escapeAttr(seo.canonicalUrl || "https://pusulamobil.com.tr/")}">`,
  "canonical"
);

fs.writeFileSync(indexPath, indexHtml);

const sitemapPath = path.join(root, "sitemap.xml");
if (fs.existsSync(sitemapPath) && seo.canonicalUrl) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeAttr(seo.canonicalUrl)}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;
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
  "assets",
  "content",
  "data"
].forEach((relativePath) => {
  copyRecursive(path.join(root, relativePath), path.join(dist, relativePath));
});

console.log("Pusula website content generated in dist/.");
