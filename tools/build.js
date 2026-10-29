// Build the published site into _site/: real HTML pages for search engines and link
// previews, generated from the same data and templates the browser uses.
//
//   node tools/build.js
//
// Pages: / and /zh/ (gallery), /works/<id>/ and /zh/works/<id>/ (one per painting),
// plus sitemap.xml, robots.txt and 404.html. Static files are copied as they are.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "site");
const OUT = path.join(ROOT, "_site");
const LANGS = ["en", "zh"];

// Load the browser scripts into one context, exactly as a page would.
const ctx = vm.createContext({});
for (const f of ["works.js", "strings.js", "render.js"]) {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx, { filename: f });
}
const { SITE, WORKS, CATEGORIES, STRINGS, SITE_URL, esc, homePath, workPath, workTitle,
        formatDate, framed, cardHTML, viewerHTML } = vm.runInContext(
  "({ SITE, WORKS, CATEGORIES, STRINGS, SITE_URL, esc, homePath, workPath, workTitle, formatDate, framed, cardHTML, viewerHTML })", ctx);

// Width/height of a JPEG, read from its header (lets the browser reserve space before
// images load, and tells link previews the image size).
function jpegSize(file) {
  const b = fs.readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    }
    i += 2 + len;
  }
  throw new Error(`no size in ${file}`);
}
const size = (rel) => jpegSize(path.join(SRC, rel));

const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500&display=swap";

const ARTIST = {
  "@type": "Person",
  name: "Zhang Pan",
  alternateName: "张磐",
  url: SITE_URL + "/",
  homeLocation: { "@type": "Place", name: "Maine, USA" },
};

function head({ lang, title, description, pathFor, image, ogType, jsonld }) {
  const t = STRINGS[lang];
  const url = SITE_URL + pathFor(lang);
  const [iw, ih] = size(image);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en" href="${SITE_URL}${pathFor("en")}">
  <link rel="alternate" hreflang="zh-Hans" href="${SITE_URL}${pathFor("zh")}">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}${pathFor("en")}">
  <meta property="og:site_name" content="${esc(t.name)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${SITE_URL}/${image}">
  <meta property="og:image:width" content="${iw}">
  <meta property="og:image:height" content="${ih}">
  <meta property="og:locale" content="${lang === "zh" ? "zh_CN" : "en_US"}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>
</head>`;
}

function header(lang, pathFor, onHome) {
  const t = STRINGS[lang];
  const other = lang === "zh" ? "en" : "zh";
  const sect = (id) => (onHome ? `#${id}` : `${homePath(lang)}#${id}`);
  return `
<body>
  <header class="site-header">
    <a class="brand" href="${homePath(lang)}" aria-label="${esc(t.name)}">
      <span class="seal" aria-hidden="true"><span>张</span><span>磐</span></span>
      <span class="brand-name">${esc(t.name)}</span>
    </a>
    <nav class="nav">
      <a href="${sect("gallery")}">${esc(t.navGallery)}</a>
      <a href="${sect("about")}">${esc(t.navAbout)}</a>
      <a class="lang-toggle" href="${pathFor(other)}" hreflang="${other === "zh" ? "zh-Hans" : "en"}" lang="${other}" data-lang-switch="${other}" aria-label="${esc(t.switchLang)}">
        <span data-lang="zh">中</span><span class="sep">/</span><span data-lang="en">EN</span>
      </a>
    </nav>
  </header>`;
}

function footer(lang) {
  const t = STRINGS[lang];
  const contact = SITE.contactEmail
    ? `<p class="contact">${esc(t.contactLead)} <a href="mailto:${esc(SITE.contactEmail)}">${esc(t.contactLink)}</a></p>`
    : "";
  return `
  <footer class="site-footer">
    ${contact}
    <p class="copyright">© ${new Date().getFullYear()} 张磐 Zhang Pan · ${esc(t.place)}</p>
  </footer>
  <script src="/works.js" defer></script>
  <script src="/strings.js" defer></script>
  <script src="/render.js" defer></script>
  <script src="/app.js" defer></script>
</body>
</html>
`;
}

function homePage(lang) {
  const t = STRINGS[lang];
  const fi = Math.max(0, WORKS.findIndex((w) => w.featured));
  const fw = WORKS[fi];
  const used = [...new Set(WORKS.map((w) => w.category))];
  const filters = [["all", t.all], ...used.map((c) => [c, CATEGORIES[c][lang]])]
    .map(([k, label]) => `<button type="button" data-filter="${k}" aria-pressed="${k === "all"}">${esc(label)}</button>`).join("");
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "Zhang Pan 张磐", url: SITE_URL + "/", inLanguage: ["en", "zh-Hans"] },
      { ...ARTIST, description: t.homeDescription },
    ],
  };
  return head({ lang, title: t.homeTitle, description: t.homeDescription, pathFor: homePath,
                image: fw.image, ogType: "website", jsonld })
    + header(lang, homePath, true) + `
  <main id="top">
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">${esc(t.eyebrow)}</p>
        <h1>
          <span class="hero-zh">张磐</span>
          <span class="hero-en">Zhang Pan</span>
        </h1>
        <p class="tagline">${esc(t.tagline)}</p>
        <a class="cta" href="#gallery">${esc(t.cta)}</a>
      </div>
      <figure class="hero-art">
        <a class="hero-img-btn" href="${workPath(fw, lang)}" data-work="${esc(fw.id)}">${framed(fw, fi, lang, { lazy: false, size: size(fw.thumb) })}</a>
        <figcaption>${esc(lang === "zh" ? `《${fw.title.zh}》` : fw.title.en)}</figcaption>
      </figure>
      <p class="vertical-poem" aria-hidden="true">笔墨写心 · 山水寄情</p>
    </section>

    <section id="gallery" class="gallery-section">
      <div class="section-head">
        <h2>${esc(t.galleryTitle)}</h2>
        <div class="filters" role="group" aria-label="Filter">${filters}</div>
      </div>
      <div class="gallery" id="gallery-grid">
        ${WORKS.map((w, i) => cardHTML(w, i, lang, size(w.thumb))).join("\n        ")}
      </div>
    </section>

    <section id="about" class="about">
      <div class="about-mark" aria-hidden="true">缅因</div>
      <div class="about-body">
        <h2>${esc(t.aboutTitle)}</h2>
        <div>${t.aboutText}</div>
      </div>
    </section>
  </main>

  <div class="viewer" id="viewer" hidden>
    <div class="viewer-backdrop" data-close></div>
    <div class="viewer-panel" role="dialog" aria-modal="true" aria-labelledby="v-title"></div>
  </div>` + footer(lang);
}

function description(w, lang) {
  const note = w.note ? w.note[lang] : "";
  const by = lang === "zh" ? "张磐中国画作品。" : "A painting by Zhang Pan. ";
  const s = by + note;
  return s.length > 200 ? s.slice(0, 197).replace(/\s+\S*$/, "") + "…" : s;
}

function workPage(w, i, lang) {
  const t = STRINGS[lang];
  const pathFor = (l) => workPath(w, l);
  const title = lang === "zh"
    ? `《${w.title.zh}》· ${t.workTitleSuffix}`
    : `${w.title.en} ${w.title.zh} · ${t.workTitleSuffix}`;
  const [iw, ih] = size(w.image);
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: workTitle(w, lang),
    alternateName: lang === "zh" ? w.title.en : w.title.zh,
    url: SITE_URL + workPath(w, lang),
    image: { "@type": "ImageObject", url: `${SITE_URL}/${w.image}`, width: iw, height: ih },
    creator: ARTIST,
    artform: CATEGORIES[w.category].en === "Calligraphy" ? "Calligraphy" : "Painting",
    genre: "Chinese painting",
    ...(w.medium ? { artMedium: w.medium[lang] } : {}),
    ...(w.date ? { dateCreated: w.date } : {}),
    ...(w.note ? { description: w.note[lang] } : {}),
    inLanguage: lang === "zh" ? "zh-Hans" : "en",
  };
  return head({ lang, title, description: description(w, lang), pathFor, image: w.image, ogType: "article", jsonld })
    + header(lang, pathFor, false) + `
  <main class="work-page">
    <div class="viewer page" data-work-page="${esc(w.id)}">
      <div class="viewer-panel">
      ${viewerHTML(w, i, lang, { page: true })}
      </div>
    </div>
  </main>` + footer(lang);
}

function notFound() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found · Zhang Pan 张磐</title><meta name="robots" content="noindex">
<link href="${FONTS}" rel="stylesheet"><link rel="stylesheet" href="/styles.css"></head>
<body><main class="not-found"><p class="seal" aria-hidden="true"><span>张</span><span>磐</span></p>
<h1>This page isn't here</h1><p>此页面不存在</p>
<p><a class="cta" href="/">Zhang Pan · Paintings</a> <a class="cta" href="/zh/">张磐 · 画作</a></p></main></body></html>
`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const entry = (pathFor) => LANGS.map((lang) => `  <url>
    <loc>${SITE_URL}${pathFor(lang)}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${pathFor("en")}"/>
    <xhtml:link rel="alternate" hreflang="zh-Hans" href="${SITE_URL}${pathFor("zh")}"/>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[homePath, ...WORKS.map((w) => (l) => workPath(w, l))].map(entry).join("\n")}
</urlset>
`;
}

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

// ---- build ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true, filter: (src) => !src.endsWith(".DS_Store") });

for (const lang of LANGS) {
  write(path.join(homePath(lang), "index.html"), homePage(lang));
  WORKS.forEach((w, i) => write(path.join(workPath(w, lang), "index.html"), workPage(w, i, lang)));
}
write("404.html", notFound());
write("sitemap.xml", sitemap());
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`built ${LANGS.length * (WORKS.length + 1)} pages into _site/`);
