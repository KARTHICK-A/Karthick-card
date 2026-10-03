// Generates everything that is cheap and deterministic:
//   contact.vcf · print.html · the site pages (see site.mjs) · sw.js
// Run:  node build/build.mjs        (optionally CARD_URL=... to re-point the printed codes)
import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD_URL, person, vcardQR, vcardFile } from './data.mjs';
import { make, version, qrSvg } from './qr.mjs';
import { buildSite } from './site.mjs';
import { projects } from './content.mjs';

export { make, version };   // kept for scripts that still import them from here

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const qrCard = make(vcardQR);
const qrPage = make(CARD_URL);
const code = (c, mm, label) => qrSvg(c, { mm, label, cls: 'qr' });

writeFileSync(join(ROOT, 'contact.vcf'), vcardFile, 'utf8');

const print = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Print sheet — Karthick A</title>
<link rel="icon" href="assets/img/icons/icon.svg" type="image/svg+xml">
<style>
  @page{size:A4;margin:12mm}
  html{background:#f2f4f8}
  body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#000;font-size:10pt}
  .sheet{background:#fff;max-width:186mm;margin:0 auto;padding:10mm}
  .back{display:inline-block;margin:0 0 6mm;padding:2mm 0;color:#0a6f79;font-size:9pt}
  h1{font-size:12pt;margin:0 0 2mm}
  p.note{font-size:8.5pt;color:#444;margin:0 0 8mm;max-width:120mm}
  .piece{border:0.2mm dashed #9aa;padding:4mm;margin:0 0 10mm;display:inline-block;vertical-align:top}
  .piece figcaption{font-size:7.5pt;color:#555;margin:3mm 0 0;letter-spacing:.06em}
  .card{width:85mm;height:55mm;padding:5mm;display:flex;gap:5mm;align-items:center}
  .card .who{font-size:8.5pt;line-height:1.45}
  .card .who b{font-size:11pt;display:block;margin:0 0 1mm}
  .tent{width:148mm;padding:8mm;text-align:center}
  .tent .who{font-size:13pt;line-height:1.5;margin:0 0 5mm}
  .tent .who b{font-size:20pt;display:block}
  .tent .who.sm{font-size:9pt;margin:4mm 0 0}
  .qr{display:block}
  .tent .qr{margin:0 auto}
  @media screen and (max-width:720px){.sheet{padding:5mm}.piece{display:block;max-width:100%;overflow-x:auto}}
  @media print{html,body{background:#fff}.sheet{padding:0;max-width:none}.piece{border-color:#ccc}.back{display:none}}
</style>
</head>
<body>
<div class="sheet">
  <a class="back" href="index.html">Back to the card</a>
  <h1>Karthick A — print sheet</h1>
  <p class="note">Print at 100% scale (no "fit to page"), on A4. Dashed rules are cut guides, not crop
  marks — trim just inside them so no line remains. Codes are vector, so they print at the full
  resolution of the printer. The table-tent code is 60&nbsp;mm and scans from about 2&nbsp;m;
  the business-card code is 28&nbsp;mm and scans at arm's length.</p>

  <figure class="piece">
    <div class="card">
      ${code(qrCard, 28, 'Contact QR code for Karthick A')}
      <div class="who"><b>Karthick A</b>Embedded Systems Engineer<br>Spark Invotech Pvt Ltd<br>
      ${person.phone}<br>${person.email}</div>
    </div>
    <figcaption>BUSINESS CARD 85 × 55 MM — CONTACT CODE</figcaption>
  </figure>

  <figure class="piece">
    <div class="tent">
      <p class="who"><b>Karthick A</b>Embedded Systems Engineer · Spark Invotech Pvt Ltd</p>
      ${code(qrCard, 60, 'Contact QR code for Karthick A')}
      <p class="who sm">SCAN TO SAVE MY CONTACT</p>
    </div>
    <figcaption>A5 TABLE TENT — CONTACT CODE</figcaption>
  </figure>

  <figure class="piece">
    <div class="tent">
      ${code(qrPage, 60, 'QR code linking to the contact page of Karthick A')}
      <p class="who sm">ALL MY LINKS<br>${CARD_URL.replace(/^https?:\/\//, '')}</p>
    </div>
    <figcaption>A5 TABLE TENT — PAGE LINK CODE</figcaption>
  </figure>
</div>
</body>
</html>
`;
writeFileSync(join(ROOT, 'print.html'), print, 'utf8');

// Pages, sitemap, robots, manifest.
const pages = buildSite();

// ---- offline cache ----------------------------------------------------------
// CORE is fetched at install (all-or-nothing, small). EXTRA is best-effort: the
// card thumbnails. Full-size photos are cached the first time they are opened.
// The cache version is derived from the files themselves, so shipping a change
// always invalidates the old cache and never needs a manual bump.
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true })
  .flatMap((d) => d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]);
const core = [
  ...pages, 'print.html', 'contact.vcf', 'og.png', 'portrait.webp', 'manifest.webmanifest',
  'Karthick-A-details.pdf', 'Karthick-A-resume.pdf',
  'assets/site.css', 'assets/site.js', 'assets/theme.js', 'assets/img/icons/icon.svg', 'assets/img/icons/icon-192.png',
  'vendor/qrcode.js', ...walk('fonts').filter((f) => f.endsWith('.woff2')),
];
const extra = [...new Set(projects.flatMap((p) => p.photos.map((ph) => ph.srcSm)))];
const h = createHash('sha256');
for (const a of [...core, ...extra]) h.update(existsSync(join(ROOT, a)) ? readFileSync(join(ROOT, a)) : a);
const CACHE = 'karthick-card-' + h.digest('hex').slice(0, 10);

writeFileSync(join(ROOT, 'sw.js'), `// generated by build/build.mjs — do not edit
const CACHE='${CACHE}';
const CORE=${JSON.stringify(['./', ...core])};
const EXTRA=${JSON.stringify(extra)};
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await c.addAll(CORE);
    await Promise.allSettled(EXTRA.map(u=>c.add(u)));
  }).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
const keep=(req,res)=>{ if(res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); } return res; };
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||req.headers.has('range'))return;
  if(new URL(req.url).origin!==location.origin)return;
  if(req.mode==='navigate'){
    // Pages: network first so a redeploy shows up immediately, but never wait
    // more than 3.5 s on bad conference wifi — fall back to the cached copy.
    e.respondWith(new Promise((ok,no)=>{
      const t=setTimeout(no,3500);
      fetch(req).then(r=>{clearTimeout(t);ok(r);},err=>{clearTimeout(t);no(err);});
    }).then(r=>keep(req,r)).catch(()=>caches.match(req).then(hit=>hit||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>keep(req,r))));
});
`, 'utf8');

console.log('contact QR : version %d, %d modules, %d bytes',
  version(qrCard), qrCard.getModuleCount(), Buffer.byteLength(vcardQR));
console.log('page QR    : version %d, %d modules — %s',
  version(qrPage), qrPage.getModuleCount(), CARD_URL);
console.log('pages      : %d  (%s)', pages.length, pages.join(', '));
console.log('cache      :', CACHE, `(${core.length} core + ${extra.length} extra files)`);
