# 张磐 Zhang Pan — painting site

Plain HTML/CSS/JS, no build step.

- **Preview:** `python3 -m http.server 8420 --directory site`, then open http://localhost:8420
- **Publish:** every push to `main` publishes `site/` to https://panzhangstudio.com via GitHub Pages (see `.github/workflows/deploy.yml`).
- **Add a painting:** put `name.jpg` (about 2000px on the long side) and `name-sm.jpg` (about 900px) in `site/images/`, then add an entry to `WORKS` in `site/works.js`. Unknown fields can stay `null`; they show as "to be added".
- **Edit text:** page wording (both languages) is in `STRINGS` at the top of `site/app.js`.
- **Contact email:** `SITE.contactEmail` in `site/works.js` (empty hides the contact links).
