const STRINGS = {
  en: {
    name: "Zhang Pan",
    navGallery: "Paintings",
    navAbout: "About",
    eyebrow: "Chinese brush painting · Maine",
    tagline: "Ink, color and quiet attention: peonies, branches and stones, painted in the old way in the New England countryside.",
    cta: "View the paintings",
    galleryTitle: "Paintings",
    all: "All",
    aboutTitle: "About the artist",
    aboutText: `
      <p>Zhang Pan has loved art for as long as she can remember. As a child she dreamed of becoming a painter, and for many years that wish waited patiently in the background of a busy life.</p>
      <p>It was Maine that finally called it out: the rocky coast and tall pines, the long snows and sudden springs, the way the light changes from one season to the next. A few years ago she picked up the brush and began studying traditional Chinese painting in earnest.</p>
      <p>Today she paints at home in the Maine countryside, working in ink and color on xuan paper: peonies and branches, trees and stones. It is an old art practiced in a new place, with the brushwork of China and the light of New England.</p>`,
    contactLead: "Interested in a painting, or just want to say hello?",
    contactLink: "Write to us",
    place: "Maine, USA",
    date: "Date",
    medium: "Medium",
    size: "Size",
    tbd: "to be added",
    untitledDate: "Undated",
    zoomHint: "Click the painting to look closer",
    showFramed: "See it framed",
    showPainting: "Back to the painting",
    inquire: "Ask about this piece",
    featured: "Featured",
  },
  zh: {
    name: "张磐",
    navGallery: "画作",
    navAbout: "关于",
    eyebrow: "中国画 · 缅因",
    tagline: "以笔墨丹青，静观万物。在新英格兰的乡间，用古老的方式描绘牡丹、枝叶与山石。",
    cta: "观赏画作",
    galleryTitle: "画作",
    all: "全部",
    aboutTitle: "关于画家",
    aboutText: `
      <p>张磐自幼钟爱艺术，儿时便怀揣着一个画画的梦。多年来，这个心愿在忙碌的生活中静静等待。</p>
      <p>是缅因唤醒了它：礁石海岸与高大的松林，漫长的冬雪与骤至的春天，四季流转间光影的变化。几年前，她提起画笔，开始潜心学习中国传统绘画。</p>
      <p>如今，她在缅因乡间的家中作画，以水墨丹青落于宣纸之上，描绘牡丹与枝叶、树木与山石。古老的笔墨，在异乡生根：东方的笔意，新英格兰的光。</p>`,
    contactLead: "如对画作感兴趣，或想打个招呼，",
    contactLink: "欢迎来信",
    place: "美国缅因州",
    date: "日期",
    medium: "材质",
    size: "尺寸",
    tbd: "待补充",
    untitledDate: "未注日期",
    zoomHint: "点击画面可放大细看",
    showFramed: "查看装裱效果",
    showPainting: "返回画作",
    inquire: "询问此作",
    featured: "精选",
  },
};

const ZH_DIGITS = "〇一二三四五六七八九";
let lang = initialLang();
let filter = "all";
let current = -1;
let showingFramed = false;

function initialLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "zh") return saved;
  } catch (e) {}
  return (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

const t = (key) => STRINGS[lang][key];
const $ = (sel) => document.querySelector(sel);

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "zh") {
    const yy = String(y).split("").map((c) => ZH_DIGITS[c]).join("");
    const num = (n) => (n >= 20 ? ZH_DIGITS[Math.floor(n / 10)] : "") + (n >= 10 ? "十" : "") + (n % 10 ? ZH_DIGITS[n % 10] : "");
    return `${yy}年` + (m ? `${num(m)}月` : "") + (d ? `${num(d)}日` : "");
  }
  if (!m) return String(y);
  return new Date(y, m - 1, d || 1).toLocaleDateString("en-US",
    d ? { year: "numeric", month: "long", day: "numeric" } : { year: "numeric", month: "long" });
}

function setText(el, value) {
  if (value) { el.textContent = value; el.classList.remove("tbd"); }
  else { el.textContent = t("tbd"); el.classList.add("tbd"); }
}

/* ---------- static text ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  renderFilters();
  renderGallery();
  renderHero();
  if (current >= 0) renderViewer();
}

/* ---------- frame ---------- */
// Walnut frame + mat drawn around a plain image (styles in styles.css).
// Each frame shows a different part of the wood texture, like real lumber.
function framed(src, alt, i, lazy) {
  const ox = -((i * 377) % 1024), oy = -((i * 53) % 128);
  return `<div class="framed" style="--ox:${ox}px;--oy:${oy}px">
    <div class="side top"></div><div class="side bottom"></div><div class="side left"></div><div class="side right"></div>
    <div class="mat"><div class="bevel"><img src="${src}" alt="${alt}"${lazy ? ' loading="lazy"' : ""}></div></div></div>`;
}

/* ---------- hero ---------- */
function renderHero() {
  const i = Math.max(0, WORKS.findIndex((w) => w.featured));
  const w = WORKS[i];
  $("#hero-frame").innerHTML = framed(w.thumb || w.image, w.title[lang], i, false);
  $("#hero-caption").textContent = lang === "zh" ? `《${w.title.zh}》` : w.title.en;
  $("#hero-frame").onclick = () => openWork(i);
}

/* ---------- gallery ---------- */
function renderFilters() {
  const used = [...new Set(WORKS.map((w) => w.category))];
  const box = $(".filters");
  box.innerHTML = "";
  [["all", t("all")], ...used.map((c) => [c, CATEGORIES[c][lang]])].forEach(([key, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-pressed", String(filter === key));
    b.onclick = () => { filter = key; renderFilters(); renderGallery(); };
    box.appendChild(b);
  });
}

function renderGallery() {
  const grid = $("#gallery-grid");
  grid.innerHTML = "";
  WORKS.forEach((w, i) => {
    if (filter !== "all" && w.category !== filter) return;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.style.animationDelay = `${grid.children.length * 70}ms`;
    const year = w.date ? (lang === "zh" ? formatDate(w.date.slice(0, 4)) : w.date.slice(0, 4)) : "";
    const title = lang === "zh"
      ? `<span class="zh">${w.title.zh}</span>`
      : `<span class="zh">${w.title.zh}</span>${w.title.en}`;
    card.innerHTML = `
      ${framed(w.thumb || w.image, w.title[lang], i, true)}
      <div class="card-cap"><span class="card-title">${title}</span><span class="card-year">${year}</span></div>`;
    card.onclick = () => openWork(i);
    grid.appendChild(card);
  });
}

/* ---------- viewer ---------- */
function openWork(i) {
  location.hash = `#/work/${WORKS[i].id}`;
}

function showFromHash() {
  const m = location.hash.match(/^#\/work\/(.+)$/);
  const i = m ? WORKS.findIndex((w) => w.id === m[1]) : -1;
  if (i < 0) { closeViewer(true); return; }
  current = i;
  showingFramed = false;
  renderViewer();
  const v = $("#viewer");
  if (v.hidden) {
    v.hidden = false;
    document.body.style.overflow = "hidden";
    $(".v-close").focus();
  }
}

function renderViewer() {
  const w = WORKS[current];
  const stage = $("#v-stage");
  stage.classList.remove("zoomed");
  stage.scrollTo(0, 0);
  const img = $("#v-img");
  img.src = showingFramed ? w.framed : w.image;
  img.alt = w.title[lang];

  $("#v-cat").textContent = CATEGORIES[w.category][lang];
  $("#v-title").textContent = lang === "zh" ? w.title.zh : w.title.en;
  $("#v-subtitle").textContent = lang === "zh" ? w.title.en : w.title.zh;
  setText($("#v-date"), formatDate(w.date));
  setText($("#v-medium"), w.medium && w.medium[lang]);
  setText($("#v-size"), w.size);
  $("#v-note").textContent = w.note ? w.note[lang] : "";

  const framedBtn = $("#v-framed");
  framedBtn.hidden = !w.framed;
  framedBtn.textContent = showingFramed ? t("showPainting") : t("showFramed");

  const subject = encodeURIComponent(`${w.title.zh} ${w.title.en}`);
  $("#v-inquire").href = `mailto:${SITE.contactEmail}?subject=${subject}`;
  $("#v-inquire").hidden = !SITE.contactEmail;
  $("#v-count").textContent = `${current + 1} / ${WORKS.length}`;
}

function closeViewer(fromHash) {
  const v = $("#viewer");
  if (v.hidden) return;
  v.hidden = true;
  document.body.style.overflow = "";
  const leaving = current;
  current = -1;
  if (!fromHash) history.pushState("", "", location.pathname + location.search + "#gallery");
  const cards = document.querySelectorAll(".card");
  if (cards[leaving]) cards[leaving].focus({ preventScroll: true });
}

function step(d) {
  const w = WORKS[(current + d + WORKS.length) % WORKS.length];
  history.replaceState("", "", `#/work/${w.id}`);
  showFromHash();
}

/* ---------- wiring ---------- */
$(".lang-toggle").onclick = () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
};

document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => closeViewer()));
$("#v-prev").onclick = () => step(-1);
$("#v-next").onclick = () => step(1);
$("#v-framed").onclick = () => { showingFramed = !showingFramed; renderViewer(); };

$("#v-stage").addEventListener("click", (e) => {
  const stage = e.currentTarget;
  const img = $("#v-img");
  if (stage.classList.contains("zoomed")) { stage.classList.remove("zoomed"); return; }
  const r = img.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width;
  const fy = (e.clientY - r.top) / r.height;
  stage.classList.add("zoomed");
  stage.scrollTo(fx * img.offsetWidth - stage.clientWidth / 2, fy * img.offsetHeight - stage.clientHeight / 2);
});

document.addEventListener("keydown", (e) => {
  if ($("#viewer").hidden) return;
  if (e.key === "Escape") closeViewer();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

window.addEventListener("hashchange", showFromHash);
window.addEventListener("scroll", () => {
  $(".site-header").classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

$("#contact-link").href = `mailto:${SITE.contactEmail}`;
$(".contact").hidden = !SITE.contactEmail;
$("#year").textContent = new Date().getFullYear();
applyLang();
showFromHash();
