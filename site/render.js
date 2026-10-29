// HTML templates shared by the browser (app.js) and the page builder (tools/build.js).
// Plain functions on purpose: the builder loads this file as-is.

const SITE_URL = "https://panzhangstudio.com";
const ZH_DIGITS = "〇一二三四五六七八九";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function homePath(lang) { return lang === "zh" ? "/zh/" : "/"; }
function workPath(w, lang) { return `${lang === "zh" ? "/zh" : ""}/works/${w.id}/`; }

// "Luoshen Peony" / "洛神"
function workTitle(w, lang) { return lang === "zh" ? w.title.zh : w.title.en; }

function formatDate(iso, lang) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "zh") {
    const yy = String(y).split("").map((c) => ZH_DIGITS[c]).join("");
    const num = (n) => (n >= 20 ? ZH_DIGITS[Math.floor(n / 10)] : "") + (n >= 10 ? "十" : "") + (n % 10 ? ZH_DIGITS[n % 10] : "");
    return `${yy}年` + (m ? `${num(m)}月` : "") + (d ? `${num(d)}日` : "");
  }
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (!m) return String(y);
  return d ? `${months[m - 1]} ${d}, ${y}` : `${months[m - 1]} ${y}`;
}

function yearLabel(w, lang) {
  if (!w.date) return "";
  return lang === "zh" ? formatDate(w.date.slice(0, 4), "zh") : w.date.slice(0, 4);
}

// Walnut frame + mat drawn around a plain image (styles in styles.css).
// Each frame shows a different part of the wood texture, like real lumber.
function framed(w, i, lang, { lazy = true, size = null } = {}) {
  const ox = -((i * 377) % 1024), oy = -((i * 53) % 128);
  const dims = size ? ` width="${size[0]}" height="${size[1]}"` : "";
  return `<div class="framed" style="--ox:${ox}px;--oy:${oy}px">
    <div class="side top"></div><div class="side bottom"></div><div class="side left"></div><div class="side right"></div>
    <div class="mat"><div class="bevel"><img src="/${esc(w.thumb || w.image)}" alt="${esc(workTitle(w, lang))}"${dims}${lazy ? ' loading="lazy"' : ""}></div></div></div>`;
}

function cardHTML(w, i, lang, size) {
  const title = lang === "zh"
    ? `<span class="zh">${esc(w.title.zh)}</span>`
    : `<span class="zh">${esc(w.title.zh)}</span>${esc(w.title.en)}`;
  return `<a class="card" href="${workPath(w, lang)}" data-work="${esc(w.id)}" data-category="${esc(w.category)}">
      ${framed(w, i, lang, { size })}
      <div class="card-cap"><span class="card-title">${title}</span><span class="card-year">${esc(yearLabel(w, lang))}</span></div>
    </a>`;
}

// The painting view: used as the overlay on the gallery and as each painting's own page.
function viewerHTML(w, i, lang, { page = false, framedView = false } = {}) {
  const t = STRINGS[lang];
  const n = WORKS.length;
  const prev = WORKS[(i - 1 + n) % n], next = WORKS[(i + 1) % n];
  const field = (v) => (v ? esc(v) : `<span class="tbd">${esc(t.tbd)}</span>`);
  const H = page ? "h1" : "h2";
  const subject = encodeURIComponent(`${w.title.zh} ${w.title.en}`);
  const close = page
    ? `<a class="v-close" href="${homePath(lang)}#gallery" aria-label="${esc(t.allPaintings)}">×</a>`
    : `<button class="v-close" type="button" data-close aria-label="${esc(t.close)}">×</button>`;
  return `${close}
      <div class="v-stage">
        <img class="v-img" src="/${esc(framedView ? w.framed : w.image)}" alt="${esc(workTitle(w, lang))}">
        <p class="v-hint">${esc(t.zoomHint)}</p>
      </div>
      <aside class="v-info">
        <p class="v-cat">${esc(CATEGORIES[w.category][lang])}</p>
        <${H} class="v-title" id="v-title">${esc(workTitle(w, lang))}</${H}>
        <p class="v-subtitle">${esc(lang === "zh" ? w.title.en : w.title.zh)}</p>
        <dl class="v-meta">
          <dt>${esc(t.date)}</dt><dd>${field(formatDate(w.date, lang))}</dd>
          <dt>${esc(t.medium)}</dt><dd>${field(w.medium && w.medium[lang])}</dd>
          <dt>${esc(t.size)}</dt><dd>${field(w.size)}</dd>
        </dl>
        <p class="v-note">${esc(w.note ? w.note[lang] : "")}</p>
        ${w.framed ? `<button class="v-framed" type="button" data-framed>${esc(framedView ? t.showPainting : t.showFramed)}</button>` : ""}
        ${SITE.contactEmail ? `<a class="v-inquire" href="mailto:${esc(SITE.contactEmail)}?subject=${subject}">${esc(t.inquire)}</a>` : ""}
        <nav class="v-nav">
          <a href="${workPath(prev, lang)}" data-step="-1" aria-label="${esc(t.prev)}">←</a>
          <span>${i + 1} / ${n}</span>
          <a href="${workPath(next, lang)}" data-step="1" aria-label="${esc(t.next)}">→</a>
        </nav>
      </aside>`;
}
