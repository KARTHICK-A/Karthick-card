# Karthick A — contact card

A static site for trade fairs. The home page is built around a vCard QR: scanning
it with a plain phone camera opens the native add-contact sheet. Around it sit
the quick actions, a project showcase with a detail page per project, a profile
page, and every contact detail with a copy button. No framework, no runtime build
step, no CDN, no third-party requests — it works on blocked conference wifi and
offline after the first visit.

**Deploy:** import this repo on Vercel, Framework Preset **Other**, root
directory left at the repo root. `vercel.json` sets the vCard, manifest and
security headers.

## Pages

| URL | What it is |
|---|---|
| `index.html` | the card: identity, scannable code (contact / this page), save + share, call / WhatsApp / email, featured work, contact details, links, documents |
| `work.html` | all seven projects as cards |
| `work/<slug>.html` | one page per project: problem, constraints, outcome, at-a-glance facts, tech, photos with a lightbox, previous / next |
| `about.html` | profile: scope of work, key figures, capabilities, background |
| `404.html` | not-found page (uses root-absolute URLs, so it works at any depth) |
| `print.html` | business card (28 mm code) + two A5 table tents (60 mm) |
| `Karthick-A-details.pdf`, `Karthick-A-resume.pdf` | one-page profile and résumé |

Pages use relative URLs only, so the site works from any path.

## Where things are edited

| Path | What it is |
|---|---|
| `build/data.mjs` | **contact details** — vCard, QR payload, contact / link / document rows |
| `build/content.mjs` | **project and profile copy** — taken from the owner's portfolio; read its header comment before editing |
| `build/site.mjs` | page templates (home, work, projects, about, 404, sitemap, robots, manifest) |
| `build/qr.mjs` | QR helpers shared by all generators |
| `assets/site.css`, `assets/site.js`, `assets/theme.js` | hand-written design system and behaviour (not generated) |
| `assets/img/work/` | project photos: `x.webp` (1200 px, lightbox) and `x-sm.webp` (720 px, cards) |
| `assets/img/icons/` | favicon and app icons |
| `fonts/` | Unbounded, IBM Plex Sans and IBM Plex Mono, latin subsets, self-hosted (IBM Plex: SIL OFL, see `fonts/IBM-Plex-OFL.txt`) |
| `vendor/qrcode.js` | qrcode-generator 2.0.4, MIT, vendored |

Generated — do not edit: `index.html`, `work.html`, `about.html`, `404.html`,
`work/*.html`, `contact.vcf`, `print.html`, `sitemap.xml`, `robots.txt`,
`manifest.webmanifest`, `sw.js`, `details.html`.

## Rebuilding

```sh
node build/build.mjs          # pages, contact.vcf, print.html, sitemap, manifest, sw.js
node build/details.mjs        # details.html (PDF source)
node build/pdf.mjs            # Karthick-A-details.pdf  (needs playwright)
node build/og.mjs && python3 build/og.py   # og.png (needs Pillow, fonttools, brotli)
node build/build.mjs          # re-run so sw.js hashes the new files
```

`node build/build.mjs` is the one you need after changing contact details,
project copy or page templates. The PDF and `og.png` only need rebuilding when
the profile data or the card's look changes; they are committed because building
them needs tools that are not part of the site's runtime.

To preview locally, serve the folder with any static server
(`python3 -m http.server`) — the service worker needs `http://localhost`, not
`file://`.

Printed codes and the PDF footer point at the live address, set in
`build/data.mjs` or overridden per run:

```sh
CARD_URL=https://karthick-card.vercel.app/ node build/build.mjs
```

The **page** QR shown in the browser is built from `location` at runtime, so it
is always correct wherever the page is served. `CARD_URL` only affects the
printed sheet, the PDF footer, canonical URLs, the sitemap and social previews.

## How it behaves

- **Without JavaScript** every page still reads, every link works, and the
  contact QR (rendered into the HTML at build time) still scans. The mode
  toggle, share, copy and theme buttons need JavaScript and are hidden without it.
- **Offline:** `sw.js` precaches all pages, styles, fonts, the vCard and PDFs at
  install, plus the card thumbnails best-effort. Pages are fetched network-first
  (a redeploy shows immediately) with a 3.5 s cut-off before falling back to the
  cache. Full-size photos are cached the first time they are opened; offline, the
  lightbox shows the cached thumbnail instead. The cache name is a hash of the
  files, so shipping a change invalidates the old cache without a manual bump.
- **Themes:** dark by default, light follows the OS, and the header toggle
  overrides and remembers the choice. The QR plate is always black on white.
- **Security:** each page carries a strict Content-Security-Policy (`<meta>`;
  same-origin only, no inline script or style). Keep it that way — new
  behaviour goes in `assets/site.js`, new styling in `assets/site.css`.
- **Accessibility:** skip link, landmarks, one `h1` per page, labelled controls,
  touch targets of 44 px or more (breadcrumbs: 32 px), visible focus, `prefers-reduced-motion`, keyboard-operable
  lightbox with focus return. Contrast is measured in `assets/site.css`'s header.

## Known limits

- The contact QR is **version 12** (65 modules) because the vCard carries two
  email addresses. Dropping the business address would bring it back to v11.
- Project text and photos come from the owner's portfolio. That portfolio's own
  notes list "confirm the three client names may be shown publicly" as open;
  the client names appear on U5–U7 and in `build/content.mjs`.
- `build/data.mjs` lists two email addresses; the portfolio's own JSON-LD lists a
  different one. Confirm which are current.
- The vCard download is served with `Content-Disposition: attachment`; how each
  phone handles it was not tested on devices.
