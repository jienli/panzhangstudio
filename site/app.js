// Behavior on top of the pre-built pages (tools/build.js writes the HTML).
// Gallery pages: filters, and paintings open in an overlay while the address bar shows
// the painting's own page. Painting pages: zoom, framed view, arrow keys.

const lang = document.documentElement.lang === "zh" ? "zh" : "en";
const $ = (sel) => document.querySelector(sel);
const indexOf = (id) => WORKS.findIndex((w) => w.id === id);

/* ---------- language preference ---------- */
function savedLang() {
  try { return localStorage.getItem("lang"); } catch (e) { return null; }
}
document.querySelectorAll("[data-lang-switch]").forEach((a) => a.addEventListener("click", () => {
  try { localStorage.setItem("lang", a.dataset.langSwitch); } catch (e) {}
}));
// Home pages follow the reader's last choice; on a first visit to the English home page,
// a Chinese-language browser goes to /zh/. A shared /zh/ link is never redirected away.
if ((location.pathname === "/" || location.pathname === "/zh/") && !location.hash) {
  const saved = savedLang();
  const browserZh = (navigator.language || "").toLowerCase().startsWith("zh");
  const want = saved || (location.pathname === "/" && browserZh ? "zh" : lang);
  if (want !== lang) location.replace(want === "zh" ? "/zh/" : "/");
}
// Links shared before paintings had their own pages: /#/work/<id>
const legacy = location.hash.match(/^#\/work\/(.+)$/);
if (legacy && indexOf(legacy[1]) >= 0) location.replace(workPath(WORKS[indexOf(legacy[1])], lang));

/* ---------- header ---------- */
window.addEventListener("scroll", () => {
  $(".site-header").classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

/* ---------- gallery filters ---------- */
document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
  const f = b.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  document.querySelectorAll("#gallery-grid .card").forEach((c) => {
    c.hidden = f !== "all" && c.dataset.category !== f;
  });
}));

/* ---------- painting view (overlay or page) ---------- */
const overlay = $("#viewer:not(.page)");
const pageView = $(".viewer.page");
let current = pageView ? indexOf(pageView.dataset.workPage) : -1;
let framedView = false;
const homeTitle = document.title;

function panel() { return (overlay && !overlay.hidden ? overlay : pageView).querySelector(".viewer-panel"); }

function render() {
  const w = WORKS[current];
  panel().innerHTML = viewerHTML(w, current, lang, { page: !!pageView, framedView });
  if (overlay) document.title = `${workTitle(w, lang)} · ${STRINGS[lang].workTitleSuffix}`;
}

function openOverlay(i, push) {
  current = i;
  framedView = false;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  render();
  if (push) history.pushState({ work: WORKS[i].id }, "", workPath(WORKS[i], lang));
  overlay.querySelector(".v-close").focus();
}

function closeOverlay(fromHistory) {
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
  document.title = homeTitle;
  const card = document.querySelector(`.card[data-work="${WORKS[current].id}"]`);
  current = -1;
  if (!fromHistory) history.pushState(null, "", homePath(lang) + "#gallery");
  if (card) card.focus({ preventScroll: true });
}

function step(d) {
  const i = (current + d + WORKS.length) % WORKS.length;
  if (pageView) { location.href = workPath(WORKS[i], lang); return; }
  current = i;
  framedView = false;
  render();
  history.replaceState({ work: WORKS[i].id }, "", workPath(WORKS[i], lang));
}

// Cards and the hero open the overlay (a plain click; new-tab clicks still follow the link).
document.querySelectorAll("[data-work]").forEach((a) => a.addEventListener("click", (e) => {
  if (!overlay || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  openOverlay(indexOf(a.dataset.work), true);
}));

window.addEventListener("popstate", (e) => {
  if (!overlay) return;
  const i = e.state && e.state.work ? indexOf(e.state.work) : -1;
  if (i >= 0) openOverlay(i, false); else closeOverlay(true);
});

// One listener for everything inside the view, since its contents are re-rendered.
document.addEventListener("click", (e) => {
  if (current < 0) return;
  const el = e.target;
  if (el.closest("[data-close]")) { closeOverlay(false); return; }
  const stepLink = el.closest("[data-step]");
  if (stepLink && !pageView) { e.preventDefault(); step(Number(stepLink.dataset.step)); return; }
  if (el.closest("[data-framed]")) { framedView = !framedView; render(); return; }

  const stage = el.closest(".v-stage");
  if (!stage) return;
  const img = stage.querySelector(".v-img");
  if (stage.classList.contains("zoomed")) { stage.classList.remove("zoomed"); return; }
  const r = img.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width;
  const fy = (e.clientY - r.top) / r.height;
  stage.classList.add("zoomed");
  stage.scrollTo(fx * img.offsetWidth - stage.clientWidth / 2, fy * img.offsetHeight - stage.clientHeight / 2);
});

document.addEventListener("keydown", (e) => {
  if (current < 0) return;
  if (e.key === "Escape" && overlay) closeOverlay(false);
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
