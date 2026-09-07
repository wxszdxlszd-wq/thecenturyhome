# The Old House Playbook — thecenturyhome.com (v6)

A zero-build static site: **free tools → Ko-fi checkout → password unlock → member kit preview**,
for owners renovating century homes.

**Design language (v6):** pure white × black ink × champagne gold accent, Geist type
(no decorative serifs), static professional layout (no scroll tricks). All imagery is
**WEBP**, keyword-named for SEO (e.g. `century-home-knob-and-tube-wiring-attic.webp`),
each image used exactly **once** across the whole site, with descriptive keyword alt-text.
Person/lifestyle photos are real photographs from Wikimedia Commons (see `photos-credits.txt`
for license attribution); interiors are Unsplash-licensed.
Pages carry canonical URLs + JSON-LD (WebSite/Organization/Product; Article + FAQPage on posts).
The product page (The Kit) uses a McKinsey-style modular layout: proof hero, seven-step
flow, 90-day process diagram, owner storyboard case, real sample tables with a free
downloadable PDF, and restore-first finish gallery.

## Page map

| Path | Purpose |
|---|---|
| `/` | Home — single-line hero photo deck (same horizontal line; drag with the mouse or use arrows to flip pages, click a photo to center and enlarge), free tools, 12-image before/after gallery, Kit section, bright purchase band at the bottom (the ONE place pricing appears) |
| `/blog/` | The Blog — 7 horizontal (image-left) post rows, no pricing |
| `/blog/mistakes.html` etc. | 6 long-form articles (1,780–1,990 words each) + `/compare/contractor-vs-diy.html` — unique images per article, Article + FAQPage schema |
| `/free/audit-checklist.html` | Free printable 30-minute audit (no pricing) |
| `/tools/budget-calculator.html` | Interactive estimator (no pricing) |
| `/unlock.html` | Password unlock (demo: `Ch2-Reno-2026!`) |
| `/member/kit.html` | The Kit — free preview page: 7 chapter samples with real tables, full chapter list, price gate (sales page), and password unlock that renders all 13 chapters from `member/content/kit.json` |

## Local preview

```bash
python -m http.server 7799
# then open http://127.0.0.1:7799
# demo member password: Ch2-Reno-2026!
```

## Deploy on GitHub Pages (static)

1. Create a repo and push this folder:
   ```bash
   git init
   git add .
   git commit -m "The Old House Playbook — v6"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. Repo → **Settings → Pages → Source: GitHub Actions** (the included
   `.github/workflows/deploy.yml` builds & publishes automatically on push).
3. The site is fully static — Vercel / Netlify / Cloudflare Pages also work
   with zero config.

**Domain:** `thecenturyhome.com` is baked into canonical links, sitemap and
JSON-LD. If you deploy elsewhere (or on a `username.github.io/repo` sub-path),
update the canonical links in every `<head>`, `sitemap.xml` and `robots.txt`.
All CSS/JS paths are relative — no change needed for sub-path deploys.

## Before launch

1. `assets/js/config.js` — point `gumroadUrl`/`kofiUrl` at the live Ko-fi product
   (already set to the existing one); `unlockHash` matches the password sent in
   Ko-fi delivery. Demo password `Ch2-Reno-2026!` — regenerate hash before launch:
   `echo -n "YOUR_PASSWORD" | shasum -a 256`
2. Email capture (`formEndpoint`) — add a Formspree-style endpoint or leave empty
   (the "already open" fallback shows).
3. `sitemap.xml` references the live domain — keep as is.
4. images: Unsplash license (free commercial use, no attribution required). Credit
   photos in the site about area if you publish publicly.

## Content editing

- Kit chapters → `member/content/kit.json` (the deck renders `lockedSlides` by id).
- Journal articles → `blog/*.html` directly.
- Budget figures → `assets/js/calculator.js` (`SCOPE_RATES`, `RESERVE_RATES`, `ERA_MULT`).
- Pricing → `index.html #pricing` + `config.js`.