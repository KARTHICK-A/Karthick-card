# Karthick A — contact card

Static single page for trade fairs. The hero is a vCard QR: scanning it with a
plain phone camera opens the native add-contact sheet. No framework, no build
step at runtime, no CDN — it works on blocked conference wifi and offline after
the first visit.

**Deploy:** import this repo on Vercel, Framework Preset **Other**, root
directory left at the repo root. `vercel.json` sets `text/vcard` on
`contact.vcf`.

## Files

| Path | What it is |
|---|---|
| `index.html` | the page — CSS and JS inline |
| `contact.vcf` | generated — full vCard |
| `print.html` | generated — business card (28 mm code) + two A5 table tents (60 mm) |
| `details.html` → `Karthick-A-details.pdf` | generated — one-page profile |
| `Karthick-A-resume.pdf` | résumé |
| `sw.js` | generated — offline cache, version derived from asset hashes |
| `og.png` | generated — 1200×630 link preview |
| `vendor/qrcode.js` | qrcode-generator 2.0.4, MIT, vendored |
| `fonts/` | Unbounded + IBM Plex Mono, latin subsets, self-hosted |
| `build/data.mjs` | **the only place contact details are edited** |

## Rebuilding

```sh
node build/build.mjs          # contact.vcf, print.html, sw.js
node build/details.mjs        # details.html
node build/pdf.mjs            # Karthick-A-details.pdf  (needs playwright)
node build/og.mjs && python3 build/og.py   # og.png (needs Pillow, fonttools, brotli)
node build/build.mjs          # re-run so sw.js hashes the new files
```

After the first deploy, point the print sheet and the PDF at the real address:

```sh
CARD_URL=https://<project>.vercel.app/ node build/build.mjs
CARD_URL=https://<project>.vercel.app/ node build/details.mjs && node build/pdf.mjs
```

The **page** QR shown in the browser is built from `location` at runtime, so it
is always correct wherever the page is served. `CARD_URL` only affects the
printed sheet and the PDF footer.

## Known limits

- The contact QR is **version 12** (65 modules) because the vCard carries two
  email addresses. Dropping the business address would bring it back to v11.
- `og.png` and the PDFs are committed, because building them needs tools that
  are not part of the site's runtime.
