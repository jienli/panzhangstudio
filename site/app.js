// Behavior on top of the pre-built pages (tools/build.js writes the HTML).
// Gallery pages: filters, and paintings open in an overlay while the address bar shows
// the painting's own page. Painting pages: zoom, framed view, arrow keys.

const lang = document.documentElement.lang === "zh" ? "zh" : "en";
const $ = (sel) => document.querySelector(sel);
const indexOf = (id) => WORKS.findIndex((w) => w.id === id);

/* ---------- analytics (PostHog, cookieless; set up in the page <head>) ---------- */
function trackPainting(i, how) {
  const w = WORKS[i];
  if (window.posthog && w) {
    posthog.capture("painting_viewed", { painting: w.id, title: w.title.en, title_zh: w.title.zh, category: w.category, how });
  }
}

// Clicks on an email link: the footer, or "Ask about this piece" on a painting.
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="mailto:"]');
  if (!a || !window.posthog) return;
  const id = a.closest(".viewer") ? WORKS[current]?.id : null;
  posthog.capture("inquiry_clicked", { painting: id, where: id ? "painting" : "footer" });
});

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

/* ---------- gallery layout ---------- */
// Masonry packing on a grid of 4px rows. Paintings go, in list order, into the shortest
// column (wide ones into the lowest pair of columns). A full-width painting waits until
// the columns are roughly level, letting the next paintings fill the shorter columns
// first, so it never leaves a hole above it. Recomputed when the gallery's width changes
// or a filter is applied; without JS the gallery is a plain grid.
const grid = $("#gallery-grid");
const ROW = 4;
function layoutGallery() {
  if (!grid) return;
  const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  const cards = [...grid.querySelectorAll(".card")].filter((c) => !c.hidden);
  grid.classList.add("masonry");

  // Measure each card at its final width.
  const items = cards.map((c) => {
    const want = c.dataset.span === "full" ? cols : Math.min(Number(c.dataset.span) || 1, cols);
    c.style.gridColumn = `span ${want}`;
    c.style.gridRow = "auto";
    return { c, span: want };
  });
  for (const it of items) {
    const h = it.c.getBoundingClientRect().height + parseFloat(getComputedStyle(it.c).marginBottom);
    it.rows = Math.ceil(h / ROW);
  }

  const heights = new Array(cols).fill(0);
  const place = (it) => {
    let best = 0, bestTop = Infinity;  // leftmost run of columns whose tallest is lowest
    for (let c = 0; c + it.span <= cols; c++) {
      const top = Math.max(...heights.slice(c, c + it.span));
      if (top < bestTop) { best = c; bestTop = top; }
    }
    it.c.style.gridColumn = `${best + 1} / span ${it.span}`;
    it.c.style.gridRow = `${bestTop + 1} / span ${it.rows}`;
    for (let c = best; c < best + it.span; c++) heights[c] = bestTop + it.rows;
  };
  const uneven = () => Math.max(...heights) - Math.min(...heights);

  const queue = items.slice();
  while (queue.length) {
    let it = queue[0];
    if (it.span === cols && cols > 1 && uneven() > 40) {
      // Fill shorter columns with the next narrower painting that doesn't overshoot by much.
      const room = Math.max(...heights) - Math.min(...heights);
      const k = queue.findIndex((x) => x.span < cols && x.rows <= room * 1.35);
      if (k > 0) it = queue[k];
    }
    queue.splice(queue.indexOf(it), 1);
    place(it);
  }
}
if (grid) {
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w !== lastWidth) { lastWidth = w; layoutGallery(); }
  }).observe(grid);
  if (document.fonts) document.fonts.ready.then(layoutGallery);
}

/* ---------- gallery filters ---------- */
document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
  const f = b.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  document.querySelectorAll("#gallery-grid .card").forEach((c) => {
    c.hidden = f !== "all" && c.dataset.category !== f;
  });
  layoutGallery();
}));

/* ---------- painting view (overlay or page) ---------- */
const overlay = $("#viewer:not(.page)");
const pageView = $(".viewer.page");
let current = pageView ? indexOf(pageView.dataset.workPage) : -1;
let framedView = false;
const homeTitle = document.title;
if (pageView) trackPainting(current, "page");

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
  if (push) {
    history.pushState({ work: WORKS[i].id }, "", workPath(WORKS[i], lang));
    trackPainting(i, "opened");
  }
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
  trackPainting(i, "browsed");
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
